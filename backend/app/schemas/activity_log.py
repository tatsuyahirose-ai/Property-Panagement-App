from datetime import datetime

from pydantic import BaseModel


class ActivityLogResponse(BaseModel):
    id: int
    tenant_id: int
    employee_id: int | None = None
    employee_name: str | None = None
    action: str
    resource_type: str
    resource_id: int | None = None
    resource_name: str | None = None
    details: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
