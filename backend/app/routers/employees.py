from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_employee, get_password_hash
from app.database import get_db
from app.models.master import Employee
from app.models.tenant import Tenant
from app.schemas.master import EmployeeCreate, EmployeeResponse, EmployeeUpdate
from app.tenant import get_current_tenant

router = APIRouter(prefix="/api/v1/employees", tags=["社員管理"])


@router.get("/", response_model=list[EmployeeResponse])
def list_employees(
    skip: int = 0,
    limit: int = 100,
    department_id: int | None = None,
    status: str | None = None,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> list[Employee]:
    query = db.query(Employee).filter(Employee.tenant_id == tenant.id)
    if department_id:
        query = query.filter(Employee.department_id == department_id)
    if status:
        query = query.filter(Employee.status == status)
    return list(query.offset(skip).limit(limit).all())


@router.post("/", response_model=EmployeeResponse, status_code=201)
def create_employee(
    data: EmployeeCreate,
    current_employee: Employee = Depends(get_current_employee),
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> Employee:
    existing = db.query(Employee).filter(Employee.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="このメールアドレスは既に使用されています")
    employee_data = data.model_dump(exclude={"password"})
    employee_data["password_hash"] = get_password_hash(data.password)
    employee_data["tenant_id"] = tenant.id
    employee = Employee(**employee_data)
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee


@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(
    employee_id: int,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> Employee:
    employee = db.query(Employee).filter(Employee.id == employee_id, Employee.tenant_id == tenant.id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="社員が見つかりません")
    return employee


@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: int,
    data: EmployeeUpdate,
    current_employee: Employee = Depends(get_current_employee),
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> Employee:
    employee = db.query(Employee).filter(Employee.id == employee_id, Employee.tenant_id == tenant.id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="社員が見つかりません")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(employee, key, value)
    db.commit()
    db.refresh(employee)
    return employee
