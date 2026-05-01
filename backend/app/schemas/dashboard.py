from pydantic import BaseModel

from app.schemas.activity_log import ActivityLogResponse


class DealStageSummary(BaseModel):
    stage: str
    count: int


class MonthlyRevenue(BaseModel):
    month: str
    revenue: float


class PropertyTypeSummary(BaseModel):
    property_type: str
    count: int


class DashboardSummary(BaseModel):
    total_properties: int
    total_customers: int
    total_deals: int
    active_deals: int
    monthly_revenue: list[MonthlyRevenue]
    deal_stages: list[DealStageSummary]
    property_types: list[PropertyTypeSummary]
    recent_activities: list[ActivityLogResponse]
