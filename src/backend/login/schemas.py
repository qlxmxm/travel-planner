# [로그인] 요청/응답 모양 (Pydantic). API 명세서 1~4번과 같게 맞췄습니다.
# u_pw, u_pwtest, u_token 은 응답에 절대 넣지 않습니다.
from pydantic import BaseModel, EmailStr, Field


class RegisterIn(BaseModel):
    u_email: EmailStr
    u_name: str = Field(min_length=1, max_length=100)
    u_pw: str = Field(min_length=4, max_length=72)   # bcrypt는 72바이트까지만 사용


class LoginIn(BaseModel):
    u_email: EmailStr
    u_pw: str


class UserOut(BaseModel):
    u_id: int
    u_email: EmailStr
    u_name: str

    model_config = {"from_attributes": True}


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class MessageOut(BaseModel):
    message: str
