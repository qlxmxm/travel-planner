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
s