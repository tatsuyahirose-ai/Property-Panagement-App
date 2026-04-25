from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_employee
from app.database import get_db
from app.models.master import Department, Employee
from app.models.tenant import Tenant
from app.schemas.master import DepartmentCreate, DepartmentResponse, DepartmentUpdate
from app.tenant import get_current_tenant

router = APIRouter(prefix="/api/v1/departments", tags=["部署管理"])


@router.get("/", response_model=list[DepartmentResponse])
def list_departments(
    skip: int = 0,
    limit: int = 100,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> list[Department]:
    return list(db.query(Department).filter(Department.tenant_id == tenant.id).offset(skip).limit(limit).all())


@router.post("/", response_model=DepartmentResponse, status_code=201)
def create_department(
    data: DepartmentCreate,
    current_employee: Employee = Depends(get_current_employee),
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> Department:
    dept = Department(**data.model_dump(), tenant_id=tenant.id)
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept


@router.get("/{department_id}", response_model=DepartmentResponse)
def get_department(
    department_id: int,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> Department:
    dept = db.query(Department).filter(Department.id == department_id, Department.tenant_id == tenant.id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="部署が見つかりません")
    return dept


@router.put("/{department_id}", response_model=DepartmentResponse)
def update_department(
    department_id: int,
    data: DepartmentUpdate,
    current_employee: Employee = Depends(get_current_employee),
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> Department:
    dept = db.query(Department).filter(Department.id == department_id, Department.tenant_id == tenant.id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="部署が見つかりません")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(dept, key, value)
    db.commit()
    db.refresh(dept)
    return dept


@router.delete("/{department_id}", status_code=204)
def delete_department(
    department_id: int,
    current_employee: Employee = Depends(get_current_employee),
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> None:
    dept = db.query(Department).filter(Department.id == department_id, Department.tenant_id == tenant.id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="部署が見つかりません")
    db.delete(dept)
    db.commit()
