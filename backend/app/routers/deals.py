from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.activity import log_activity
from app.auth import get_current_employee
from app.database import get_db
from app.models.deal import Deal
from app.models.master import Employee
from app.models.tenant import Tenant
from app.schemas.deal import DealCreate, DealResponse, DealUpdate
from app.tenant import get_current_tenant

router = APIRouter(prefix="/api/v1/deals", tags=["案件管理"])


@router.get("/", response_model=list[DealResponse])
def list_deals(
    skip: int = 0,
    limit: int = 100,
    deal_type: str | None = None,
    status: str | None = None,
    assigned_staff_id: int | None = None,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> list[Deal]:
    query = db.query(Deal).filter(Deal.tenant_id == tenant.id)
    if deal_type:
        query = query.filter(Deal.deal_type == deal_type)
    if status:
        query = query.filter(Deal.status == status)
    if assigned_staff_id:
        query = query.filter(Deal.assigned_staff_id == assigned_staff_id)
    return list(query.order_by(Deal.created_at.desc()).offset(skip).limit(limit).all())


@router.post("/", response_model=DealResponse, status_code=201)
def create_deal(
    data: DealCreate,
    current_employee: Employee = Depends(get_current_employee),
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> Deal:
    deal = Deal(**data.model_dump(), tenant_id=tenant.id)
    db.add(deal)
    db.commit()
    db.refresh(deal)
    log_activity(
        db, tenant.id, "create", "deal",
        deal.id, f"案件#{deal.id}",
        current_employee.id, current_employee.name,
    )
    return deal


@router.get("/{deal_id}", response_model=DealResponse)
def get_deal(
    deal_id: int,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> Deal:
    deal = db.query(Deal).filter(Deal.id == deal_id, Deal.tenant_id == tenant.id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="案件が見つかりません")
    return deal


@router.put("/{deal_id}", response_model=DealResponse)
def update_deal(
    deal_id: int,
    data: DealUpdate,
    current_employee: Employee = Depends(get_current_employee),
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> Deal:
    deal = db.query(Deal).filter(Deal.id == deal_id, Deal.tenant_id == tenant.id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="案件が見つかりません")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(deal, key, value)
    db.commit()
    db.refresh(deal)
    log_activity(
        db, tenant.id, "update", "deal",
        deal.id, f"案件#{deal.id}",
        current_employee.id, current_employee.name,
    )
    return deal


@router.put("/{deal_id}/stage", response_model=DealResponse)
def update_deal_stage(
    deal_id: int,
    stage: str,
    current_employee: Employee = Depends(get_current_employee),
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> Deal:
    deal = db.query(Deal).filter(Deal.id == deal_id, Deal.tenant_id == tenant.id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="案件が見つかりません")
    deal.stage = stage  # type: ignore[assignment]
    db.commit()
    db.refresh(deal)
    log_activity(
        db, tenant.id, "stage_update", "deal",
        deal.id, f"案件#{deal.id} → {stage}",
        current_employee.id, current_employee.name,
    )
    return deal
