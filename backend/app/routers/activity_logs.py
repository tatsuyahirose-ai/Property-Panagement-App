from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.activity_log import ActivityLog
from app.models.tenant import Tenant
from app.schemas.activity_log import ActivityLogResponse
from app.tenant import get_current_tenant

router = APIRouter(prefix="/api/v1/activity-logs", tags=["アクティビティログ"])


@router.get("/", response_model=list[ActivityLogResponse])
def list_activity_logs(
    limit: int = 20,
    resource_type: str | None = None,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> list[ActivityLog]:
    query = db.query(ActivityLog).filter(ActivityLog.tenant_id == tenant.id)
    if resource_type:
        query = query.filter(ActivityLog.resource_type == resource_type)
    return list(query.order_by(ActivityLog.created_at.desc()).limit(limit).all())
