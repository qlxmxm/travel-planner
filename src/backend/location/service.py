# [장소] 장소·리뷰 DB 작업 (API 명세서 38~43번)
# router.py 는 요청/응답만 다루고, "DB에서 찾고 만들고 고치는 일"은 여기서 합니다. (login 폴더와 같은 방식)
from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.location.models import Location, LocationReview
from backend.location.schemas import ReviewIn
from backend.login.models import User


# ───────── 공통 도우미 ─────────

def _location_with_rating():
    """장소 + 평균 별점 + 리뷰 수를 한 번에 가져오는 SELECT 문.
    리뷰가 없는 장소도 나오도록 outerjoin(LEFT JOIN) 합니다."""
    avg_rating = func.coalesce(func.round(func.avg(LocationReview.lr_rating), 1), 0).label("avg_rating")
    review_count = func.count(LocationReview.lr_id).label("review_count")
    return (
        select(Location, avg_rating, review_count)
        .outerjoin(LocationReview, LocationReview.l_id == Location.l_id)
        .group_by(Location.l_id)
    )


def _location_to_dict(location: Location, avg_rating, review_count) -> dict:
    data = {col.name: getattr(location, col.name) for col in Location.__table__.columns}
    data["avg_rating"] = float(avg_rating or 0)
    data["review_count"] = int(review_count or 0)
    return data


def _review_to_dict(review: LocationReview, u_name: str) -> dict:
    return {
        "lr_id": review.lr_id,
        "u_id": review.u_id,
        "u_name": u_name,
        "lr_rating": review.lr_rating,
        "lr_content": review.lr_content,
        "lr_create": review.lr_create,   # 스키마에서 lr_created 로 바꿔서 내보냄
    }


async def _get_location_or_404(db: AsyncSession, l_id: int) -> Location:
    location = await db.get(Location, l_id)
    if location is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "장소를 찾을 수 없습니다")
    return location


async def _get_my_review_or_error(db: AsyncSession, lr_id: int, user: User) -> LocationReview:
    """리뷰가 없으면 404, 내 리뷰가 아니면 403."""
    review = await db.get(LocationReview, lr_id)
    if review is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "리뷰를 찾을 수 없습니다")
    if review.u_id != user.u_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "본인이 작성한 리뷰만 수정·삭제할 수 있습니다")
    return review


# ───────── 38, 39 장소 ─────────

async def list_locations(
    db: AsyncSession,
    category: str | None = None,
    q: str | None = None,
    city: str | None = None,
    page: int = 1,
    size: int = 20,
    min_rating: float | None = None,
    sort: str = "id",
) -> list[dict]:
    """38 장소 목록·검색. 조건은 넘어온 것만 붙입니다.
    min_rating: 평균 별점(소수 첫째 자리 반올림 값, 화면에 보이는 값)이 이 값 이상인 장소만.
    sort: id(기본) / rating(별점 높은 순) / rating_asc(별점 낮은 순, 리뷰 없는 장소는 맨 뒤) / reviews(리뷰 많은 순) / reviews_asc(리뷰 적은 순)"""
    stmt = _location_with_rating()
    if category:
        stmt = stmt.where(Location.l_category == category)
    if city:
        stmt = stmt.where(Location.l_city == city)
    if q:
        keyword = f"%{q}%"
        stmt = stmt.where(or_(
            Location.l_name.like(keyword),
            Location.l_city.like(keyword),
            Location.l_add.like(keyword),
        ))
    avg = func.coalesce(func.round(func.avg(LocationReview.lr_rating), 1), 0)
    count = func.count(LocationReview.lr_id)
    if min_rating:
        stmt = stmt.having(avg >= min_rating)
    if sort == "rating":
        order = (avg.desc(), count.desc(), Location.l_id)
    elif sort == "rating_asc":
        order = ((count == 0), avg.asc(), count.desc(), Location.l_id)   # 리뷰가 없는 장소(0점)는 맨 뒤로
    elif sort == "reviews":
        order = (count.desc(), avg.desc(), Location.l_id)
    elif sort == "reviews_asc":
        order = (count.asc(), avg.asc(), Location.l_id)
    else:
        order = (Location.l_id,)
    stmt = stmt.order_by(*order).offset((page - 1) * size).limit(size)

    result = await db.execute(stmt)
    return [_location_to_dict(*row) for row in result.all()]


async def get_location(db: AsyncSession, l_id: int) -> dict:
    """39 장소 상세 조회."""
    result = await db.execute(_location_with_rating().where(Location.l_id == l_id))
    row = result.first()
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "장소를 찾을 수 없습니다")
    return _location_to_dict(*row)


# ───────── 40~43 리뷰 ─────────

async def list_reviews(db: AsyncSession, l_id: int) -> list[dict]:
    """40 리뷰 목록 (최신순). 작성자 이름은 users 테이블에서 JOIN."""
    await _get_location_or_404(db, l_id)
    stmt = (
        select(LocationReview, User.u_name)
        .join(User, User.u_id == LocationReview.u_id)
        .where(LocationReview.l_id == l_id)
        .order_by(LocationReview.lr_create.desc())
    )
    result = await db.execute(stmt)
    return [_review_to_dict(review, u_name) for review, u_name in result.all()]


async def create_review(db: AsyncSession, l_id: int, user: User, body: ReviewIn) -> dict:
    """41 리뷰 작성. 한 사람이 한 장소에 여러 개 작성할 수 있습니다 (팀 결정)."""
    await _get_location_or_404(db, l_id)

    u_name = user.u_name   # commit 하면 user 정보가 만료돼서, 미리 꺼내 둡니다 (비동기에서 에러 방지)
    review = LocationReview(
        l_id=l_id,
        u_id=user.u_id,
        lr_rating=body.lr_rating,
        lr_content=body.lr_content,
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return _review_to_dict(review, u_name)


async def update_review(db: AsyncSession, lr_id: int, user: User, body: ReviewIn) -> dict:
    """42 리뷰 수정 (작성자 본인만)."""
    review = await _get_my_review_or_error(db, lr_id, user)
    u_name = user.u_name   # commit 전에 미리 꺼내 둠 (위와 같은 이유)
    review.lr_rating = body.lr_rating
    review.lr_content = body.lr_content
    await db.commit()
    await db.refresh(review)
    return _review_to_dict(review, u_name)


async def delete_review(db: AsyncSession, lr_id: int, user: User) -> None:
    """43 리뷰 삭제 (작성자 본인만)."""
    review = await _get_my_review_or_error(db, lr_id, user)
    await db.delete(review)
    await db.commit()