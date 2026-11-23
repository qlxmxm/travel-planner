
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db import get_db
from backend.plans.schemas import (
    PlanCreate, PlanUpdate, PlanInDB,
    InviteCreate, InviteVerify, InviteInDB,
    PlanMemberCreate, PlanMemberUpdate, PlanMemberInDB,
    HashtagCreate, HashtagInDB,
    PlanHashtagCreate, PlanHashtagInDB,
    PlanDetailCreate, PlanDetailUpdate, PlanDetailInDB,
    BudgetCreate, BudgetUpdate, BudgetInDB,
    ExpenseCreate, ExpenseUpdate, ExpenseInDB, PlanMemberDetail,
    JoinRequestOut,
)
from backend.plans.service import (
    PlanService,
    InviteService,
    PlanMemberService,
    HashtagService,
    PlanHashtagService,
    PlanDetailService,
    BudgetService,
    ExpenseService,
    PlanAccessService,
    JoinRequestService,
    EDITOR_ROLE,
    MEMBER_ROLE,
)

from backend.login.models import User

from backend.login.security import get_current_user


router = APIRouter(prefix="/plans", tags=["여행 계획"])


async def PlanValidator_plan(db: AsyncSession, plan_id: int):
    from backend.plans.service import PlanValidator
    return await PlanValidator.check_plan(db, plan_id)


# ---- 권한 의존성 ------------------------------------------------------------
# 방장 > 편집자 > 멤버 순서. 경로의 {plan_id} 로 여행을 찾아 로그인한 사용자의 권한을 검사한다.
async def require_editor_dep(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await PlanAccessService.require_editor(db=db, plan_id=plan_id, user_id=user.u_id)


async def require_member_dep(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await PlanAccessService.require_member(db=db, plan_id=plan_id, user_id=user.u_id)


async def require_view_dep(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await PlanAccessService.require_view(db=db, plan_id=plan_id, user_id=user.u_id)

# ==================================================
# 4. 해시태그
# ==================================================

@router.post(
    "/hashtags",
    response_model=HashtagInDB,
    status_code=201,
)
async def create_hashtag(
    data: HashtagCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await HashtagService.create_hashtag(db, data)


@router.get("/hashtags", response_model=list[HashtagInDB])
async def get_all_hashtags(
    db: AsyncSession = Depends(get_db),
):
    return await HashtagService.get_all_hashtags(db)


@router.get("/hashtags/{hashtag_id}", response_model=HashtagInDB)
async def get_hashtag_by_id(
    hashtag_id: int,
    db: AsyncSession = Depends(get_db),
):
    tag = await HashtagService.get_hashtag_by_id(db, hashtag_id)
    if tag is None:
        raise HTTPException(404, "해시태그가 없습니다.")
    return tag


@router.delete("/hashtags/{hashtag_id}", status_code=204)
async def delete_hashtag(
    hashtag_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    deleted = await HashtagService.delete_hashtag(db, hashtag_id)
    if deleted is None:
        raise HTTPException(404, "해시태그가 없습니다.")



@router.get("/public", response_model=list[PlanInDB])
async def get_public_plans(
    db: AsyncSession = Depends(get_db),
):
    """공개(p_public)된 모든 여행계획. 다른 사람의 여행을 구경하는 화면에서 씁니다."""
    return await PlanService.get_public_plans(db=db)


# ==================================================
# 1. 여행계획
# ==================================================

@router.post("/", response_model=PlanInDB, status_code=201)
async def create_plan(
    plan: PlanCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if plan.u_id != user.u_id:
        raise HTTPException(403, "본인 명의로만 여행계획을 생성할 수 있습니다.")

    return await PlanService.create_plan(db=db, plan=plan)


@router.get("/", response_model=list[PlanInDB])
async def get_plans(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # 내가 방장이거나 멤버로 참여했거나 공개된 여행 조회
    return await PlanService.get_accessible_plans(db=db, user_id=user.u_id)


@router.get("/user/{user_id}", response_model=list[PlanInDB])
async def get_plans_by_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user_id != user.u_id:
        raise HTTPException(403, "본인의 여행계획만 조회할 수 있습니다.")

    return await PlanService.get_plans_by_user(
        db=db, user_id=user.u_id
    )


@router.get("/{plan_id}", response_model=PlanInDB)
async def get_plan_by_id(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await PlanAccessService.require_view(
        db=db, plan_id=plan_id, user_id=user.u_id
    )


@router.put("/{plan_id}", response_model=PlanInDB)
async def update_plan_by_id(
    plan_id: int,
    plan: PlanUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if "p_public" in plan.model_fields_set:
        # 공개/비공개 전환은 방장만
        await PlanAccessService.require_owner(
            db=db, plan_id=plan_id, user_id=user.u_id
        )
    else:
        # 제목·여행지·날짜·대표사진은 방장 또는 편집자
        await PlanAccessService.require_editor(
            db=db, plan_id=plan_id, user_id=user.u_id
        )

    # 여행 완료 상태는 스케줄러에서 관리
    if "p_status" in plan.model_fields_set:
        raise HTTPException(
            422,
            "여행 완료 상태는 직접 변경할 수 없습니다."
        )

    return await PlanService.update_plan(
        db=db, plan_id=plan_id, plan=plan
    )


@router.delete("/{plan_id}", status_code=204)
async def delete_plan_by_id(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await PlanAccessService.require_owner(
        db=db, plan_id=plan_id, user_id=user.u_id
    )

    await PlanService.delete_plan(db=db, plan_id=plan_id)




# ==================================================
# 2. 초대 코드
# ==================================================

@router.post(
    "/{plan_id}/invites",
    response_model=InviteInDB,
    status_code=201,
)
async def create_invite(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await InviteService.create_invite(
        db=db,
        plan_id=plan_id,
        user_id=user.u_id,
    )


@router.post("/invites/verify", response_model=InviteInDB)
async def verify_invite(
    data: InviteVerify,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await InviteService.verify_invite(
        db=db, code=data.i_code
    )


@router.post(
    "/invites/join",
    response_model=PlanMemberInDB,
    status_code=201,
)
async def join_plan_by_invite(
    data: InviteVerify,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await InviteService.use_invite(
        db=db,
        code=data.i_code,
        user_id=user.u_id,
    )


@router.get(
    "/{plan_id}/invites",
    response_model=list[InviteInDB],
)
async def get_invites_by_plan(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await InviteService.get_invites_by_plan(
        db=db,
        plan_id=plan_id,
        user_id=user.u_id,
    )


@router.get(
    "/{plan_id}/invites/{invite_id}",
    response_model=InviteInDB,
)
async def get_invite_by_id(
    plan_id: int,
    invite_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await PlanAccessService.require_owner(
        db=db, plan_id=plan_id, user_id=user.u_id
    )

    invite = await InviteService.get_invite_by_id(
        db=db, invite_id=invite_id
    )

    if invite is None or invite.p_id != plan_id:
        raise HTTPException(404, "초대 코드가 없습니다.")

    return invite


@router.delete(
    "/{plan_id}/invites/{invite_id}",
    status_code=204,
)
async def delete_invite(
    plan_id: int,
    invite_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await PlanAccessService.require_owner(
        db=db, plan_id=plan_id, user_id=user.u_id
    )

    invite = await InviteService.get_invite_by_id(
        db=db, invite_id=invite_id
    )

    if invite is None or invite.p_id != plan_id:
        raise HTTPException(404, "초대 코드가 없습니다.")

    await InviteService.delete_invite(db, invite_id)




# ==================================================
# 3. 여행 멤버
# ==================================================

@router.get(
    "/{plan_id}/members",
    response_model=list[PlanMemberDetail],
)
async def get_members_by_plan(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await PlanMemberService.get_members_by_plan(
        db=db,
        plan_id=plan_id,
        user_id=user.u_id,
    )


@router.get(
    "/{plan_id}/members/{member_id}",
    response_model=PlanMemberInDB,
)
async def get_member_by_id(
    plan_id: int,
    member_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await PlanAccessService.require_member(
        db=db, plan_id=plan_id, user_id=user.u_id
    )

    member = await PlanMemberService.get_member_by_id(
        db, member_id
    )

    if member is None or member.p_id != plan_id:
        raise HTTPException(404, "여행 멤버가 없습니다.")

    return member


@router.put(
    "/{plan_id}/members/{member_id}",
    response_model=PlanMemberInDB,
)
async def update_member(
    plan_id: int,
    member_id: int,
    member: PlanMemberUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await PlanAccessService.require_owner(
        db=db, plan_id=plan_id, user_id=user.u_id
    )

    existing = await PlanMemberService.get_member_by_id(
        db, member_id
    )

    if existing is None or existing.p_id != plan_id:
        raise HTTPException(404, "여행 멤버가 없습니다.")

    plan = await PlanValidator_plan(db, plan_id)
    if existing.u_id == plan.u_id:
        raise HTTPException(403, "방장의 역할은 바꿀 수 없습니다.")

    # 방장은 plans.u_id 로 관리하므로 멤버 <-> 편집자 전환만 허용
    if member.role not in (MEMBER_ROLE, EDITOR_ROLE):
        raise HTTPException(
            422,
            f"역할은 {MEMBER_ROLE} 또는 {EDITOR_ROLE} 만 허용됩니다."
        )

    return await PlanMemberService.update_member(
        db, member_id, member
    )


@router.delete(
    "/{plan_id}/members/{member_id}",
    status_code=204,
)
async def delete_member(
    plan_id: int,
    member_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await PlanAccessService.require_owner(
        db=db, plan_id=plan_id, user_id=user.u_id
    )

    existing = await PlanMemberService.get_member_by_id(
        db, member_id
    )

    if existing is None or existing.p_id != plan_id:
        raise HTTPException(404, "여행 멤버가 없습니다.")

    plan = await PlanValidator_plan(db, plan_id)
    if existing.u_id == plan.u_id:
        raise HTTPException(
            403,
            "방장은 멤버 내보내기로 삭제할 수 없습니다."
        )

    await PlanMemberService.delete_member(db, member_id)





# ==================================================
# 5. 여행계획 해시태그 연결
# ==================================================

@router.post("/{plan_id}/hashtags",
    response_model=PlanHashtagInDB,
    status_code=201,
    dependencies=[Depends(require_editor_dep)],
)
async def add_plan_hashtag(
    plan_id: int,
    data: PlanHashtagCreate,
    db: AsyncSession = Depends(get_db),
):
    if data.p_id != plan_id:
        raise HTTPException(422, "여행계획 ID가 일치하지 않습니다.")

    return await PlanHashtagService.add_hashtag(db, data)


@router.get("/{plan_id}/hashtags",
    response_model=list[HashtagInDB],
    dependencies=[Depends(require_view_dep)],
)
async def get_plan_hashtags(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
):
    return await PlanHashtagService.get_hashtags_by_plan(db, plan_id)


@router.delete("/{plan_id}/hashtags/{hashtag_id}",
    status_code=204,
    dependencies=[Depends(require_editor_dep)],
)
async def remove_plan_hashtag(
    plan_id: int,
    hashtag_id: int,
    db: AsyncSession = Depends(get_db),
):
    deleted = await PlanHashtagService.remove_hashtag(
        db, plan_id, hashtag_id
    )
    if deleted is None:
        raise HTTPException(404, "연결된 해시태그가 없습니다.")


# ==================================================
# 6. 여행 세부 일정
# ==================================================

@router.post("/{plan_id}/details",
    response_model=PlanDetailInDB,
    status_code=201,
    dependencies=[Depends(require_editor_dep)],
)
async def create_detail(
    plan_id: int,
    data: PlanDetailCreate,
    db: AsyncSession = Depends(get_db),
):
    if data.p_id != plan_id:
        raise HTTPException(422, "여행계획 ID가 일치하지 않습니다.")

    return await PlanDetailService.create_detail(db, data)


@router.get("/{plan_id}/details",
    response_model=list[PlanDetailInDB],
    dependencies=[Depends(require_view_dep)],
)
async def get_details_by_plan(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
):
    return await PlanDetailService.get_details_by_plan(db, plan_id)


@router.get("/{plan_id}/details/{detail_id}",
    response_model=PlanDetailInDB,
    dependencies=[Depends(require_view_dep)],
)
async def get_detail_by_id(
    plan_id: int,
    detail_id: int,
    db: AsyncSession = Depends(get_db),
):
    detail = await PlanDetailService.get_detail_by_id(db, detail_id)
    if detail is None or detail.p_id != plan_id:
        raise HTTPException(404, "여행 세부 일정이 없습니다.")
    return detail


@router.put("/{plan_id}/details/{detail_id}",
    response_model=PlanDetailInDB,
    dependencies=[Depends(require_editor_dep)],
)
async def update_detail(
    plan_id: int,
    detail_id: int,
    data: PlanDetailUpdate,
    db: AsyncSession = Depends(get_db),
):
    existing = await PlanDetailService.get_detail_by_id(db, detail_id)
    if existing is None or existing.p_id != plan_id:
        raise HTTPException(404, "여행 세부 일정이 없습니다.")

    return await PlanDetailService.update_detail(db, detail_id, data)


@router.delete("/{plan_id}/details/{detail_id}", status_code=204,
    dependencies=[Depends(require_editor_dep)],
)
async def delete_detail(
    plan_id: int,
    detail_id: int,
    db: AsyncSession = Depends(get_db),
):
    existing = await PlanDetailService.get_detail_by_id(db, detail_id)
    if existing is None or existing.p_id != plan_id:
        raise HTTPException(404, "여행 세부 일정이 없습니다.")

    await PlanDetailService.delete_detail(db, detail_id)


# ==================================================
# 7. 예산
# ==================================================

@router.post("/{plan_id}/budgets",
    response_model=BudgetInDB,
    status_code=201,
    dependencies=[Depends(require_editor_dep)],
)
async def create_budget(
    plan_id: int,
    budget: BudgetCreate,
    db: AsyncSession = Depends(get_db),
):
    if budget.p_id != plan_id:
        raise HTTPException(422, "여행계획 ID가 일치하지 않습니다.")

    return await BudgetService.create_budget(db=db, budget=budget)


@router.get("/{plan_id}/budgets",
    response_model=list[BudgetInDB],
    dependencies=[Depends(require_member_dep)],
)
async def get_budgets_by_plan(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
):
    return await BudgetService.get_budget_by_plan_id(db, plan_id)


@router.get("/{plan_id}/budgets/{budget_id}",
    response_model=BudgetInDB,
    dependencies=[Depends(require_member_dep)],
)
async def get_budget_by_id(
    plan_id: int,
    budget_id: int,
    db: AsyncSession = Depends(get_db),
):
    budget = await BudgetService.get_budget_by_id(db, budget_id)
    if budget is None or budget.p_id != plan_id:
        raise HTTPException(404, "예산이 없습니다.")
    return budget


@router.put("/{plan_id}/budgets/{budget_id}",
    response_model=BudgetInDB,
    dependencies=[Depends(require_editor_dep)],
)
async def update_budget(
    plan_id: int,
    budget_id: int,
    budget: BudgetUpdate,
    db: AsyncSession = Depends(get_db),
):
    existing = await BudgetService.get_budget_by_id(db, budget_id)
    if existing is None or existing.p_id != plan_id:
        raise HTTPException(404, "예산이 없습니다.")

    if budget.p_id is not None and budget.p_id != plan_id:
        raise HTTPException(422, "예산의 여행계획 ID를 변경할 수 없습니다.")

    return await BudgetService.update_budget(
        db=db, budget_id=budget_id, budget=budget
    )


@router.delete("/{plan_id}/budgets/{budget_id}", status_code=204,
    dependencies=[Depends(require_editor_dep)],
)
async def delete_budget(
    plan_id: int,
    budget_id: int,
    db: AsyncSession = Depends(get_db),
):
    existing = await BudgetService.get_budget_by_id(db, budget_id)
    if existing is None or existing.p_id != plan_id:
        raise HTTPException(404, "예산이 없습니다.")

    await BudgetService.delete_budget(db, budget_id)


# ==================================================
# 8. 지출
# ==================================================

@router.post("/{plan_id}/budgets/{budget_id}/expenses",
    response_model=ExpenseInDB,
    status_code=201,
    dependencies=[Depends(require_editor_dep)],
)
async def create_expense(
    plan_id: int,
    budget_id: int,
    data: ExpenseCreate,
    db: AsyncSession = Depends(get_db),
):
    budget = await BudgetService.get_budget_by_id(db, budget_id)
    if budget is None or budget.p_id != plan_id:
        raise HTTPException(404, "예산이 없습니다.")

    if data.b_id != budget_id:
        raise HTTPException(422, "예산 ID가 일치하지 않습니다.")

    return await ExpenseService.create_expense(db, data)


@router.get("/{plan_id}/budgets/{budget_id}/expenses",
    response_model=list[ExpenseInDB],
    dependencies=[Depends(require_member_dep)],
)
async def get_expenses_by_budget(
    plan_id: int,
    budget_id: int,
    db: AsyncSession = Depends(get_db),
):
    budget = await BudgetService.get_budget_by_id(db, budget_id)
    if budget is None or budget.p_id != plan_id:
        raise HTTPException(404, "예산이 없습니다.")

    return await ExpenseService.get_expenses_by_budget(db, budget_id)


@router.get("/{plan_id}/budgets/{budget_id}/expenses/{expense_id}",
    response_model=ExpenseInDB,
    dependencies=[Depends(require_member_dep)],
)
async def get_expense_by_id(
    plan_id: int,
    budget_id: int,
    expense_id: int,
    db: AsyncSession = Depends(get_db),
):
    budget = await BudgetService.get_budget_by_id(db, budget_id)
    if budget is None or budget.p_id != plan_id:
        raise HTTPException(404, "예산이 없습니다.")

    expense = await ExpenseService.get_expense_by_id(db, expense_id)
    if expense is None or expense.b_id != budget_id:
        raise HTTPException(404, "지출 내역이 없습니다.")

    return expense


@router.put("/{plan_id}/budgets/{budget_id}/expenses/{expense_id}",
    response_model=ExpenseInDB,
    dependencies=[Depends(require_editor_dep)],
)
async def update_expense(
    plan_id: int,
    budget_id: int,
    expense_id: int,
    data: ExpenseUpdate,
    db: AsyncSession = Depends(get_db),
):
    budget = await BudgetService.get_budget_by_id(db, budget_id)
    if budget is None or budget.p_id != plan_id:
        raise HTTPException(404, "예산이 없습니다.")

    expense = await ExpenseService.get_expense_by_id(db, expense_id)
    if expense is None or expense.b_id != budget_id:
        raise HTTPException(404, "지출 내역이 없습니다.")

    return await ExpenseService.update_expense(db, expense_id, data)


@router.delete("/{plan_id}/budgets/{budget_id}/expenses/{expense_id}",
    status_code=204,
    dependencies=[Depends(require_editor_dep)],
)
async def delete_expense(
    plan_id: int,
    budget_id: int,
    expense_id: int,
    db: AsyncSession = Depends(get_db),
):
    budget = await BudgetService.get_budget_by_id(db, budget_id)
    if budget is None or budget.p_id != plan_id:
        raise HTTPException(404, "예산이 없습니다.")

    expense = await ExpenseService.get_expense_by_id(db, expense_id)
    if expense is None or expense.b_id != budget_id:
        raise HTTPException(404, "지출 내역이 없습니다.")

    await ExpenseService.delete_expense(db, expense_id)


# ==================================================
# 9. 참여 요청 (공개 여행 → "여행플래너 요청하기")
# ==================================================

@router.post(
    "/{plan_id}/join-requests",
    response_model=JoinRequestOut,
    status_code=201,
)
async def create_join_request(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    req = await JoinRequestService.create_request(
        db=db, plan_id=plan_id, user_id=user.u_id
    )
    return {
        "jr_id": req.jr_id, "p_id": req.p_id, "u_id": req.u_id,
        "u_name": user.u_name, "jr_create": req.jr_create,
    }


@router.get("/{plan_id}/join-requests/me")
async def get_my_join_request(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await JoinRequestService.get_my_request(
        db=db, plan_id=plan_id, user_id=user.u_id
    )


@router.get(
    "/{plan_id}/join-requests",
    response_model=list[JoinRequestOut],
)
async def get_join_requests(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await JoinRequestService.list_requests(
        db=db, plan_id=plan_id, user_id=user.u_id
    )


@router.post("/{plan_id}/join-requests/{jr_id}/approve", status_code=204)
async def approve_join_request(
    plan_id: int,
    jr_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # 승인(멤버 추가)은 방장만
    await PlanAccessService.require_owner(
        db=db, plan_id=plan_id, user_id=user.u_id
    )
    await JoinRequestService.approve(db=db, plan_id=plan_id, jr_id=jr_id)


@router.delete("/{plan_id}/join-requests/{jr_id}", status_code=204)
async def delete_join_request(
    plan_id: int,
    jr_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # 방장은 거절, 요청한 본인은 취소
    await JoinRequestService.remove(
        db=db, plan_id=plan_id, jr_id=jr_id, user_id=user.u_id
    )
