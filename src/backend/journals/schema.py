from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Optional

from backend.journals.crud import JournalCrud, JournalItemCrud, JournalCommentCrud
from backend.journals.schema import (
    JournalCreate, JournalUpdate,
    JournalItemCreate, JournalItemUpdate,
    JournalCommentCreate, JournalCommentUpdate
)
# 실제 프로젝트의 Plan 조회 CRUD 경로에 맞게 수정하세요
# from backend.plans.crud import PlanCrud, PlanItemCrud


class JournalService:
    # ==========================================
    # 1. 여행 계획(Plan) 복사 -> 일지(Journal) 생성 및 관리
    # ==========================================
    @staticmethod
    def create_journal_from_plan(
        db: Session,
        p_id: str,
        u_id: int,
        journal_in: Optional[JournalUpdate] = None,
        items_in: Optional[List[JournalItemCreate]] = None
    ):
        """
        내가 세운 여행 계획(Plan)과 세부 일정(PlanItem)을 복사하여
        새로운 일지(Journal)와 일지 세부 일정(JournalItem)으로 저장합니다.
        """
        # 1. 원본 여행 계획 조회
        plan = PlanCrud.get(db, p_id)
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="해당 여행 계획을 찾을 수 없습니다."
            )

        # 본인 계획인지 확인 (Plan 모델의 유저 ID 컬럼이 u_id라고 가정)
        if hasattr(plan, "u_id") and plan.u_id != u_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="본인의 여행 계획만 일지로 생성할 수 있습니다."
            )

        plan_items = PlanItemCrud.get_by_plan(db, p_id)

        try:
            # 2. JournalCreate 스키마에 정확히 맞춰 일지 본문 데이터 생성
            # (사용자가 별도로 입력한 제목/소개/사진/지역이 있으면 우선 적용, 없으면 Plan 값 사용)
            journal_data = JournalCreate(
                p_id=p_id,
                u_id=u_id,
                j_title=(journal_in.j_title if journal_in and journal_in.j_title else plan.p_title),
                j_intro=(journal_in.j_intro if journal_in else None),
                j_photo=(journal_in.j_photo if journal_in else None),
                loc=(journal_in.loc if journal_in and journal_in.loc else getattr(plan, "loc", None))
            )
            new_journal = JournalCrud.create(db, journal_data)

            # 3. JournalItemCreate 스키마에 정확히 맞춰 세부 일정 복사
            # (주의: 스키마상 ji_rating은 필수값(ge=1, le=5)이므로 PlanItem에 없다면 기본값 5 부여)
            for p_item in plan_items:
                item_data = JournalItemCreate(
                    j_id=new_journal.j_id,
                    ji_day=p_item.pi_day,
                    ji_order=p_item.pi_order,
                    ji_time=getattr(p_item, "pi_time", None),
                    ji_title=p_item.pi_title,
                    ji_content=getattr(p_item, "pi_content", None),
                    ji_photo=None,
                    ji_rating=5  # 필수 필드(ge=1, le=5) 제약 조건 충족을 위한 초기값
                )
                JournalItemCrud.create(db, item_data)

            db.commit()
            db.refresh(new_journal)
            return new_journal

        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"일지 생성 중 오류가 발생했습니다: {str(e)}"
            )

    @staticmethod
    def get_journal_detail(db: Session, j_id: int):
        """일지 본문 + 세부 일정 + 댓글 목록 조회"""
        journal = JournalCrud.get(db, j_id)
        if not journal:
            raise HTTPException(status_code=404, detail="일지를 찾을 수 없습니다.")

        return {
            "journal": journal,
            "items": JournalItemCrud.get_by_journal(db, j_id),
            "comments": JournalCommentCrud.get_by_journal(db, j_id)
        }

    @staticmethod
    def update_journal(db: Session, j_id: int, journal_update: JournalUpdate, current_u_id: int):
        """일지 본문 수정 (작성자 u_id 검증)"""
        journal = JournalCrud.get(db, j_id)
        if not journal:
            raise HTTPException(status_code=404, detail="일지를 찾을 수 없습니다.")

        if journal.u_id != current_u_id:
            raise HTTPException(status_code=403, detail="일지 수정 권한이 없습니다.")

        try:
            updated = JournalCrud.update(db, j_id, journal_update)
            db.commit()
            db.refresh(updated)
            return updated
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))

    @staticmethod
    def delete_journal(db: Session, j_id: int, current_u_id: int):
        """일지 삭제 (작성자 u_id 검증)"""
        journal = JournalCrud.get(db, j_id)
        if not journal:
            raise HTTPException(status_code=404, detail="일지를 찾을 수 없습니다.")

        if journal.u_id != current_u_id:
            raise HTTPException(status_code=403, detail="일지 삭제 권한이 없습니다.")

        try:
            JournalCrud.delete(db, j_id)
            db.commit()
            return {"message": "일지가 삭제되었습니다."}
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))

    # ==========================================
    # 2. 일지 세부 일정(JournalItem) 수정/추가/삭제 서비스
    # ==========================================
    @staticmethod
    def update_journal_item(db: Session, ji_id: int, item_update: JournalItemUpdate, current_u_id: int):
        """복사된 세부 일정에 후기(ji_content), 사진(ji_photo), 별점(ji_rating) 등을 수정"""
        item = JournalItemCrud.get(db, ji_id)
        if not item:
            raise HTTPException(status_code=404, detail="세부 일정을 찾을 수 없습니다.")

        journal = JournalCrud.get(db, item.j_id)
        if not journal or journal.u_id != current_u_id:
            raise HTTPException(status_code=403, detail="세부 일정 수정 권한이 없습니다.")

        try:
            updated_item = JournalItemCrud.update(db, ji_id, item_update)
            db.commit()
            db.refresh(updated_item)
            return updated_item
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))

    # ==========================================
    # 3. 일지 댓글(JournalComment) 서비스
    # ==========================================
    @staticmethod
    def create_comment(db: Session, comment_in: JournalCommentCreate):
        """댓글 작성 (스키마에 이미 j_id, u_id, jc_content가 모두 포함되어 있음)"""
        if not JournalCrud.get(db, comment_in.j_id):
            raise HTTPException(status_code=404, detail="댓글을 작성할 일지가 존재하지 않습니다.")

        try:
            new_comment = JournalCommentCrud.create(db, comment_in)
            db.commit()
            db.refresh(new_comment)
            return new_comment
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))

    @staticmethod
    def update_comment(db: Session, jc_id: int, comment_update: JournalCommentUpdate, current_u_id: int):
        """댓글 수정 (작성자 u_id 검증)"""
        comment = JournalCommentCrud.get(db, jc_id)
        if not comment:
            raise HTTPException(status_code=404, detail="댓글을 찾을 수 없습니다.")

        if comment.u_id != current_u_id:
            raise HTTPException(status_code=403, detail="댓글 수정 권한이 없습니다.")

        try:
            updated_comment = JournalCommentCrud.update(db, jc_id, comment_update)
            db.commit()
            db.refresh(updated_comment)
            return updated_comment
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))

    @staticmethod
    def delete_comment(db: Session, jc_id: int, current_u_id: int):
        """댓글 삭제 (작성자 u_id 검증)"""
        comment = JournalCommentCrud.get(db, jc_id)
        if not comment:
            raise HTTPException(status_code=404, detail="댓글을 찾을 수 없습니다.")

        if comment.u_id != current_u_id:
            raise HTTPException(status_code=403, detail="댓글 삭제 권한이 없습니다.")

        try:
            JournalCommentCrud.delete(db, jc_id)
            db.commit()
            return {"message": "댓글이 삭제되었습니다."}
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))
