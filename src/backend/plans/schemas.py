
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, model_validator


# ==================================================
# 1. 여행계획 (plans)
# ==================================================

class PlanBase(BaseModel):
    u_id: int
    p_title: str = Field(..., min_length=1, max_length=100)
    loc: str = Field(..., min_length=1, max_length=100)
    p_start: datetime
    p_end: datetime
    p_public: bool = False                              # 공개 여부
    p_photo: str | None = Field(None, max_length=50)    # 대표 사진 이름


class PlanCreate(PlanBase):

    @model_validator(mode="after")
    def check_dates(self):
        if self.p_end < self.p_start:
            raise ValueError("종료 시간은 시작 시간보다 빠를 수 없습니다.")
        return self


class PlanUpdate(BaseModel):
    p_title: str | None = Field(None, min_length=1, max_length=100)
    loc: str | None = Field(None, min_length=1, max_length=100)
    p_start: datetime | None = None
    p_end: datetime | None = None
    p_status: bool | None = None
    p_public: bool | None = None
    p_photo: str | None = Field(None, max_length=50)


class PlanInDB(PlanBase):
    p_id: int
    p_status: bool

    model_config = ConfigDict(from_attributes=True)


# ==================================================
# 2. 초대 코드 (invite)
# ==================================================

class InviteCreate(BaseModel):
    p_id: int
    i_code: str = Field(..., min_length=1, max_length=50)
    i_create: datetime
    i_expire: datetime

    @model_validator(mode="after")
    def check_expiration(self):
        if self.i_expire <= self.i_create:
            raise ValueError("초대 코드 만료 시간은 생성 시간 이후여야 합니다.")
        return self


class InviteVerify(BaseModel):
    i_code: str = Field(..., min_length=1, max_length=50)


class InviteUpdate(BaseModel):
    i_used: bool


class InviteInDB(InviteCreate):
    i_id: int
    i_used: bool

    model_config = ConfigDict(from_attributes=True)


# ==================================================
# 3. 여행 멤버 (plan_members)
# ==================================================

class PlanMemberCreate(BaseModel):
    p_id: int
    u_id: int
    role: str = Field(..., min_length=1, max_length=100)


class PlanMemberUpdate(BaseModel):
    role: str = Field(..., min_length=1, max_length=100)


class PlanMemberInDB(PlanMemberCreate):
    pm_id: int

    model_config = ConfigDict(from_attributes=True)


class PlanMemberOut(PlanMemberInDB):
    u_name: str | None = None   # 화면에 보여줄 멤버 이름 (users.u_name)


# ==================================================
# 4. 해시태그 (hashtag)
# ==================================================

class HashtagCreate(BaseModel):
    h_name: str = Field(..., min_length=1, max_length=100)


class HashtagInDB(HashtagCreate):
    h_id: int

    model_config = ConfigDict(from_attributes=True)


# ==================================================
# 5. 여행계획 해시태그 연결 (plan_hashtag)
# ==================================================

class PlanHashtagCreate(BaseModel):
    p_id: int
    h_id: int


class PlanHashtagInDB(PlanHashtagCreate):
    ph_id: int

    model_config = ConfigDict(from_attributes=True)


# ==================================================
# 6. 여행 세부 일정 (plan_details)
# ==================================================

class PlanDetailCreate(BaseModel):
    p_id: int
    l_id: int | None = None
    visit_time: datetime
    orders: int = Field(..., ge=0)
    memo: str | None = Field(None, max_length=255)


class PlanDetailUpdate(BaseModel):
    l_id: int | None = None
    visit_time: datetime | None = None
    orders: int | None = Field(None, ge=0)
    memo: str | None = Field(None, max_length=255)


class PlanDetailInDB(PlanDetailCreate):
    pd_id: int

    model_config = ConfigDict(from_attributes=True)


# ==================================================
# 7. 예산 (budgets)
# ==================================================

class BudgetBase(BaseModel):
    p_id: int
    b_budget: int = Field(..., ge=0)
    b_add: int | None = None


class BudgetCreate(BudgetBase):
    b_date: datetime | None = None


class BudgetUpdate(BaseModel):
    p_id: int | None = None
    b_budget: int | None = Field(None, ge=0)
    b_date: datetime | None = None
    b_add: int | None = None


class BudgetInDB(BudgetBase):
    b_id: int
    b_date: datetime

    model_config = ConfigDict(from_attributes=True)


# ==================================================
# 8. 지출 (expenses)
# ==================================================

class ExpenseCreate(BaseModel):
    b_id: int
    e_content: str = Field(..., min_length=1, max_length=255)
    e_amount: int = Field(..., ge=0)


class ExpenseUpdate(BaseModel):
    e_content: str | None = Field(None, min_length=1, max_length=255)
    e_amount: int | None = Field(None, ge=0)


class ExpenseInDB(ExpenseCreate):
    e_id: int
    e_time: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------- 지출 (expenses) ----------
class ExpenseBase(BaseModel):
    b_id: int
    e_content: str = Field(max_length=255)
    e_amount: int = Field(ge=0)          # 0원 허용 (삭제가 아니라 금액 0으로 수정 가능)
    e_time: datetime


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    b_id: int | None = None
    e_content: str | None = Field(default=None, max_length=255)
    e_amount: int | None = Field(default=None, ge=0)
    e_time: datetime | None = None


class ExpenseInDB(ExpenseBase):
    e_id: int

    model_config = ConfigDict(from_attributes=True)


# ---------- 상세 일정 (plan_details) ----------
class PlanDetailBase(BaseModel):
    p_id: int
    l_id: int | None = None              # 장소 없이 메모만 있는 일정 허용
    visit_time: datetime
    orders: int = Field(ge=0)            # 방문 순서
    memo: str | None = Field(default=None, max_length=255)


class PlanDetailCreate(PlanDetailBase):
    pass


class PlanDetailUpdate(BaseModel):
    p_id: int | None = None
    l_id: int | None = None
    visit_time: datetime | None = None
    orders: int | None = Field(default=None, ge=0)
    memo: str | None = Field(default=None, max_length=255)


class PlanDetailInDB(PlanDetailBase):
    pd_id: int

    model_config = ConfigDict(from_attributes=True)
