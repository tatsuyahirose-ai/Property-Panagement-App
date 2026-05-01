from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import (
    create_access_token,
    get_current_employee,
    get_password_hash,
    verify_password,
)
from app.database import get_db
from app.models.master import Employee, EmployeeStatus
from app.schemas.auth import LoginRequest, MeResponse, PasswordChangeRequest, ProfileUpdateRequest, TokenResponse

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


@router.put("/me", response_model=MeResponse)
def update_profile(
    data: ProfileUpdateRequest,
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
) -> Employee:
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(current_employee, key, value)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="このメールアドレスは既に使用されています",
        )
    db.refresh(current_employee)
    return current_employee


@router.post("/change-password")
def change_password(
    data: PasswordChangeRequest,
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    if not verify_password(data.current_password, current_employee.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="現在のパスワードが正しくありません",
        )
    if len(data.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="新しいパスワードは8文字以上にしてください",
        )
    current_employee.password_hash = get_password_hash(data.new_password)
    db.commit()
    return {"message": "パスワードを変更しました"}
