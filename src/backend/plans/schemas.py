from datetime import datetime
from pydantic import BaseModel, ConfigDict, model_validator


class PlanBase(BaseModel):
    u_id: int
    p_title: str
    loc: str
    p_start: datetime
    p_end: datetime


class PlanCreate(PlanBase):
    @model_validator(mode="after")
    def check_dates(self) -> "PlanCreate":
        if self.p_end < self.p_start:
            raise ValueError("종료 시간은 시작 시간보다 빠를 수 없습니다.")
        return self


class PlanInDB(PlanBase):
    p_id: int

    model_config = ConfigDict(from_attributes=True)


class PlanUpdate(BaseModel):
    p_title: str | None = None
    loc: str | None = None
    p_start: datetime | None = None
    p_end: datetime | None = None
    p_status: bool | None = None


class BudgetBase(BaseModel):
    p_id: int
    b_budget: int
    b_date : datetime
    b_add: int | None = None


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BaseModel):
    p_id: int | None = None
    b_budget: int | None = None
    b_date: datetime | None = None
    b_add: int | None = None


class BudgetInDB(BudgetBase):
    b_id: int

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
    memo: str | None = Field(default=None, max_length=100)


class PlanDetailCreate(PlanDetailBase):
    pass


class PlanDetailUpdate(BaseModel):
    p_id: int | None = None
    l_id: int | None = None
    visit_time: datetime | None = None
    orders: int | None = Field(default=None, ge=0)
    memo: str | None = Field(default=None, max_length=100)


class PlanDetailInDB(PlanDetailBase):
    pd_id: int

    model_config = ConfigDict(from_attributes=True)
