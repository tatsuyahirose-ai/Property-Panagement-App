from datetime import date, datetime

from pydantic import BaseModel

from app.models.accounting import AccountType, JournalStatus, TaxCategory


# --- Account ---
class AccountBase(BaseModel):
    code: str
    name: str
    account_type: AccountType
    parent_id: int | None = None
    tax_category: TaxCategory = TaxCategory.TAXABLE
    description: str | None = None
    is_active: bool = True


class AccountCreate(AccountBase):
    pass


class AccountUpdate(BaseModel):
    code: str | None = None
    name: str | None = None
    account_type: AccountType | None = None
    parent_id: int | None = None
    tax_category: TaxCategory | None = None
    description: str | None = None
    is_active: bool | None = None


class AccountResponse(AccountBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# --- JournalEntryLine ---
class JournalEntryLineBase(BaseModel):
    account_id: int
    debit_amount: float = 0
    credit_amount: float = 0
    description: str | None = None


class JournalEntryLineCreate(JournalEntryLineBase):
    pass


class JournalEntryLineResponse(JournalEntryLineBase):
    id: int

    model_config = {"from_attributes": True}


# --- JournalEntry ---
class JournalEntryBase(BaseModel):
    entry_date: date
    description: str
    status: JournalStatus = JournalStatus.DRAFT
    created_by: int | None = None


class JournalEntryCreate(JournalEntryBase):
    lines: list[JournalEntryLineCreate]


class JournalEntryUpdate(BaseModel):
    entry_date: date | None = None
    description: str | None = None
    status: JournalStatus | None = None


class JournalEntryResponse(JournalEntryBase):
    id: int
    approved_by: int | None = None
    lines: list[JournalEntryLineResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- TrialBalance ---
class TrialBalanceItem(BaseModel):
    account_id: int
    account_code: str
    account_name: str
    account_type: AccountType
    debit_total: float
    credit_total: float
    balance: float


class TrialBalanceResponse(BaseModel):
    period_start: date
    period_end: date
    items: list[TrialBalanceItem]
