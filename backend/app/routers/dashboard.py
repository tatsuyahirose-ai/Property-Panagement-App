from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.activity_log import ActivityLog
from app.models.deal import Deal
from app.models.master import Customer, Property
from app.models.tenant import Tenant
from app.schemas.activity_log import ActivityLogResponse
from app.schemas.dashboard import (
    DashboardSummary,
    DealStageSummary,
    MonthlyRevenue,
    PropertyTypeSummary,
)
from app.tenant import get_current_tenant

router = APIRouter(prefix="/api/v1/dashboard", tags=["ダッシュボード"])


def _enum_str(val: object) -> str:
    return str(val.value if hasattr(val, "value") else val)


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> DashboardSummary:
    tid = tenant.id

    total_properties = (
        db.query(func.count(Property.id))
        .filter(Property.tenant_id == tid)
        .scalar() or 0
    )
    total_customers = (
        db.query(func.count(Customer.id))
        .filter(Customer.tenant_id == tid)
        .scalar() or 0
    )
    total_deals = (
        db.query(func.count(Deal.id))
        .filter(Deal.tenant_id == tid)
        .scalar() or 0
    )
    active_deals = (
        db.query(func.count(Deal.id))
        .filter(Deal.tenant_id == tid, Deal.status == "active")
        .scalar() or 0
    )

    stage_rows = (
        db.query(Deal.stage, func.count(Deal.id))
        .filter(Deal.tenant_id == tid)
        .group_by(Deal.stage)
        .all()
    )
    deal_stages = [
        DealStageSummary(stage=_enum_str(r[0]), count=r[1])
        for r in stage_rows
    ]

    type_rows = (
        db.query(Property.property_type, func.count(Property.id))
        .filter(Property.tenant_id == tid)
        .group_by(Property.property_type)
        .all()
    )
    property_types = [
        PropertyTypeSummary(
            property_type=_enum_str(r[0]), count=r[1],
        )
        for r in type_rows
    ]

    today = date.today()
    six_months_ago = today - timedelta(days=180)
    revenue_rows = (
        db.query(
            func.to_char(Deal.closed_at, "YYYY-MM").label("month"),
            func.coalesce(func.sum(Deal.actual_revenue), 0),
        )
        .filter(
            Deal.tenant_id == tid,
            Deal.closed_at >= six_months_ago,
            Deal.actual_revenue.isnot(None),
        )
        .group_by(func.to_char(Deal.closed_at, "YYYY-MM"))
        .order_by(func.to_char(Deal.closed_at, "YYYY-MM"))
        .all()
    )
    monthly_revenue = [
        MonthlyRevenue(month=r[0], revenue=float(r[1]))
        for r in revenue_rows
    ]

    activities = (
        db.query(ActivityLog)
        .filter(ActivityLog.tenant_id == tid)
        .order_by(ActivityLog.created_at.desc())
        .limit(10)
        .all()
    )
    recent_activities = [
        ActivityLogResponse.model_validate(a) for a in activities
    ]

    return DashboardSummary(
        total_properties=total_properties,
        total_customers=total_customers,
        total_deals=total_deals,
        active_deals=active_deals,
        monthly_revenue=monthly_revenue,
        deal_stages=deal_stages,
        property_types=property_types,
        recent_activities=recent_activities,
    )
