from datetime import datetime

from pydantic import BaseModel


class TenantBase(BaseModel):
    name: str
    slug: str
    domain: str | None = None
    plan: str = "free"
    is_active: bool = True
    settings: str | None = None


class TenantCreate(TenantBase):
    pass


class TenantUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    domain: str | None = None
    plan: str | None = None
    is_active: bool | None = None
    settings: str | None = None


class TenantResponse(TenantBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
