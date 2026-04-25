"""initial_schema

Revision ID: 4b2b98e0915d
Revises:
Create Date: 2026-04-25 20:54:10.561156

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '4b2b98e0915d'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 1. tenants (no FK dependencies)
    op.create_table('tenants',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('name', sa.String(length=200), nullable=False),
    sa.Column('slug', sa.String(length=100), nullable=False),
    sa.Column('domain', sa.String(length=200), nullable=True),
    sa.Column('plan', sa.String(length=50), nullable=False),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('settings', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('slug')
    )

    # 2. departments (without manager_id FK to break circular dependency)
    op.create_table('departments',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('tenant_id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('parent_id', sa.Integer(), nullable=True),
    sa.Column('manager_id', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['parent_id'], ['departments.id'], ),
    sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_departments_tenant_id'), 'departments', ['tenant_id'], unique=False)

    # 3. employees (depends on tenants, departments)
    op.create_table('employees',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('tenant_id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('email', sa.String(length=200), nullable=False),
    sa.Column('password_hash', sa.String(length=200), nullable=False),
    sa.Column('department_id', sa.Integer(), nullable=True),
    sa.Column('position', sa.String(length=100), nullable=True),
    sa.Column('role', sa.Enum('ADMIN', 'MANAGER', 'STAFF', 'VIEWER', name='employeerole'), nullable=False),
    sa.Column('hire_date', sa.Date(), nullable=True),
    sa.Column('license_info', sa.Text(), nullable=True),
    sa.Column('status', sa.Enum('ACTIVE', 'ON_LEAVE', 'RETIRED', name='employeestatus'), nullable=False),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['department_id'], ['departments.id'], ),
    sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('email')
    )
    op.create_index(op.f('ix_employees_tenant_id'), 'employees', ['tenant_id'], unique=False)

    # 4. Add deferred FK: departments.manager_id -> employees.id
    op.create_foreign_key('fk_departments_manager_id', 'departments', 'employees', ['manager_id'], ['id'])

    # 5. accounts (depends on tenants)
    op.create_table('accounts',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('tenant_id', sa.Integer(), nullable=False),
    sa.Column('code', sa.String(length=10), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('account_type', sa.Enum(
        'ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE',
        name='accounttype',
    ), nullable=False),
    sa.Column('parent_id', sa.Integer(), nullable=True),
    sa.Column('tax_category', sa.Enum('TAXABLE', 'NON_TAXABLE', 'EXEMPT', name='taxcategory'), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['parent_id'], ['accounts.id'], ),
    sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_accounts_tenant_id'), 'accounts', ['tenant_id'], unique=False)

    # 6. business_partners (depends on tenants)
    op.create_table('business_partners',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('tenant_id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=200), nullable=False),
    sa.Column('partner_type', sa.Enum(
        'MANAGEMENT_COMPANY', 'CONTRACTOR', 'FINANCIAL_INSTITUTION', 'OTHER',
        name='partnertype',
    ), nullable=False),
    sa.Column('contact_person', sa.String(length=100), nullable=True),
    sa.Column('phone', sa.String(length=20), nullable=True),
    sa.Column('email', sa.String(length=200), nullable=True),
    sa.Column('address', sa.String(length=500), nullable=True),
    sa.Column('bank_name', sa.String(length=100), nullable=True),
    sa.Column('bank_branch', sa.String(length=100), nullable=True),
    sa.Column('bank_account_number', sa.String(length=20), nullable=True),
    sa.Column('notes', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_business_partners_tenant_id'), 'business_partners', ['tenant_id'], unique=False)

    # 7. customers (depends on tenants, employees)
    op.create_table('customers',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('tenant_id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=200), nullable=False),
    sa.Column('email', sa.String(length=200), nullable=True),
    sa.Column('phone', sa.String(length=20), nullable=True),
    sa.Column('customer_type', sa.Enum('INDIVIDUAL', 'CORPORATE', name='customertype'), nullable=False),
    sa.Column('status', sa.Enum('ACTIVE', 'INACTIVE', 'PROSPECT', name='customerstatus'), nullable=False),
    sa.Column('address', sa.String(length=500), nullable=True),
    sa.Column('company_name', sa.String(length=200), nullable=True),
    sa.Column('notes', sa.Text(), nullable=True),
    sa.Column('assigned_staff_id', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['assigned_staff_id'], ['employees.id'], ),
    sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_customers_tenant_id'), 'customers', ['tenant_id'], unique=False)

    # 8. documents (depends on tenants, employees)
    op.create_table('documents',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('tenant_id', sa.Integer(), nullable=False),
    sa.Column('title', sa.String(length=300), nullable=False),
    sa.Column('category', sa.Enum(
        'DESIGN', 'REQUIREMENTS', 'RULES', 'PHILOSOPHY',
        'SPECIFICATION', 'MANUAL', 'OTHER',
        name='documentcategory',
    ), nullable=False),
    sa.Column('status', sa.Enum('DRAFT', 'REVIEW', 'APPROVED', 'ARCHIVED', name='documentstatus'), nullable=False),
    sa.Column('current_version', sa.Integer(), nullable=False),
    sa.Column('created_by', sa.Integer(), nullable=True),
    sa.Column('approved_by', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['approved_by'], ['employees.id'], ),
    sa.ForeignKeyConstraint(['created_by'], ['employees.id'], ),
    sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_documents_tenant_id'), 'documents', ['tenant_id'], unique=False)

    # 9. journal_entries (depends on tenants, employees)
    op.create_table('journal_entries',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('tenant_id', sa.Integer(), nullable=False),
    sa.Column('entry_date', sa.Date(), nullable=False),
    sa.Column('description', sa.String(length=500), nullable=False),
    sa.Column('status', sa.Enum('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', name='journalstatus'), nullable=False),
    sa.Column('created_by', sa.Integer(), nullable=True),
    sa.Column('approved_by', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['approved_by'], ['employees.id'], ),
    sa.ForeignKeyConstraint(['created_by'], ['employees.id'], ),
    sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_journal_entries_tenant_id'), 'journal_entries', ['tenant_id'], unique=False)

    # 10. kpi_targets (depends on tenants, employees, departments)
    op.create_table('kpi_targets',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('tenant_id', sa.Integer(), nullable=False),
    sa.Column('employee_id', sa.Integer(), nullable=True),
    sa.Column('department_id', sa.Integer(), nullable=True),
    sa.Column('period', sa.Enum('MONTHLY', 'QUARTERLY', 'YEARLY', name='kpiperiod'), nullable=False),
    sa.Column('period_start', sa.String(length=10), nullable=False),
    sa.Column('kpi_type', sa.Enum(
        'SALES_TARGET', 'CLOSE_RATE', 'CUSTOMER_ACQUISITION_COST',
        'AVERAGE_CLOSE_DAYS', 'OCCUPANCY_RATE', 'RENT_COLLECTION_RATE',
        name='kpitype',
    ), nullable=False),
    sa.Column('target_value', sa.Numeric(precision=15, scale=2), nullable=False),
    sa.Column('actual_value', sa.Numeric(precision=15, scale=2), nullable=True),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['department_id'], ['departments.id'], ),
    sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ),
    sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_kpi_targets_tenant_id'), 'kpi_targets', ['tenant_id'], unique=False)

    # 11. document_versions (depends on documents, employees)
    op.create_table('document_versions',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('document_id', sa.Integer(), nullable=False),
    sa.Column('version', sa.Integer(), nullable=False),
    sa.Column('content', sa.Text(), nullable=False),
    sa.Column('change_summary', sa.String(length=500), nullable=True),
    sa.Column('created_by', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['created_by'], ['employees.id'], ),
    sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    # 12. journal_entry_lines (depends on journal_entries, accounts)
    op.create_table('journal_entry_lines',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('journal_entry_id', sa.Integer(), nullable=False),
    sa.Column('account_id', sa.Integer(), nullable=False),
    sa.Column('debit_amount', sa.Numeric(precision=15, scale=0), nullable=False),
    sa.Column('credit_amount', sa.Numeric(precision=15, scale=0), nullable=False),
    sa.Column('description', sa.String(length=500), nullable=True),
    sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], ),
    sa.ForeignKeyConstraint(['journal_entry_id'], ['journal_entries.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    # 13. properties (depends on tenants, customers)
    op.create_table('properties',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('tenant_id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=200), nullable=False),
    sa.Column('address', sa.String(length=500), nullable=False),
    sa.Column('property_type', sa.Enum(
        'APARTMENT', 'MANSION', 'HOUSE', 'OFFICE', 'STORE', 'LAND', 'OTHER',
        name='propertytype',
    ), nullable=False),
    sa.Column('structure_type', sa.String(length=100), nullable=True),
    sa.Column('built_year', sa.Integer(), nullable=True),
    sa.Column('floor_area', sa.Numeric(precision=10, scale=2), nullable=True),
    sa.Column('rent_price', sa.Numeric(precision=12, scale=0), nullable=True),
    sa.Column('sale_price', sa.Numeric(precision=15, scale=0), nullable=True),
    sa.Column('status', sa.Enum('AVAILABLE', 'CONTRACTED', 'UNAVAILABLE', name='propertystatus'), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('owner_id', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['owner_id'], ['customers.id'], ),
    sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_properties_tenant_id'), 'properties', ['tenant_id'], unique=False)

    # 14. deals (depends on tenants, properties, customers, employees)
    op.create_table('deals',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('tenant_id', sa.Integer(), nullable=False),
    sa.Column('deal_type', sa.Enum(
        'RENTAL_BROKERAGE', 'SALES_BROKERAGE', 'PROPERTY_MANAGEMENT',
        name='dealtype',
    ), nullable=False),
    sa.Column('property_id', sa.Integer(), nullable=True),
    sa.Column('customer_id', sa.Integer(), nullable=True),
    sa.Column('assigned_staff_id', sa.Integer(), nullable=True),
    sa.Column('status', sa.Enum('ACTIVE', 'WON', 'LOST', 'CANCELLED', name='dealstatus'), nullable=False),
    sa.Column('stage', sa.Enum(
        'INQUIRY', 'VIEWING', 'APPLICATION', 'SCREENING', 'CONTRACT',
        'KEY_HANDOVER', 'MOVE_IN', 'APPRAISAL', 'LISTING_AGREEMENT',
        'MARKETING', 'PURCHASE_OFFER', 'EXPLANATION_CONTRACT',
        'SETTLEMENT', 'COMPLETED', 'CANCELLED',
        name='dealstage',
    ), nullable=False),
    sa.Column('expected_revenue', sa.Numeric(precision=15, scale=0), nullable=True),
    sa.Column('actual_revenue', sa.Numeric(precision=15, scale=0), nullable=True),
    sa.Column('notes', sa.Text(), nullable=True),
    sa.Column('started_at', sa.Date(), nullable=True),
    sa.Column('closed_at', sa.Date(), nullable=True),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['assigned_staff_id'], ['employees.id'], ),
    sa.ForeignKeyConstraint(['customer_id'], ['customers.id'], ),
    sa.ForeignKeyConstraint(['property_id'], ['properties.id'], ),
    sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_deals_tenant_id'), 'deals', ['tenant_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_deals_tenant_id'), table_name='deals')
    op.drop_table('deals')
    op.drop_index(op.f('ix_properties_tenant_id'), table_name='properties')
    op.drop_table('properties')
    op.drop_table('journal_entry_lines')
    op.drop_table('document_versions')
    op.drop_index(op.f('ix_kpi_targets_tenant_id'), table_name='kpi_targets')
    op.drop_table('kpi_targets')
    op.drop_index(op.f('ix_journal_entries_tenant_id'), table_name='journal_entries')
    op.drop_table('journal_entries')
    op.drop_index(op.f('ix_documents_tenant_id'), table_name='documents')
    op.drop_table('documents')
    op.drop_index(op.f('ix_customers_tenant_id'), table_name='customers')
    op.drop_table('customers')
    op.drop_index(op.f('ix_business_partners_tenant_id'), table_name='business_partners')
    op.drop_table('business_partners')
    op.drop_index(op.f('ix_accounts_tenant_id'), table_name='accounts')
    op.drop_table('accounts')
    op.drop_constraint('fk_departments_manager_id', 'departments', type_='foreignkey')
    op.drop_index(op.f('ix_employees_tenant_id'), table_name='employees')
    op.drop_table('employees')
    op.drop_index(op.f('ix_departments_tenant_id'), table_name='departments')
    op.drop_table('departments')
    op.drop_table('tenants')

    enum_types = [
        'dealstage', 'dealstatus', 'dealtype',
        'propertystatus', 'propertytype',
        'documentcategory', 'documentstatus',
        'journalstatus', 'kpiperiod', 'kpitype',
        'accounttype', 'taxcategory',
        'customertype', 'customerstatus',
        'partnertype',
        'employeerole', 'employeestatus',
    ]
    for enum_type in enum_types:
        op.execute(f"DROP TYPE IF EXISTS {enum_type}")
