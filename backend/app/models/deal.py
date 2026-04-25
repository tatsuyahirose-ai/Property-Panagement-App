import enum
from datetime import date, datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class DealType(str, enum.Enum):
    RENTAL_BROKERAGE = "rental_brokerage"
    SALES_BROKERAGE = "sales_brokerage"
    PROPERTY_MANAGEMENT = "property_management"


class DealStage(str, enum.Enum):
    # 賃貸仲介
    INQUIRY = "inquiry"
    VIEWING = "viewing"
    APPLICATION = "application"
    SCREENING = "screening"
    CONTRACT = "contract"
    KEY_HANDOVER = "key_handover"
    MOVE_IN = "move_in"
    # 売買仲介
    APPRAISAL = "appraisal"
    LISTING_AGREEMENT = "listing_agreement"
    MARKETING = "marketing"
    PURCHASE_OFFER = "purchase_offer"
    EXPLANATION_CONTRACT = "explanation_contract"
    SETTLEMENT = "settlement"
    # 共通
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class DealStatus(str, enum.Enum):
    ACTIVE = "active"
    WON = "won"
    LOST = "lost"
    CANCELLED = "cancelled"


class Deal(Base):
    __tablename__ = "deals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int] = mapped_column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    deal_type: Mapped[DealType] = mapped_column(Enum(DealType), nullable=False)
    property_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("properties.id"))
    customer_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("customers.id"))
    assigned_staff_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("employees.id"))
    status: Mapped[DealStatus] = mapped_column(Enum(DealStatus), default=DealStatus.ACTIVE)
    stage: Mapped[DealStage] = mapped_column(Enum(DealStage), default=DealStage.INQUIRY)
    expected_revenue: Mapped[float | None] = mapped_column(Numeric(15, 0))
    actual_revenue: Mapped[float | None] = mapped_column(Numeric(15, 0))
    notes: Mapped[str | None] = mapped_column(Text)
    started_at: Mapped[date | None] = mapped_column()
    closed_at: Mapped[date | None] = mapped_column()
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    property: Mapped["Property | None"] = relationship("Property", back_populates="deals")
    customer: Mapped["Customer | None"] = relationship("Customer", back_populates="deals")
    assigned_staff: Mapped["Employee | None"] = relationship("Employee", back_populates="deals")


from app.models.master import Customer, Employee, Property  # noqa: E402, F401
