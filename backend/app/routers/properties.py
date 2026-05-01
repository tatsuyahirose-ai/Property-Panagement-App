from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.activity import log_activity
from app.auth import get_current_employee
from app.database import get_db
from app.models.master import Employee, Property
from app.models.tenant import Tenant
from app.schemas.master import PropertyCreate, PropertyResponse, PropertyUpdate
from app.tenant import get_current_tenant

router = APIRouter(prefix="/api/v1/properties", tags=["物件管理"])

SORTABLE_COLUMNS = {"name", "address", "rent_price", "sale_price", "built_year", "created_at"}


@router.get("/", response_model=list[PropertyResponse])
def list_properties(
    skip: int = 0,
    limit: int = 100,
    q: str | None = None,
    property_type: str | None = None,
    status: str | None = None,
    sort_by: str | None = None,
    sort_order: str = "asc",
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> list[Property]:
    query = db.query(Property).filter(Property.tenant_id == tenant.id)
    if q:
        escaped = q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        pattern = f"%{escaped}%"
        query = query.filter(
            or_(Property.name.ilike(pattern, escape="\\"), Property.address.ilike(pattern, escape="\\"))
        )
    if property_type:
        query = query.filter(Property.property_type == property_type)
    if status:
        query = query.filter(Property.status == status)
    if sort_by and sort_by in SORTABLE_COLUMNS:
        col = getattr(Property, sort_by)
        query = query.order_by(col.desc() if sort_order == "desc" else col.asc())
    return list(query.offset(skip).limit(limit).all())


@router.post("/", response_model=PropertyResponse, status_code=201)
def create_property(
    data: PropertyCreate,
    current_employee: Employee = Depends(get_current_employee),
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> Property:
    prop = Property(**data.model_dump(), tenant_id=tenant.id)
    db.add(prop)
    db.commit()
    db.refresh(prop)
    log_activity(db, tenant.id, "create", "property", prop.id, prop.name, current_employee.id, current_employee.name)
    return prop


@router.get("/{property_id}", response_model=PropertyResponse)
def get_property(
    property_id: int,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> Property:
    prop = db.query(Property).filter(Property.id == property_id, Property.tenant_id == tenant.id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="物件が見つかりません")
    return prop


@router.put("/{property_id}", response_model=PropertyResponse)
def update_property(
    property_id: int,
    data: PropertyUpdate,
    current_employee: Employee = Depends(get_current_employee),
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> Property:
    prop = db.query(Property).filter(Property.id == property_id, Property.tenant_id == tenant.id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="物件が見つかりません")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(prop, key, value)
    db.commit()
    db.refresh(prop)
    log_activity(db, tenant.id, "update", "property", prop.id, prop.name, current_employee.id, current_employee.name)
    return prop


@router.delete("/{property_id}", status_code=204)
def delete_property(
    property_id: int,
    current_employee: Employee = Depends(get_current_employee),
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> None:
    prop = db.query(Property).filter(Property.id == property_id, Property.tenant_id == tenant.id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="物件が見つかりません")
    prop_name = prop.name
    prop_id = prop.id
    db.delete(prop)
    db.commit()
    log_activity(db, tenant.id, "delete", "property", prop_id, prop_name, current_employee.id, current_employee.name)
