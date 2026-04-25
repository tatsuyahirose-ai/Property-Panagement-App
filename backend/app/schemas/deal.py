from datetime import date, datetime

from pydantic import BaseModel

from app.models.deal import DealStage, DealStatus, DealType


class DealBase(BaseModel):
    deal_type: DealType
    property_id: int | None = None
    customer_id: int | None = None
    assigned_staff_id: int | None = None
    status: DealStatus = DealStatus.ACTIVE
    stage: DealStage = DealStage.INQUIRY
    expected_revenue: float | None = None
    actual_revenue: float | None = None
    notes: str | None = None
    started_at: date | None = None
    closed_at: date | None = None


class DealCreate(DealBase):
    pass


class DealUpdate(BaseModel):
    deal_type: DealType | None = None
    property_id: int | None = None
    customer_id: int | None = None
    assigned_staff_id: int | None = None
    status: DealStatus | None = None
    stage: DealStage | None = None
    expected_revenue: float | None = None
    actual_revenue: float | None = None
    notes: str | None = None
    started_at: date | None = None
    closed_at: date | None = None


class DealResponse(DealBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
