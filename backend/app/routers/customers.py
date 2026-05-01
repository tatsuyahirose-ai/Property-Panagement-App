from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.activity import log_activity
from app.auth import get_current_employee
from app.database import get_db
from app.models.master import Customer, Employee
from app.models.tenant import Tenant
from app.schemas.master import CustomerCreate, CustomerResponse, CustomerUpdate
from app.tenant import get_current_tenant

router = APIRouter(prefix="/api/v1/customers", tags=["顧客管理"])

SORTABLE_COLUMNS = {"name", "email", "created_at"}


@router.get("/", response_model=list[CustomerResponse])
def list_customers(
    skip: int = 0,
    limit: int = 100,
    q: str | None = None,
    customer_type: str | None = None,
    status: str | None = None,
    sort_by: str | None = None,
    sort_order: str = "asc",
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> list[Customer]:
    query = db.query(Customer).filter(Customer.tenant_id == tenant.id)
    if q:
        escaped = q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        pattern = f"%{escaped}%"
        query = query.filter(
            or_(
                Customer.name.ilike(pattern, escape="\\"),
                Customer.email.ilike(pattern, escape="\\"),
                Customer.phone.ilike(pattern, escape="\\"),
            )
        )
    if customer_type:
        query = query.filter(Customer.customer_type == customer_type)
    if status:
        query = query.filter(Customer.status == status)
    if sort_by and sort_by in SORTABLE_COLUMNS:
        col = getattr(Customer, sort_by)
        query = query.order_by(col.desc() if sort_order == "desc" else col.asc())
    return list(query.offset(skip).limit(limit).all())


@router.post("/", response_model=CustomerResponse, status_code=201)
def create_customer(
    data: CustomerCreate,
    current_employee: Employee = Depends(get_current_employee),
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> Customer:
    customer = Customer(**data.model_dump(), tenant_id=tenant.id)
    db.add(customer)
    db.commit()
    db.refresh(customer)
    log_activity(
        db, tenant.id, "create", "customer",
        customer.id, customer.name,
        current_employee.id, current_employee.name,
    )
    return customer


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: int,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> Customer:
    customer = db.query(Customer).filter(Customer.id == customer_id, Customer.tenant_id == tenant.id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="顧客が見つかりません")
    return customer


@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    data: CustomerUpdate,
    current_employee: Employee = Depends(get_current_employee),
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> Customer:
    customer = db.query(Customer).filter(Customer.id == customer_id, Customer.tenant_id == tenant.id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="顧客が見つかりません")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(customer, key, value)
    db.commit()
    db.refresh(customer)
    log_activity(
        db, tenant.id, "update", "customer",
        customer.id, customer.name,
        current_employee.id, current_employee.name,
    )
    return customer


@router.delete("/{customer_id}", status_code=204)
def delete_customer(
    customer_id: int,
    current_employee: Employee = Depends(get_current_employee),
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> None:
    customer = db.query(Customer).filter(Customer.id == customer_id, Customer.tenant_id == tenant.id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="顧客が見つかりません")
    cust_name = customer.name
    cust_id = customer.id
    db.delete(customer)
    db.commit()
    log_activity(
        db, tenant.id, "delete", "customer",
        cust_id, cust_name,
        current_employee.id, current_employee.name,
    )
