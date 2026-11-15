from sqlalchemy.orm import Session
from typing import List, Optional

from backend.journals import journals, journals_item, journals_comment
from backend.journals.schema import (
    JournalCreate, JournalUpdate,
    JournalItemCreate, JournalItemUpdate,
    JournalCommentCreate, JournalCommentUpdate
)


class JournalCrud:
    @staticmethod
    def create(db: Session, journal: JournalCreate) -> journals:
        db_journal = journals(**journal.model_dump())
        db.add(db_journal)
        db.flush()
        return db_journal

    @staticmethod
    def get(db: Session, j_id: int) -> Optional[journals]:
        return db.query(journals).filter(journals.j_id == j_id).first()

    @staticmethod
    def get_list(db: Session, skip: int = 0, limit: int = 100) -> List[journals]:
        return db.query(journals).offset(skip).limit(limit).all()

    @staticmethod
    def update(db: Session, j_id: int, journal_update: JournalUpdate) -> Optional[journals]:
        db_journal = JournalCrud.get(db, j_id)
        if not db_journal:
            return None

        update_data = journal_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_journal, key, value)

        db.flush()
        return db_journal

    @staticmethod
    def delete(db: Session, j_id: int) -> bool:
        db_journal = JournalCrud.get(db, j_id)
        if not db_journal:
            return False

        db.delete(db_journal)
        db.flush()
        return True


# ==========================================
# 2. JournalItem (일지 세부 일정) CRUD 클래스
# ==========================================
class JournalItemCrud:
    @staticmethod
    def create(db: Session, item: JournalItemCreate) -> journals_item:
        db_item = journals_item(**item.model_dump())
        db.add(db_item)
        db.flush()
        return db_item

    @staticmethod
    def get(db: Session, ji_id: int) -> Optional[journals_item]:
        return db.query(journals_item).filter(journals_item.ji_id == ji_id).first()

    @staticmethod
    def get_by_journal(db: Session, j_id: int) -> List[journals_item]:
        return (
            db.query(journals_item)
            .filter(journals_item.j_id == j_id)
            .order_by(journals_item.ji_day.asc(), journals_item.ji_order.asc())
            .all()
        )

    @staticmethod
    def update(db: Session, ji_id: int, item_update: JournalItemUpdate) -> Optional[journals_item]:
        db_item = JournalItemCrud.get(db, ji_id)
        if not db_item:
            return None

        update_data = item_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_item, key, value)

        db.flush()
        return db_item

    @staticmethod
    def delete(db: Session, ji_id: int) -> bool:
        db_item = JournalItemCrud.get(db, ji_id)
        if not db_item:
            return False

        db.delete(db_item)
        db.flush()
        return True


# ==========================================
# 3. JournalComment (일지 댓글) CRUD 클래스
# ==========================================
class JournalCommentCrud:
    @staticmethod
    def create(db: Session, comment: JournalCommentCreate) -> journals_comment:
        db_comment = journals_comment(**comment.model_dump())
        db.add(db_comment)
        db.flush()
        return db_comment

    @staticmethod
    def get(db: Session, jc_id: int) -> Optional[journals_comment]:
        return db.query(journals_comment).filter(journals_comment.jc_id == jc_id).first()

    @staticmethod
    def get_by_journal(db: Session, j_id: int) -> List[journals_comment]:
        return (
            db.query(journals_comment)
            .filter(journals_comment.j_id == j_id)
            .order_by(journals_comment.jc_create.asc())
            .all()
        )

    @staticmethod
    def update(db: Session, jc_id: int, comment_update: JournalCommentUpdate) -> Optional[journals_comment]:
        db_comment = JournalCommentCrud.get(db, jc_id)
        if not db_comment:
            return None

        update_data = comment_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_comment, key, value)

        db.flush()
        return db_comment

    @staticmethod
    def delete(db: Session, jc_id: int) -> bool:
        db_comment = JournalCommentCrud.get(db, jc_id)
        if not db_comment:
            return False

        db.delete(db_comment)
        db.flush()
        return True
