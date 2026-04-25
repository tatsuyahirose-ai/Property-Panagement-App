from datetime import date, datetime

from pydantic import BaseModel

from app.models.master import (
    CustomerStatus,
    CustomerType,
    EmployeeRole,
    EmployeeStatus,
    PartnerType,
    PropertyStatus,
    PropertyType,
)


# --- Property ---
class PropertyBase(BaseModel):
    name: str
    address: str
    property_type: PropertyType
    structure_type: str | None = None
    built_year: int | None = None
    floor_area: float | None = None
    rent_price: float | None = None
    sale_price: float | None = None
    status: PropertyStatus = PropertyStatus.AVAILABLE
    description: str | None = None
    owner_id: int | None = None


class PropertyCreate(PropertyBase):
    pass


class PropertyUpdate(BaseModel):
    name: str | None = None
    address: str | None = None
    property_type: PropertyType | None = None
    structure_type: str | None = None
    built_year: int | None = None
    floor_area: float | None = None
    rent_price: float | None = None
    sale_price: float | None = None
    status: PropertyStatus | None = None
    description: str | None = None
    owner_id: int | None = None


class PropertyResponse(PropertyBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- Customer ---
class CustomerBase(BaseModel):
    name: str
    email: str | None = None
    phone: str | None = None
    customer_type: CustomerType
    status: CustomerStatus = CustomerStatus.PROSPECT
    address: str | None = None
    company_name: str | None = None
    notes: str | None = None
    assigned_staff_id: int | None = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    customer_type: CustomerType | None = None
    status: CustomerStatus | None = None
    address: str | None = None
    company_name: str | None = None
    notes: str | None = None
    assigned_staff_id: int | None = None


class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- BusinessPartner ---
class BusinessPartnerBase(BaseModel):
    name: str
    partner_type: PartnerType
    contact_person: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    bank_name: str | None = None
    bank_branch: str | None = None
    bank_account_number: str | None = None
    notes: str | None = None


class BusinessPartnerCreate(BusinessPartnerBase):
    pass


class BusinessPartnerUpdate(BaseModel):
    name: str | None = None
    partner_type: PartnerType | None = None
    contact_person: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    bank_name: str | None = None
    bank_branch: str | None = None
    bank_account_number: str | None = None
    notes: str | None = None


class BusinessPartnerResponse(BusinessPartnerBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- Department ---
class DepartmentBase(BaseModel):
    name: str
    parent_id: int | None = None
    manager_id: int | None = None


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(BaseModel):
    name: str | None = None
    parent_id: int | None = None
    manager_id: int | None = None


class DepartmentResponse(DepartmentBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- Employee ---
class EmployeeBase(BaseModel):
    name: str
    email: str
    department_id: int | None = None
    position: str | None = None
    role: EmployeeRole = EmployeeRole.STAFF
    hire_date: date | None = None
    license_info: str | None = None
    status: EmployeeStatus = EmployeeStatus.ACTIVE


class EmployeeCreate(EmployeeBase):
    password: str


class EmployeeUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    department_id: int | None = None
    position: str | None = None
    role: EmployeeRole | None = None
    hire_date: date | None = None
    license_info: str | None = None
    status: EmployeeStatus | None = None


class EmployeeResponse(EmployeeBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
