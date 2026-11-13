from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Optional

from backend.journals.crud import JournalCrud, JournalItemCrud, JournalCommentCrud
from backend.journals.schema import (
    JournalCreate, JournalUpdate,
    JournalItemCreate, JournalItemUpdate,
    JournalCommentCreate, JournalCommentUpdate
)
# 실제 프로젝트의 Plan CRUD 경로에 맞게 수정하세요
# from backend.plans.crud import PlanCrud, PlanItemCrud


class JournalService:
    # ==========================================
    # 1. 여행기(Journal) 서비스 (계획 복사 생성 및 관리)
    # ==========================================
    @staticmethod
    def create_journal_from_plan(
        db: Session, 
        plan_id: int, 
        user_id: int, 
        custom_title: Optional[str] = None
    ):
        """내가 세운 여행 계획(Plan)과 세부 일정(PlanItem)을 복사해 여행기로 저장합니다."""
        plan = PlanCrud.get(db, plan_id)
        if not plan:
            raise HTTPException(status_code=404, detail="해당 여행 계획을 찾을 수 없습니다.")

        if hasattr(plan, "user_id") and plan.user_id != user_id:
            raise HTTPException(status_code=403, detail="본인의 여행 계획만 변환할 수 있습니다.")

        plan_items = PlanItemCrud.get_by_plan(db, plan_id)

        try:
            # 여행기 본문 생성 (컬럼명은 실제 schema에 맞게 조정하세요)
            journal_data = JournalCreate(
                user_id=user_id,
                plan_id=plan.p_id,
                j_title=custom_title if custom_title else plan.p_title,
                j_start_date=plan.p_start_date,
                j_end_date=plan.p_end_date,
                j_content=""
            )
            new_journal = JournalCrud.create(db, journal_data)

            # 계획 세부 일정 복사
            for p_item in plan_items:
                journal_item_data = JournalItemCreate(
                    j_id=new_journal.j_id,
                    ji_day=p_item.pi_day,
                    ji_order=p_item.pi_order,
                    ji_place=p_item.pi_place,
                    ji_memo=""
                )
                JournalItemCrud.create(db, journal_item_data)

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

        # 작성자 본인 확인 (모델의 작성자 컬럼명이 user_id라고 가정)
        if hasattr(comment, "user_id") and comment.user_id != current_user_id:
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

        if hasattr(comment, "user_id") and comment.user_id != current_user_id:
            raise HTTPException(status_code=403, detail="본인의 댓글만 삭제할 수 있습니다.")

        try:
            JournalCommentCrud.delete(db, jc_id)
            db.commit()
            return {"message": "댓글이 삭제되었습니다."}
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"댓글 삭제 오류: {str(e)}")
