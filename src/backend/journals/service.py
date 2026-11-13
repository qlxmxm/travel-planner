from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Optional

from backend.journals.crud import JournalCrud, JournalItemCrud, JournalCommentCrud
from backend.journals.schema import JournalCreate, JournalItemCreate, JournalUpdate

# 참고: 여행 계획(Plan)을 조회하기 위한 모델 또는 CRUD (실제 프로젝트 경로에 맞게 수정하세요)
# from backend.plans.crud import PlanCrud, PlanItemCrud


class JournalService:
    @staticmethod
    def create_journal_from_plan(
        db: Session, 
        plan_id: int, 
        user_id: int,
        custom_title: Optional[str] = None
    ):
        """
        내가 세운 여행 계획(Plan)과 그 세부 일정(PlanItem)을 복사하여
        새로운 여행기(Journal)와 여행기 세부 일정(JournalItem)으로 저장합니다.
        """
        # 1. 원본 '여행 계획(Plan)' 및 '계획 세부 일정(PlanItem)' 조회
        # (실제 사용 중인 Plan 조회 CRUD나 쿼리로 교체해 주세요)
        plan = PlanCrud.get(db, plan_id)
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="해당 여행 계획을 찾을 수 없습니다."
            )

        # 본인 소유의 여행 계획인지 확인 (필요 시 사용)
        if hasattr(plan, "user_id") and plan.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="본인의 여행 계획만 여행기로 변환할 수 있습니다."
            )

        plan_items = PlanItemCrud.get_by_plan(db, plan_id)

        try:
            # 2. 여행 계획(Plan) 데이터를 여행기(JournalCreate) 스키마에 맞게 매핑
            # (왼쪽은 Journal 컬럼명, 오른쪽은 Plan 컬럼명에 맞게 수정하세요)
            journal_data = JournalCreate(
                user_id=user_id,
                plan_id=plan.p_id,  # 어느 계획에서 파생된 여행기인지 연결 (해당 컬럼이 있다면 유지)
                j_title=custom_title if custom_title else plan.p_title,
                j_start_date=plan.p_start_date,
                j_end_date=plan.p_end_date,
                j_content=""  # 여행 후 소감이나 본문은 처음엔 빈 값으로 생성
            )

            # 3. 여행기(Journal) 생성 (flush를 통해 새 j_id 발급)
            new_journal = JournalCrud.create(db, journal_data)

            # 4. 계획 세부 일정(PlanItem)들을 순회하며 여행기 세부 일정(JournalItem)으로 복사
            for p_item in plan_items:
                journal_item_data = JournalItemCreate(
                    j_id=new_journal.j_id,       # 방금 생성된 여행기 ID 연결
                    ji_day=p_item.pi_day,        # 일차 복사
                    ji_order=p_item.pi_order,    # 순서 복사
                    ji_place=p_item.pi_place,    # 장소명 복사
                    ji_memo=""                   # 여행기에서 쓸 후기/사진 메모는 초기값 세팅
                )
                JournalItemCrud.create(db, journal_item_data)

            # 5. 여행기 본문과 모든 세부 일정 복사가 완료되면 최종 커밋
            db.commit()
            db.refresh(new_journal)
            return new_journal

        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"여행 계획을 여행기로 변환하는 중 오류가 발생했습니다: {str(e)}"
            )
