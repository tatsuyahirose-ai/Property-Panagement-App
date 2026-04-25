from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.kpi import KpiTarget
from app.models.tenant import Tenant
from app.schemas.kpi import (
    KpiDashboardItem,
    KpiDashboardResponse,
    KpiTargetCreate,
    KpiTargetResponse,
    KpiTargetUpdate,
)
from app.tenant import get_current_tenant

router = APIRouter(prefix="/api/v1/kpi", tags=["KPI管理"])


@router.get("/targets", response_model=list[KpiTargetResponse])
def list_kpi_targets(
    employee_id: int | None = None,
    department_id: int | None = None,
    period_start: str | None = None,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> list[KpiTarget]:
    query = db.query(KpiTarget).filter(KpiTarget.tenant_id == tenant.id)
    if employee_id:
        query = query.filter(KpiTarget.employee_id == employee_id)
    if department_id:
        query = query.filter(KpiTarget.department_id == department_id)
    if period_start:
        query = query.filter(KpiTarget.period_start == period_start)
    return list(query.all())


@router.post("/targets", response_model=KpiTargetResponse, status_code=201)
def create_kpi_target(
    data: KpiTargetCreate,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> KpiTarget:
    target = KpiTarget(**data.model_dump(), tenant_id=tenant.id)
    db.add(target)
    db.commit()
    db.refresh(target)
    return target


@router.put("/targets/{target_id}", response_model=KpiTargetResponse)
def update_kpi_target(
    target_id: int,
    data: KpiTargetUpdate,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> KpiTarget:
    target = db.query(KpiTarget).filter(KpiTarget.id == target_id, KpiTarget.tenant_id == tenant.id).first()
    if not target:
        raise HTTPException(status_code=404, detail="KPI目標が見つかりません")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(target, key, value)
    db.commit()
    db.refresh(target)
    return target


@router.get("/dashboard", response_model=KpiDashboardResponse)
def get_kpi_dashboard(
    period_start: str,
    employee_id: int | None = None,
    department_id: int | None = None,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> KpiDashboardResponse:
    query = db.query(KpiTarget).filter(
        KpiTarget.tenant_id == tenant.id,
        KpiTarget.period_start == period_start,
    )
    if employee_id:
        query = query.filter(KpiTarget.employee_id == employee_id)
    if department_id:
        query = query.filter(KpiTarget.department_id == department_id)

    targets = query.all()
    items = []
    for target in targets:
        achievement_rate = None
        if target.actual_value is not None and target.target_value > 0:
            achievement_rate = round(float(target.actual_value) / float(target.target_value) * 100, 1)
        items.append(
            KpiDashboardItem(
                kpi_type=target.kpi_type,
                target_value=float(target.target_value),
                actual_value=float(target.actual_value) if target.actual_value is not None else None,
                achievement_rate=achievement_rate,
                period=target.period,
                period_start=target.period_start,
            )
        )

    return KpiDashboardResponse(items=items)
