"""シードデータ投入スクリプト

デモ用テナント・部署・社員・勘定科目・サンプル物件・顧客データを投入する。

Usage:
    cd backend
    source .venv/bin/activate
    python -m scripts.seed
"""

from datetime import date

from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.accounting import Account, AccountType, TaxCategory
from app.models.document import Document, DocumentCategory, DocumentStatus, DocumentVersion
from app.models.master import (
    BusinessPartner,
    Customer,
    CustomerStatus,
    CustomerType,
    Department,
    Employee,
    EmployeeRole,
    EmployeeStatus,
    PartnerType,
    Property,
    PropertyStatus,
    PropertyType,
)
from app.models.tenant import Tenant

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
DEFAULT_PASSWORD = "password123"


def seed_tenants(db: Session) -> Tenant:
    tenant = Tenant(
        name="サンプル不動産株式会社",
        slug="sample-realty",
        domain="sample-realty.example.com",
        plan="standard",
        is_active=True,
    )
    db.add(tenant)
    db.flush()
    return tenant


def seed_departments(db: Session, tenant_id: int) -> dict[str, Department]:
    depts: dict[str, Department] = {}

    sales = Department(tenant_id=tenant_id, name="営業部")
    db.add(sales)
    db.flush()
    depts["sales"] = sales

    rental = Department(tenant_id=tenant_id, name="賃貸管理部")
    db.add(rental)
    db.flush()
    depts["rental"] = rental

    admin_dept = Department(tenant_id=tenant_id, name="管理本部")
    db.add(admin_dept)
    db.flush()
    depts["admin"] = admin_dept

    accounting = Department(tenant_id=tenant_id, name="経理部", parent_id=admin_dept.id)
    db.add(accounting)
    db.flush()
    depts["accounting"] = accounting

    return depts


def seed_employees(
    db: Session, tenant_id: int, depts: dict[str, Department]
) -> dict[str, Employee]:
    emps: dict[str, Employee] = {}

    admin = Employee(
        tenant_id=tenant_id,
        name="管理者 太郎",
        email="admin@sample-realty.example.com",
        password_hash=pwd_context.hash(DEFAULT_PASSWORD),
        department_id=depts["admin"].id,
        position="代表取締役",
        role=EmployeeRole.ADMIN,
        hire_date=date(2020, 4, 1),
        license_info="宅地建物取引士（東京都知事 第12345号）",
        status=EmployeeStatus.ACTIVE,
    )
    db.add(admin)
    db.flush()
    emps["admin"] = admin

    manager = Employee(
        tenant_id=tenant_id,
        name="営業 花子",
        email="hanako@sample-realty.example.com",
        password_hash=pwd_context.hash(DEFAULT_PASSWORD),
        department_id=depts["sales"].id,
        position="営業部長",
        role=EmployeeRole.MANAGER,
        hire_date=date(2021, 4, 1),
        license_info="宅地建物取引士（東京都知事 第67890号）",
        status=EmployeeStatus.ACTIVE,
    )
    db.add(manager)
    db.flush()
    emps["manager"] = manager

    staff1 = Employee(
        tenant_id=tenant_id,
        name="田中 一郎",
        email="tanaka@sample-realty.example.com",
        password_hash=pwd_context.hash(DEFAULT_PASSWORD),
        department_id=depts["sales"].id,
        position="営業担当",
        role=EmployeeRole.STAFF,
        hire_date=date(2023, 4, 1),
        status=EmployeeStatus.ACTIVE,
    )
    db.add(staff1)
    db.flush()
    emps["staff1"] = staff1

    staff2 = Employee(
        tenant_id=tenant_id,
        name="佐藤 美咲",
        email="sato@sample-realty.example.com",
        password_hash=pwd_context.hash(DEFAULT_PASSWORD),
        department_id=depts["rental"].id,
        position="管理担当",
        role=EmployeeRole.STAFF,
        hire_date=date(2022, 10, 1),
        status=EmployeeStatus.ACTIVE,
    )
    db.add(staff2)
    db.flush()
    emps["staff2"] = staff2

    accountant = Employee(
        tenant_id=tenant_id,
        name="鈴木 経子",
        email="suzuki@sample-realty.example.com",
        password_hash=pwd_context.hash(DEFAULT_PASSWORD),
        department_id=depts["accounting"].id,
        position="経理担当",
        role=EmployeeRole.STAFF,
        hire_date=date(2022, 4, 1),
        status=EmployeeStatus.ACTIVE,
    )
    db.add(accountant)
    db.flush()
    emps["accountant"] = accountant

    # Set department managers
    depts["sales"].manager_id = manager.id
    depts["admin"].manager_id = admin.id
    depts["accounting"].manager_id = accountant.id

    return emps


def seed_accounts(db: Session, tenant_id: int) -> None:
    """不動産業向け勘定科目体系"""
    accounts_data = [
        # 資産
        ("1000", "資産", AccountType.ASSET, None),
        ("1100", "現金及び預金", AccountType.ASSET, "1000"),
        ("1110", "現金", AccountType.ASSET, "1100"),
        ("1120", "普通預金", AccountType.ASSET, "1100"),
        ("1130", "当座預金", AccountType.ASSET, "1100"),
        ("1200", "売掛金", AccountType.ASSET, None),
        ("1300", "前払費用", AccountType.ASSET, None),
        ("1400", "建物", AccountType.ASSET, None),
        ("1500", "土地", AccountType.ASSET, None),
        # 負債
        ("2000", "負債", AccountType.LIABILITY, None),
        ("2100", "買掛金", AccountType.LIABILITY, None),
        ("2200", "未払金", AccountType.LIABILITY, None),
        ("2300", "預り金", AccountType.LIABILITY, None),
        ("2310", "預り敷金", AccountType.LIABILITY, "2300"),
        ("2320", "預り保証金", AccountType.LIABILITY, "2300"),
        ("2400", "借入金", AccountType.LIABILITY, None),
        # 純資産
        ("3000", "純資産", AccountType.EQUITY, None),
        ("3100", "資本金", AccountType.EQUITY, None),
        ("3200", "利益剰余金", AccountType.EQUITY, None),
        # 収益
        ("4000", "売上高", AccountType.REVENUE, None),
        ("4100", "仲介手数料収入", AccountType.REVENUE, "4000"),
        ("4200", "管理費収入", AccountType.REVENUE, "4000"),
        ("4300", "賃料収入", AccountType.REVENUE, "4000"),
        ("4900", "その他収入", AccountType.REVENUE, "4000"),
        # 費用
        ("5000", "人件費", AccountType.EXPENSE, None),
        ("5100", "給与手当", AccountType.EXPENSE, "5000"),
        ("5200", "法定福利費", AccountType.EXPENSE, "5000"),
        ("5300", "福利厚生費", AccountType.EXPENSE, "5000"),
        ("6000", "営業費", AccountType.EXPENSE, None),
        ("6100", "広告宣伝費", AccountType.EXPENSE, "6000"),
        ("6200", "旅費交通費", AccountType.EXPENSE, "6000"),
        ("6300", "通信費", AccountType.EXPENSE, "6000"),
        ("7000", "管理費", AccountType.EXPENSE, None),
        ("7100", "修繕費", AccountType.EXPENSE, "7000"),
        ("7200", "水道光熱費", AccountType.EXPENSE, "7000"),
        ("7300", "保険料", AccountType.EXPENSE, "7000"),
    ]

    code_to_id: dict[str, int] = {}
    for code, name, account_type, parent_code in accounts_data:
        parent_id = code_to_id.get(parent_code) if parent_code else None
        account = Account(
            tenant_id=tenant_id,
            code=code,
            name=name,
            account_type=account_type,
            parent_id=parent_id,
            tax_category=TaxCategory.TAXABLE,
        )
        db.add(account)
        db.flush()
        code_to_id[code] = account.id


def seed_customers(
    db: Session, tenant_id: int, staff_id: int
) -> list[Customer]:
    customers_data = [
        (
            "山田 太郎", "yamada@example.com", "090-1234-5678",
            CustomerType.INDIVIDUAL, "東京都渋谷区神南1-1-1",
        ),
        (
            "株式会社ABC商事", "info@abc-shoji.example.com", "03-1234-5678",
            CustomerType.CORPORATE, "東京都中央区日本橋1-2-3",
        ),
        (
            "高橋 優子", "takahashi@example.com", "080-9876-5432",
            CustomerType.INDIVIDUAL, "東京都世田谷区三軒茶屋2-3-4",
        ),
        (
            "有限会社DEF工業", "contact@def-kogyo.example.com", "03-9876-5432",
            CustomerType.CORPORATE, "神奈川県横浜市中区元町5-6-7",
        ),
        (
            "佐々木 健一", "sasaki@example.com", "070-5555-6666",
            CustomerType.INDIVIDUAL, "東京都新宿区歌舞伎町1-8-9",
        ),
    ]

    customers = []
    for name, email, phone, ctype, address in customers_data:
        customer = Customer(
            tenant_id=tenant_id,
            name=name,
            email=email,
            phone=phone,
            customer_type=ctype,
            status=CustomerStatus.ACTIVE,
            address=address,
            company_name=name if ctype == CustomerType.CORPORATE else None,
            assigned_staff_id=staff_id,
        )
        db.add(customer)
        db.flush()
        customers.append(customer)

    return customers


def seed_properties(
    db: Session, tenant_id: int, owner_id: int | None
) -> list[Property]:
    properties_data = [
        (
            "サンプルマンション渋谷", "東京都渋谷区道玄坂1-2-3",
            PropertyType.MANSION, "RC造", 2015, 65.5, 180000, None,
        ),
        (
            "グランドハイツ新宿", "東京都新宿区西新宿7-8-9",
            PropertyType.APARTMENT, "SRC造", 2018, 42.0, 120000, None,
        ),
        (
            "ビジネスタワー品川", "東京都港区港南2-10-11",
            PropertyType.OFFICE, "S造", 2020, 150.0, 500000, None,
        ),
        (
            "コンフォート世田谷", "東京都世田谷区用賀4-5-6",
            PropertyType.MANSION, "RC造", 2010, 80.0, 220000, None,
        ),
        (
            "レジデンス目黒", "東京都目黒区中目黒3-7-8",
            PropertyType.APARTMENT, "RC造", 2022, 35.0, 100000, None,
        ),
        (
            "サウスコート横浜", "神奈川県横浜市西区みなとみらい1-1-1",
            PropertyType.MANSION, "SRC造", 2019, 95.0, 280000, None,
        ),
        (
            "分譲住宅 練馬", "東京都練馬区石神井台5-12-3",
            PropertyType.HOUSE, "木造", 2023, 110.0, None, 45000000,
        ),
        (
            "商業ビル 池袋", "東京都豊島区東池袋1-3-5",
            PropertyType.STORE, "S造", 2017, 200.0, 800000, None,
        ),
    ]

    properties = []
    for name, address, ptype, structure, year, area, rent, sale in properties_data:
        prop = Property(
            tenant_id=tenant_id,
            name=name,
            address=address,
            property_type=ptype,
            structure_type=structure,
            built_year=year,
            floor_area=area,
            rent_price=rent,
            sale_price=sale,
            status=PropertyStatus.AVAILABLE,
            owner_id=owner_id,
        )
        db.add(prop)
        db.flush()
        properties.append(prop)

    return properties


def seed_partners(db: Session, tenant_id: int) -> None:
    partners_data = [
        (
            "株式会社リフォームプロ", PartnerType.CONTRACTOR,
            "工藤 修", "03-1111-2222", "kudo@reform-pro.example.com",
        ),
        (
            "東京メンテナンス株式会社", PartnerType.MANAGEMENT_COMPANY,
            "中村 誠", "03-3333-4444", "nakamura@tokyo-maint.example.com",
        ),
        (
            "みずほ銀行 渋谷支店", PartnerType.FINANCIAL_INSTITUTION,
            "岡田 浩", "03-5555-6666", "okada@mizuho.example.com",
        ),
        (
            "株式会社クリーンサービス", PartnerType.OTHER,
            "小林 清", "03-7777-8888", "kobayashi@clean.example.com",
        ),
    ]

    for name, ptype, contact, phone, email in partners_data:
        partner = BusinessPartner(
            tenant_id=tenant_id,
            name=name,
            partner_type=ptype,
            contact_person=contact,
            phone=phone,
            email=email,
        )
        db.add(partner)


def seed_documents(
    db: Session, tenant_id: int, created_by: int
) -> None:
    docs_data = [
        (
            "システム設計書 v1", DocumentCategory.DESIGN,
            DocumentStatus.APPROVED,
            "不動産業務管理システムの全体設計。"
            "マルチテナントアーキテクチャ、モジュール構成、データベース設計を記載。",
        ),
        (
            "要件定義書", DocumentCategory.REQUIREMENTS,
            DocumentStatus.APPROVED,
            "財務会計基盤、社員統括、KPI管理、業務フロー管理、"
            "マスターデータ管理の要件を定義。",
        ),
        (
            "コーディング規約", DocumentCategory.RULES,
            DocumentStatus.APPROVED,
            "Python (PEP 8 + ruff)、TypeScript (ESLint + Prettier) "
            "のコーディング規約。",
        ),
        (
            "設計思想ドキュメント", DocumentCategory.PHILOSOPHY,
            DocumentStatus.APPROVED,
            "マルチテナント分離方式、モジュラー設計、"
            "日本の不動産業特化の設計思想を記載。",
        ),
        (
            "API仕様書", DocumentCategory.SPECIFICATION,
            DocumentStatus.DRAFT,
            "REST API エンドポイント仕様。"
            "OpenAPI (Swagger) 自動生成と補足説明。",
        ),
        (
            "管理者マニュアル", DocumentCategory.MANUAL,
            DocumentStatus.DRAFT,
            "システム管理者向けの操作マニュアル。"
            "テナント設定、ユーザー管理、バックアップ手順。",
        ),
    ]

    for title, category, status, content in docs_data:
        doc = Document(
            tenant_id=tenant_id,
            title=title,
            category=category,
            status=status,
            current_version=1,
            created_by=created_by,
            approved_by=created_by if status == DocumentStatus.APPROVED else None,
        )
        db.add(doc)
        db.flush()

        version = DocumentVersion(
            document_id=doc.id,
            version=1,
            content=content,
            change_summary="初版作成",
            created_by=created_by,
        )
        db.add(version)


def main() -> None:
    db = SessionLocal()
    try:
        # Check if seed data already exists
        existing = db.query(Tenant).filter(Tenant.slug == "sample-realty").first()
        if existing:
            print("シードデータは既に投入済みです。スキップします。")
            return

        print("シードデータを投入中...")

        tenant = seed_tenants(db)
        print(f"  テナント作成: {tenant.name} (ID: {tenant.id})")

        depts = seed_departments(db, tenant.id)
        print(f"  部署作成: {len(depts)}件")

        emps = seed_employees(db, tenant.id, depts)
        print(f"  社員作成: {len(emps)}名")

        seed_accounts(db, tenant.id)
        print("  勘定科目作成: 36科目")

        customers = seed_customers(db, tenant.id, emps["staff1"].id)
        print(f"  顧客作成: {len(customers)}件")

        properties = seed_properties(db, tenant.id, customers[0].id)
        print(f"  物件作成: {len(properties)}件")

        seed_partners(db, tenant.id)
        print("  取引先作成: 4件")

        seed_documents(db, tenant.id, emps["admin"].id)
        print("  ドキュメント作成: 6件")

        db.commit()
        print("\nシードデータの投入が完了しました。")
        print(f"テナントID: {tenant.id}")
        print("ログイン用メール: admin@sample-realty.example.com")

    except Exception as e:
        db.rollback()
        print(f"エラー: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
