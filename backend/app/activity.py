import logging

from sqlalchemy.orm import Session

from app.models.activity_log import ActivityLog

logger = logging.getLogger(__name__)


def log_activity(
    db: Session,
    tenant_id: int,
    action: str,
    resource_type: str,
    resource_id: int | None = None,
    resource_name: str | None = None,
    employee_id: int | None = None,
    employee_name: str | None = None,
    details: str | None = None,
) -> None:
    try:
        log = ActivityLog(
            tenant_id=tenant_id,
            employee_id=employee_id,
            employee_name=employee_name,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            resource_name=resource_name,
            details=details,
        )
        db.add(log)
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Failed to log activity: %s %s", action, resource_type)
