
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.journals import journals, journals_item, journals_comment, journals_like
from backend.journals.schema import (
    JournalCreate,
    JournalUpdate,
    JournalItemCreate,
    JournalItemUpdate,
    JournalCommentCreate,
    JournalCommentUpdate,
)
from backend.plans.models import (
    Plans,
    PlanMembers,
    plan_details,
    plan_hashtag,
    hashtag,
)
from backend.location.models import Location
from backend.login.models import User


# ==================================================
# 1. 여행계획 조회 CRUD
# ==================================================

class JournalPlanCrud:

    @staticmethod
    async def get_plan(db: AsyncSession, p_id: int):
        return await db.get(Plans, p_id)

    @staticmethod
    async def get_member(db: AsyncSession, p_id: int, u_id: int):
        result = await db.execute(
            select(PlanMembers).where(
                PlanMembers.p_id == p_id,
                PlanMembers.u_id == u_id,
            )
        )
        return result.scalars().first()

    @staticmethod
    async def get_plan_details(db: AsyncSession, p_id: int):
        """장소가 연결되지 않은 일정도 포함하여 조회"""
        result = await db.execute(
            select(plan_details, Location.l_name)
            .outerjoin(Location, plan_details.l_id == Location.l_id)
            .where(plan_details.p_id == p_id)
            .order_by(
                plan_details.visit_time,
                plan_details.orders,
                plan_details.pd_id,
            )
        )
        return result.all()

    @staticmethod
    async def get_plan_hashtags(db: AsyncSession, p_id: int):
        """기존 여행계획에 연결된 해시태그 조회"""
        result = await db.execute(
            select(hashtag)
            .join(plan_hashtag, plan_hashtag.h_id == hashtag.h_id)
            .where(plan_hashtag.p_id == p_id)
            .order_by(hashtag.h_id)
        )
        return result.scalars().all()


# ==================================================
# 2. 여행기 CRUD (journals)
# ==================================================

class JournalCrud:

    @staticmethod
    async def create(db: AsyncSession, journal: JournalCreate):
        db_journal = journals(**journal.model_dump())
        db.add(db_journal)
        await db.flush()
        return db_journal

    @staticmethod
    async def get(db: AsyncSession, j_id: int):
        return await db.get(journals, j_id)

    @staticmethod
    async def get_list(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
    ):
        result = await db.execute(
            select(journals)
            .order_by(journals.j_id.desc())
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    @staticmethod
    async def get_by_user(db: AsyncSession, u_id: int):
        result = await db.execute(
            select(journals)
            .where(journals.u_id == u_id)
            .order_by(journals.j_id.desc())
        )
        return result.scalars().all()

    @staticmethod
    async def get_by_plan(db: AsyncSession, p_id: int):
        result = await db.execute(
            select(journals)
            .where(journals.p_id == p_id)
            .order_by(journals.j_id.desc())
        )
        return result.scalars().all()

    @staticmethod
    async def update(
        db: AsyncSession,
        j_id: int,
        journal_update: JournalUpdate,
    ):
        db_journal = await JournalCrud.get(db, j_id)
        if db_journal is None:
            return None

        update_data = journal_update.model_dump(exclude_unset=True)

        for field in ("j_title", "j_intro", "j_photo"):
            if field in update_data:
                setattr(db_journal, field, update_data[field])

        await db.flush()
        return db_journal

    @staticmethod
    async def delete(db: AsyncSession, j_id: int):
        db_journal = await JournalCrud.get(db, j_id)
        if db_journal is None:
            return False

        await db.delete(db_journal)
        await db.flush()
        return True


# ==================================================
# 3. 여행기 일정 CRUD (journals_item)
# ==================================================

class JournalItemCrud:

    @staticmethod
    async def create(db: AsyncSession, item: JournalItemCreate):
        db_item = journals_item(**item.model_dump())
        db.add(db_item)
        await db.flush()
        return db_item

    @staticmethod
    async def create_many(
        db: AsyncSession,
        items: list[JournalItemCreate],
    ):
        db_items = [
            journals_item(**item.model_dump())
            for item in items
        ]
        db.add_all(db_items)
        await db.flush()
        return db_items

    @staticmethod
    async def get(db: AsyncSession, ji_id: int):
        return await db.get(journals_item, ji_id)

    @staticmethod
    async def get_by_journal(db: AsyncSession, j_id: int):
        result = await db.execute(
            select(journals_item)
            .where(journals_item.j_id == j_id)
            .order_by(
                journals_item.ji_day,
                journals_item.ji_order,
                journals_item.ji_id,
            )
        )
        return result.scalars().all()

    @staticmethod
    async def update(
        db: AsyncSession,
        ji_id: int,
        item_update: JournalItemUpdate,
    ):
        db_item = await JournalItemCrud.get(db, ji_id)
        if db_item is None:
            return None

        update_data = item_update.model_dump(exclude_unset=True)

        if "ji_rating" in update_data and update_data["ji_rating"] is None:
            raise ValueError("여행기 별점은 필수입니다.")

        for field in ("ji_content", "ji_photo", "ji_rating"):
            if field in update_data:
                setattr(db_item, field, update_data[field])

        await db.flush()
        return db_item

    @staticmethod
    async def delete(db: AsyncSession, ji_id: int):
        db_item = await JournalItemCrud.get(db, ji_id)
        if db_item is None:
            return False

        await db.delete(db_item)
        await db.flush()
        return True

    @staticmethod
    async def delete_by_journal(db: AsyncSession, j_id: int):
        result = await db.execute(
            delete(journals_item)
            .where(journals_item.j_id == j_id)
        )
        await db.flush()
        return result.rowcount


# ==================================================
# 4. 여행기 댓글 CRUD (journals_comment)
# ==================================================

class JournalCommentCrud:

    @staticmethod
    async def create(
        db: AsyncSession,
        comment: JournalCommentCreate,
    ):
        db_comment = journals_comment(**comment.model_dump())
        db.add(db_comment)
        await db.flush()
        return db_comment

    @staticmethod
    async def get(db: AsyncSession, jc_id: int):
        return await db.get(journals_comment, jc_id)

    @staticmethod
    async def get_by_journal(db: AsyncSession, j_id: int):
        result = await db.execute(
            select(journals_comment)
            .where(journals_comment.j_id == j_id)
            .order_by(
                journals_comment.jc_create,
                journals_comment.jc_id,
            )
        )
        return result.scalars().all()

    @staticmethod
    async def update(
        db: AsyncSession,
        jc_id: int,
        comment_update: JournalCommentUpdate,
    ):
        db_comment = await JournalCommentCrud.get(db, jc_id)
        if db_comment is None:
            return None

        db_comment.jc_content = comment_update.jc_content
        await db.flush()
        return db_comment

    @staticmethod
    async def delete(db: AsyncSession, jc_id: int):
        db_comment = await JournalCommentCrud.get(db, jc_id)
        if db_comment is None:
            return False

        await db.delete(db_comment)
        await db.flush()
        return True

    @staticmethod
    async def delete_by_journal(db: AsyncSession, j_id: int):
        result = await db.execute(
            delete(journals_comment)
            .where(journals_comment.j_id == j_id)
        )
        await db.flush()
        return result.rowcount


# ==================================================
# 5. 여행기 해시태그 조회
# ==================================================

class JournalHashtagCrud:

    @staticmethod
    async def get_by_journal(db: AsyncSession, j_id: int):
        """여행기의 원본 여행계획에 연결된 해시태그 조회"""
        result = await db.execute(
            select(hashtag)
            .join(plan_hashtag, plan_hashtag.h_id == hashtag.h_id)
            .join(journals, journals.p_id == plan_hashtag.p_id)
            .where(journals.j_id == j_id)
            .order_by(hashtag.h_id)
        )
        return result.scalars().all()


# ==================================================
# 6. 좋아요 (journals_like: 한 사람이 한 여행기에 한 번만)
# ==================================================

class JournalLikeCrud:

    @staticmethod
    async def count(db: AsyncSession, j_id: int) -> int:
        result = await db.execute(
            select(func.count()).select_from(journals_like).where(journals_like.j_id == j_id)
        )
        return int(result.scalar_one())

    @staticmethod
    async def get(db: AsyncSession, j_id: int, u_id: int):
        return await db.get(journals_like, (j_id, u_id))

    @staticmethod
    async def get_by_user(db: AsyncSession, u_id: int):
        result = await db.execute(
            select(journals_like).where(journals_like.u_id == u_id).order_by(journals_like.jl_create.desc())
        )
        return result.scalars().all()

    @staticmethod
    async def create(db: AsyncSession, j_id: int, u_id: int):
        like = journals_like(j_id=j_id, u_id=u_id)
        db.add(like)
        await db.flush()
        return like

    @staticmethod
    async def delete(db: AsyncSession, j_id: int, u_id: int):
        like = await db.get(journals_like, (j_id, u_id))
        if like is None:
            return None
        await db.delete(like)
        await db.flush()
        return like


# ==================================================
# 7. 작성자 이름 조회 (users.u_name)
# ==================================================

class JournalUserCrud:

    @staticmethod
    async def get_names(db: AsyncSession, user_ids) -> dict:
        """{u_id: u_name}. 화면에 '사용자 3' 대신 닉네임을 보여주기 위해 씁니다."""
        ids = {int(u) for u in user_ids if u is not None}
        if not ids:
            return {}
        result = await db.execute(select(User.u_id, User.u_name).where(User.u_id.in_(ids)))
        return {u_id: name for u_id, name in result.all()}


# ==================================================
# 8. 목록 화면용 묶음 조회 (해시태그 이름, 좋아요 수)
# ==================================================

class JournalListMetaCrud:

    @staticmethod
    async def like_counts(db: AsyncSession, journal_ids) -> dict:
        ids = {int(j) for j in journal_ids}
        if not ids:
            return {}
        result = await db.execute(
            select(journals_like.j_id, func.count())
            .where(journals_like.j_id.in_(ids))
            .group_by(journals_like.j_id)
        )
        return {j_id: int(n) for j_id, n in result.all()}

    @staticmethod
    async def hashtag_names(db: AsyncSession, plan_ids) -> dict:
        """{p_id: [해시태그 이름, ...]} (여행기에는 원본 여행계획의 해시태그를 그대로 씁니다)"""
        ids = {int(p) for p in plan_ids if p is not None}
        if not ids:
            return {}
        result = await db.execute(
            select(plan_hashtag.p_id, hashtag.h_name)
            .join(hashtag, hashtag.h_id == plan_hashtag.h_id)
            .where(plan_hashtag.p_id.in_(ids))
            .order_by(plan_hashtag.p_id, hashtag.h_id)
        )
        tags: dict = {}
        for p_id, name in result.all():
            tags.setdefault(p_id, []).append(name)
        return tags
