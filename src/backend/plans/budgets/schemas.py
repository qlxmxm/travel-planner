# [예산·지출] 요청·응답 데이터 모양(Pydantic)
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


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
