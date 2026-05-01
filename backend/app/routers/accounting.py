import io
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from sqlalchemy import func as sql_func
from sqlalchemy.orm import Session

from app.auth import get_current_employee
from app.database import get_db
from app.models.accounting import Account, JournalEntry, JournalEntryLine, JournalStatus
from app.models.master import Employee
from app.models.tenant import Tenant
from app.schemas.accounting import (
    AccountCreate,
    AccountResponse,
    AccountUpdate,
    JournalEntryCreate,
    JournalEntryResponse,
    JournalEntryUpdate,
    TrialBalanceItem,
    TrialBalanceResponse,
)
from app.tenant import get_current_tenant

pdfmetrics.registerFont(UnicodeCIDFont("HeiseiKakuGo-W5"))

router = APIRouter(prefix="/api/v1", tags=["会計管理"])


# --- 勘定科目 ---
@router.get("/accounts", response_model=list[AccountResponse])
def list_accounts(
    account_type: str | None = None,
    is_active: bool | None = None,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> list[Account]:
    query = db.query(Account).filter(Account.tenant_id == tenant.id)
    if account_type:
        query = query.filter(Account.account_type == account_type)
    if is_active is not None:
        query = query.filter(Account.is_active == is_active)
    return list(query.order_by(Account.code).all())


@router.post("/accounts", response_model=AccountResponse, status_code=201)
def create_account(
    data: AccountCreate,
    current_employee: Employee = Depends(get_current_employee),
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> Account:
    existing = (
        db.query(Account).filter(Account.code == data.code, Account.tenant_id == tenant.id).first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="この勘定科目コードは既に使用されています")
    account = Account(**data.model_dump(), tenant_id=tenant.id)
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


@router.put("/accounts/{account_id}", response_model=AccountResponse)
def update_account(
    account_id: int,
    data: AccountUpdate,
    current_employee: Employee = Depends(get_current_employee),
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> Account:
    account = db.query(Account).filter(Account.id == account_id, Account.tenant_id == tenant.id).first()
    if not account:
        raise HTTPException(status_code=404, detail="勘定科目が見つかりません")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(account, key, value)
    db.commit()
    db.refresh(account)
    return account


# --- 仕訳 ---
@router.get("/journal-entries", response_model=list[JournalEntryResponse])
def list_journal_entries(
    skip: int = 0,
    limit: int = 100,
    status: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> list[JournalEntry]:
    query = db.query(JournalEntry).filter(JournalEntry.tenant_id == tenant.id)
    if status:
        query = query.filter(JournalEntry.status == status)
    if date_from:
        query = query.filter(JournalEntry.entry_date >= date_from)
    if date_to:
        query = query.filter(JournalEntry.entry_date <= date_to)
    return list(query.order_by(JournalEntry.entry_date.desc()).offset(skip).limit(limit).all())


@router.post("/journal-entries", response_model=JournalEntryResponse, status_code=201)
def create_journal_entry(
    data: JournalEntryCreate,
    current_employee: Employee = Depends(get_current_employee),
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> JournalEntry:
    total_debit = sum(line.debit_amount for line in data.lines)
    total_credit = sum(line.credit_amount for line in data.lines)
    if total_debit != total_credit:
        raise HTTPException(status_code=400, detail="借方合計と貸方合計が一致しません")

    entry_data = data.model_dump(exclude={"lines"})
    entry_data["tenant_id"] = tenant.id
    entry = JournalEntry(**entry_data)
    db.add(entry)
    db.flush()

    for line_data in data.lines:
        line = JournalEntryLine(**line_data.model_dump(), journal_entry_id=entry.id)
        db.add(line)

    db.commit()
    db.refresh(entry)
    return entry


@router.get("/journal-entries/{entry_id}", response_model=JournalEntryResponse)
def get_journal_entry(
    entry_id: int,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> JournalEntry:
    entry = db.query(JournalEntry).filter(JournalEntry.id == entry_id, JournalEntry.tenant_id == tenant.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="仕訳が見つかりません")
    return entry


@router.put("/journal-entries/{entry_id}", response_model=JournalEntryResponse)
def update_journal_entry(
    entry_id: int,
    data: JournalEntryUpdate,
    current_employee: Employee = Depends(get_current_employee),
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> JournalEntry:
    entry = db.query(JournalEntry).filter(JournalEntry.id == entry_id, JournalEntry.tenant_id == tenant.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="仕訳が見つかりません")
    if entry.status == JournalStatus.APPROVED:
        raise HTTPException(status_code=400, detail="承認済みの仕訳は変更できません")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(entry, key, value)
    db.commit()
    db.refresh(entry)
    return entry


@router.post("/journal-entries/{entry_id}/approve", response_model=JournalEntryResponse)
def approve_journal_entry(
    entry_id: int,
    approved_by: int,
    current_employee: Employee = Depends(get_current_employee),
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> JournalEntry:
    entry = db.query(JournalEntry).filter(JournalEntry.id == entry_id, JournalEntry.tenant_id == tenant.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="仕訳が見つかりません")
    if entry.status == JournalStatus.APPROVED:
        raise HTTPException(status_code=400, detail="既に承認済みです")
    entry.status = JournalStatus.APPROVED
    entry.approved_by = approved_by
    db.commit()
    db.refresh(entry)
    return entry


# --- 試算表 ---
@router.get("/reports/trial-balance", response_model=TrialBalanceResponse)
def get_trial_balance(
    period_start: date,
    period_end: date,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> TrialBalanceResponse:
    results = (
        db.query(
            Account.id,
            Account.code,
            Account.name,
            Account.account_type,
            sql_func.coalesce(sql_func.sum(JournalEntryLine.debit_amount), 0).label("debit_total"),
            sql_func.coalesce(sql_func.sum(JournalEntryLine.credit_amount), 0).label("credit_total"),
        )
        .outerjoin(JournalEntryLine, JournalEntryLine.account_id == Account.id)
        .outerjoin(JournalEntry, JournalEntryLine.journal_entry_id == JournalEntry.id)
        .filter(
            Account.tenant_id == tenant.id,
            (JournalEntry.entry_date >= period_start) | (JournalEntry.id.is_(None)),
            (JournalEntry.entry_date <= period_end) | (JournalEntry.id.is_(None)),
            (JournalEntry.status == JournalStatus.APPROVED) | (JournalEntry.id.is_(None)),
        )
        .filter(Account.is_active.is_(True))
        .group_by(Account.id, Account.code, Account.name, Account.account_type)
        .order_by(Account.code)
        .all()
    )

    items = []
    for row in results:
        debit_total = float(row.debit_total)
        credit_total = float(row.credit_total)
        if debit_total == 0 and credit_total == 0:
            continue
        items.append(
            TrialBalanceItem(
                account_id=row.id,
                account_code=row.code,
                account_name=row.name,
                account_type=row.account_type,
                debit_total=debit_total,
                credit_total=credit_total,
                balance=debit_total - credit_total,
            )
        )

    return TrialBalanceResponse(period_start=period_start, period_end=period_end, items=items)


TYPE_LABELS = {
    "asset": "資産",
    "liability": "負債",
    "equity": "純資産",
    "revenue": "収益",
    "expense": "費用",
}


@router.get("/reports/trial-balance/pdf")
def export_trial_balance_pdf(
    period_start: date,
    period_end: date,
    current_employee: Employee = Depends(get_current_employee),
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> StreamingResponse:
    tb = get_trial_balance(period_start, period_end, tenant, db)
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=20 * mm, bottomMargin=15 * mm)
    font = "HeiseiKakuGo-W5"

    header = [["コード", "科目名", "区分", "借方合計", "貸方合計", "残高"]]
    rows = []
    for item in tb.items:
        rows.append([
            item.account_code,
            item.account_name,
            TYPE_LABELS.get(item.account_type, item.account_type),
            f"\u00a5{item.debit_total:,.0f}",
            f"\u00a5{item.credit_total:,.0f}",
            f"\u00a5{item.balance:,.0f}",
        ])

    if not rows:
        rows.append(["", "該当するデータがありません", "", "", "", ""])

    table_data = header + rows
    col_widths = [60, 140, 60, 80, 80, 80]
    table = Table(table_data, colWidths=col_widths)
    style = TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), font),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("FONTSIZE", (0, 0), (-1, 0), 10),
        ("BACKGROUND", (0, 0), (-1, 0), colors.Color(0.2, 0.4, 0.8)),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("ALIGN", (3, 0), (5, -1), "RIGHT"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.Color(0.95, 0.95, 0.95)]),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ])
    table.setStyle(style)

    title_text = f"試算表  {period_start} 〜 {period_end}"
    title_style = ParagraphStyle("Title", fontName=font, fontSize=16, spaceAfter=12)
    elements = [Paragraph(title_text, title_style), Spacer(1, 6 * mm), table]
    doc.build(elements)
    buf.seek(0)

    filename = f"trial_balance_{period_start}_{period_end}.pdf"
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
