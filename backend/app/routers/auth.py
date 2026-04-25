from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import (
    create_access_token,
    get_current_employee,
    verify_password,
)
from app.database import get_db
from app.models.master import Employee, EmployeeStatus
from app.schemas.auth import LoginRequest, MeResponse, TokenResponse

router = APIRouter(prefix="/api/v1/auth", tags=["認証"])


@router.post("/login", response_model=TokenResponse)
def login(
    data: LoginRequest,
    db: Session = Depends(get_db),
) -> dict:
    employee = db.query(Employee).filter(Employee.email == data.email).first()
    if not employee or not verify_password(data.password, employee.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="メールアドレスまたはパスワードが正しくありません",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if employee.status != EmployeeStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="このアカウントは無効です",
        )
    access_token = create_access_token(
        data={"sub": str(employee.id), "tenant_id": employee.tenant_id}
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=MeResponse)
def get_me(
    current_employee: Employee = Depends(get_current_employee),
) -> Employee:
    return current_employee
