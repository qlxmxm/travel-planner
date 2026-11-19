from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Optional

from backend.journals.crud import JournalCrud, JournalItemCrud, JournalCommentCrud
from backend.journals.schema import (
    JournalCreate, JournalUpdate,
    JournalItemCreate, JournalItemUpdate,
    JournalCommentCreate, JournalCommentUpdate
)
from backend.location.models import Location
from backend.plans.models import Plans, plan_details


class JournalService:
    # ==========================================
    # 1. 여행기(Journal) 서비스 (계획 복사 생성 및 관리)
    # ==========================================
    @staticmethod
    def _get_own_plan(db: Session, plan_id: int, user_id: int) -> Plans:
        """계획을 찾고, 본인의 계획인지 확인합니다."""
        plan = db.query(Plans).filter(Plans.p_id == plan_id).first()
        if not plan:
            raise HTTPException(status_code=404, detail="해당 여행 계획을 찾을 수 없습니다.")
        if plan.u_id != user_id:
            raise HTTPException(status_code=403, detail="본인의 여행 계획만 변환할 수 있습니다.")
        return plan

    @staticmethod
    def _get_plan_details(db: Session, plan_id: int) -> list:
        """계획의 상세 일정을 방문 시간, 순서 순으로 가져옵니다."""
        return (
            db.query(plan_details)
            .filter(plan_details.p_id == plan_id)
            .order_by(plan_details.visit_time, plan_details.orders)
            .all()
        )

    @staticmethod
    def _calc_day(plan: Plans, detail) -> int:
        """계획 시작일 기준 몇째 날인지 계산합니다 (1일차부터, 시간이 없으면 1일차)."""
        if not detail.visit_time:
            return 1
        return max((detail.visit_time.date() - plan.p_start.date()).days + 1, 1)

    @staticmethod
    def _make_item_title(db: Session, detail) -> str:
        """일정 제목: 장소 이름 > 메모 > 기본값 순으로 정합니다."""
        if detail.l_id:
            place = db.query(Location).filter(Location.l_id == detail.l_id).first()
            if place:
                return place.l_name
        return detail.memo or "일정"

    @staticmethod
    def create_journal_from_plan(
        db: Session,
        plan_id: int,
        user_id: int,
        custom_title: Optional[str] = None
    ):
        """내가 세운 여행 계획(plans)과 상세 일정(plan_details)을 복사해 여행기로 저장합니다."""
        plan = JournalService._get_own_plan(db, plan_id, user_id)
        details = JournalService._get_plan_details(db, plan_id)

        try:
            new_journal = JournalCrud.create(db, JournalCreate(
                p_id=plan.p_id,
                u_id=user_id,
                j_title=custom_title or plan.p_title,
                loc=plan.loc,
            ))

            for detail in details:
                JournalItemCrud.create(db, JournalItemCreate(
                    j_id=new_journal.j_id,
                    ji_day=JournalService._calc_day(plan, detail),
                    ji_order=detail.orders,
                    ji_time=detail.visit_time,
                    ji_title=JournalService._make_item_title(db, detail),
                    ji_content=detail.memo,
                ))

            db.commit()
            db.refresh(new_journal)
            return new_journal

        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"여행기 생성 오류: {str(e)}")

    @staticmethod
    def get_journal_detail(db: Session, j_id: int):
        """여행기 본문 + 세부 일정 + 댓글 목록을 한 번에 조회합니다."""
        journal = JournalCrud.get(db, j_id)
        if not journal:
            raise HTTPException(status_code=404, detail="여행기를 찾을 수 없습니다.")

        return {
            "journal": journal,
            "items": JournalItemCrud.get_by_journal(db, j_id),
            "comments": JournalCommentCrud.get_by_journal(db, j_id)
        }

    # ==========================================
    # 2. 여행기 댓글(JournalComment) 서비스
    # ==========================================
    @staticmethod
    def create_comment(db: Session, j_id: int, comment_data: JournalCommentCreate):
        """특정 여행기(j_id)에 새 댓글을 작성합니다."""
        # 댓글을 달 여행기가 존재하는지 먼저 확인
        if not JournalCrud.get(db, j_id):
            raise HTTPException(status_code=404, detail="댓글을 작성할 여행기가 존재하지 않습니다.")

        try:
            # 스키마에 j_id를 세팅하여 생성 (스키마 구조에 따라 조정 가능)
            comment_dict = comment_data.model_dump()
            comment_dict["j_id"] = j_id
            new_comment_schema = JournalCommentCreate(**comment_dict)

            new_comment = JournalCommentCrud.create(db, new_comment_schema)
            db.commit()
            db.refresh(new_comment)
            return new_comment
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"댓글 작성 오류: {str(e)}")

    @staticmethod
    def get_comments_by_journal(db: Session, j_id: int):
        """특정 여행기의 댓글 목록만 따로 조회합니다."""
        if not JournalCrud.get(db, j_id):
            raise HTTPException(status_code=404, detail="여행기를 찾을 수 없습니다.")
        return JournalCommentCrud.get_by_journal(db, j_id)

    @staticmethod
    def update_comment(db: Session, jc_id: int, comment_update: JournalCommentUpdate, current_user_id: int):
        """본인이 작성한 댓글인지 확인 후 수정합니다."""
        comment = JournalCommentCrud.get(db, jc_id)
        if not comment:
            raise HTTPException(status_code=404, detail="댓글을 찾을 수 없습니다.")

        # 작성자 본인 확인 (journals_comment 의 작성자 컬럼은 u_id)
        if comment.u_id != current_user_id:
            raise HTTPException(status_code=403, detail="본인의 댓글만 수정할 수 있습니다.")

        try:
            updated_comment = JournalCommentCrud.update(db, jc_id, comment_update)
            db.commit()
            db.refresh(updated_comment)
            return updated_comment
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"댓글 수정 오류: {str(e)}")

    @staticmethod
    def delete_comment(db: Session, jc_id: int, current_user_id: int):
        """본인이 작성한 댓글인지 확인 후 삭제합니다."""
        comment = JournalCommentCrud.get(db, jc_id)
        if not comment:
            raise HTTPException(status_code=404, detail="댓글을 찾을 수 없습니다.")

        if comment.u_id != current_user_id:
            raise HTTPException(status_code=403, detail="본인의 댓글만 삭제할 수 있습니다.")

        try:
            JournalCommentCrud.delete(db, jc_id)
            db.commit()
            return {"message": "댓글이 삭제되었습니다."}
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"댓글 삭제 오류: {str(e)}")
