import enum
from datetime import date, datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PropertyType(str, enum.Enum):
    APARTMENT = "apartment"
    MANSION = "mansion"
    HOUSE = "house"
    OFFICE = "office"
    STORE = "store"
    LAND = "land"
    OTHER = "other"


class PropertyStatus(str, enum.Enum):
    AVAILABLE = "available"
    CONTRACTED = "contracted"
    UNAVAILABLE = "unavailable"


class CustomerType(str, enum.Enum):
    INDIVIDUAL = "individual"
    CORPORATE = "corporate"


class CustomerStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PROSPECT = "prospect"


class PartnerType(str, enum.Enum):
    MANAGEMENT_COMPANY = "management_company"
    CONTRACTOR = "contractor"
    FINANCIAL_INSTITUTION = "financial_institution"
    OTHER = "other"


class EmployeeRole(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    STAFF = "staff"
    VIEWER = "viewer"


class EmployeeStatus(str, enum.Enum):
    ACTIVE = "active"
    ON_LEAVE = "on_leave"
    RETIRED = "retired"


class Property(Base):
    __tablename__ = "properties"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int] = mapped_column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    address: Mapped[str] = mapped_column(String(500), nullable=False)
    property_type: Mapped[PropertyType] = mapped_column(Enum(PropertyType), nullable=False)
    structure_type: Mapped[str | None] = mapped_column(String(100))
    built_year: Mapped[int | None] = mapped_column(Integer)
    floor_area: Mapped[float | None] = mapped_column(Numeric(10, 2))
    rent_price: Mapped[float | None] = mapped_column(Numeric(12, 0))
    sale_price: Mapped[float | None] = mapped_column(Numeric(15, 0))
    status: Mapped[PropertyStatus] = mapped_column(Enum(PropertyStatus), default=PropertyStatus.AVAILABLE)
    description: Mapped[str | None] = mapped_column(Text)
    owner_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("customers.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    owner: Mapped["Customer | None"] = relationship("Customer", back_populates="owned_properties")
    deals: Mapped[list["Deal"]] = relationship("Deal", back_populates="property")


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int] = mapped_column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str | None] = mapped_column(String(200))
    phone: Mapped[str | None] = mapped_column(String(20))
    customer_type: Mapped[CustomerType] = mapped_column(Enum(CustomerType), nullable=False)
    status: Mapped[CustomerStatus] = mapped_column(Enum(CustomerStatus), default=CustomerStatus.PROSPECT)
    address: Mapped[str | None] = mapped_column(String(500))
    company_name: Mapped[str | None] = mapped_column(String(200))
    notes: Mapped[str | None] = mapped_column(Text)
    assigned_staff_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("employees.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    assigned_staff: Mapped["Employee | None"] = relationship("Employee", back_populates="customers")
    owned_properties: Mapped[list["Property"]] = relationship("Property", back_populates="owner")
    deals: Mapped[list["Deal"]] = relationship("Deal", back_populates="customer")


class BusinessPartner(Base):
    __tablename__ = "business_partners"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int] = mapped_column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    partner_type: Mapped[PartnerType] = mapped_column(Enum(PartnerType), nullable=False)
    contact_person: Mapped[str | None] = mapped_column(String(100))
    phone: Mapped[str | None] = mapped_column(String(20))
    email: Mapped[str | None] = mapped_column(String(200))
    address: Mapped[str | None] = mapped_column(String(500))
    bank_name: Mapped[str | None] = mapped_column(String(100))
    bank_branch: Mapped[str | None] = mapped_column(String(100))
    bank_account_number: Mapped[str | None] = mapped_column(String(20))
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int] = mapped_column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    parent_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("departments.id"))
    manager_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("employees.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    parent: Mapped["Department | None"] = relationship("Department", remote_side=[id], back_populates="children")
    children: Mapped[list["Department"]] = relationship("Department", back_populates="parent")
    manager: Mapped["Employee | None"] = relationship(
        "Employee", foreign_keys=[manager_id], back_populates="managed_department"
    )
    employees: Mapped[list["Employee"]] = relationship(
        "Employee", foreign_keys="Employee.department_id", back_populates="department"
    )


class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int] = mapped_column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(200), nullable=False)
    department_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("departments.id"))
    position: Mapped[str | None] = mapped_column(String(100))
    role: Mapped[EmployeeRole] = mapped_column(Enum(EmployeeRole), default=EmployeeRole.STAFF)
    hire_date: Mapped[date | None] = mapped_column()
    license_info: Mapped[str | None] = mapped_column(Text)
    status: Mapped[EmployeeStatus] = mapped_column(Enum(EmployeeStatus), default=EmployeeStatus.ACTIVE)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    department: Mapped["Department | None"] = relationship(
        "Department", foreign_keys=[department_id], back_populates="employees"
    )
    managed_department: Mapped["Department | None"] = relationship(
        "Department", foreign_keys="Department.manager_id", back_populates="manager"
    )
    customers: Mapped[list["Customer"]] = relationship("Customer", back_populates="assigned_staff")
    deals: Mapped[list["Deal"]] = relationship("Deal", back_populates="assigned_staff")


# Forward reference imports
from app.models.deal import Deal  # noqa: E402
