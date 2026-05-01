from datetime import date, datetime

from pydantic import BaseModel

from app.models.master import EmployeeRole, EmployeeStatus


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str


class ProfileUpdateRequest(BaseModel):
    name: str | None = None
    email: str | None = None
    position: str | None = None


class MeResponse(BaseModel):
    id: int
    tenant_id: int
    name: str
    email: str
    department_id: int | None = None
    position: str | None = None
    role: EmployeeRole
    hire_date: date | None = None
    status: EmployeeStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
