from datetime import datetime

from pydantic import BaseModel

from app.models.kpi import KpiPeriod, KpiType


class KpiTargetBase(BaseModel):
    employee_id: int | None = None
    department_id: int | None = None
    period: KpiPeriod
    period_start: str
    kpi_type: KpiType
    target_value: float
    actual_value: float | None = None


class KpiTargetCreate(KpiTargetBase):
    pass


class KpiTargetUpdate(BaseModel):
    employee_id: int | None = None
    department_id: int | None = None
    period: KpiPeriod | None = None
    period_start: str | None = None
    kpi_type: KpiType | None = None
    target_value: float | None = None
    actual_value: float | None = None


class KpiTargetResponse(KpiTargetBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class KpiDashboardItem(BaseModel):
    kpi_type: KpiType
    target_value: float
    actual_value: float | None
    achievement_rate: float | None
    period: KpiPeriod
    period_start: str


class KpiDashboardResponse(BaseModel):
    items: list[KpiDashboardItem]
