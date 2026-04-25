from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_employee
from app.database import get_db
from app.models.master import BusinessPartner, Employee
from app.models.tenant import Tenant
from app.schemas.master import BusinessPartnerCreate, BusinessPartnerResponse, BusinessPartnerUpdate
from app.tenant import get_current_tenant

router = APIRouter(prefix="/api/v1/partners", tags=["取引先管理"])


@router.get("/", response_model=list[BusinessPartnerResponse])
def list_partners(
    skip: int = 0,
    limit: int = 100,
    partner_type: str | None = None,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> list[BusinessPartner]:
    query = db.query(BusinessPartner).filter(BusinessPartner.tenant_id == tenant.id)
    if partner_type:
        query = query.filter(BusinessPartner.partner_type == partner_type)
    return list(query.offset(skip).limit(limit).all())


@router.post("/", response_model=BusinessPartnerResponse, status_code=201)
def create_partner(
    data: BusinessPartnerCreate,
    current_employee: Employee = Depends(get_current_employee),
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> BusinessPartner:
    partner = BusinessPartner(**data.model_dump(), tenant_id=tenant.id)
    db.add(partner)
    db.commit()
    db.refresh(partner)
    return partner


@router.get("/{partner_id}", response_model=BusinessPartnerResponse)
def get_partner(
    partner_id: int,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> BusinessPartner:
    partner = (
        db.query(BusinessPartner)
        .filter(BusinessPartner.id == partner_id, BusinessPartner.tenant_id == tenant.id)
        .first()
    )
    if not partner:
        raise HTTPException(status_code=404, detail="取引先が見つかりません")
    return partner


@router.put("/{partner_id}", response_model=BusinessPartnerResponse)
def update_partner(
    partner_id: int,
    data: BusinessPartnerUpdate,
    current_employee: Employee = Depends(get_current_employee),
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> BusinessPartner:
    partner = (
        db.query(BusinessPartner)
        .filter(BusinessPartner.id == partner_id, BusinessPartner.tenant_id == tenant.id)
        .first()
    )
    if not partner:
        raise HTTPException(status_code=404, detail="取引先が見つかりません")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(partner, key, value)
    db.commit()
    db.refresh(partner)
    return partner


@router.delete("/{partner_id}", status_code=204)
def delete_partner(
    partner_id: int,
    current_employee: Employee = Depends(get_current_employee),
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> None:
    partner = (
        db.query(BusinessPartner)
        .filter(BusinessPartner.id == partner_id, BusinessPartner.tenant_id == tenant.id)
        .first()
    )
    if not partner:
        raise HTTPException(status_code=404, detail="取引先が見つかりません")
    db.delete(partner)
    db.commit()
