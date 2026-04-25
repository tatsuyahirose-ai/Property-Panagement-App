import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class KpiType(str, enum.Enum):
    SALES_TARGET = "sales_target"
    CLOSE_RATE = "close_rate"
    CUSTOMER_ACQUISITION_COST = "customer_acquisition_cost"
    AVERAGE_CLOSE_DAYS = "average_close_days"
    OCCUPANCY_RATE = "occupancy_rate"
    RENT_COLLECTION_RATE = "rent_collection_rate"


class KpiPeriod(str, enum.Enum):
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"


class KpiTarget(Base):
    __tablename__ = "kpi_targets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int] = mapped_column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    employee_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("employees.id"))
    department_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("departments.id"))
    period: Mapped[KpiPeriod] = mapped_column(Enum(KpiPeriod), nullable=False)
    period_start: Mapped[str] = mapped_column(String(10), nullable=False)
    kpi_type: Mapped[KpiType] = mapped_column(Enum(KpiType), nullable=False)
    target_value: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    actual_value: Mapped[float | None] = mapped_column(Numeric(15, 2))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
