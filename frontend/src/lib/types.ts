// --- Property ---
export type PropertyType = "apartment" | "mansion" | "house" | "office" | "store" | "land" | "other";
export type PropertyStatus = "available" | "contracted" | "unavailable";

export interface Property {
  id: number;
  name: string;
  address: string;
  property_type: PropertyType;
  structure_type: string | null;
  built_year: number | null;
  floor_area: number | null;
  rent_price: number | null;
  sale_price: number | null;
  status: PropertyStatus;
  description: string | null;
  owner_id: number | null;
  created_at: string;
  updated_at: string;
}

// --- Customer ---
export type CustomerType = "individual" | "corporate";
export type CustomerStatus = "prospect" | "active" | "inactive";

export interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  customer_type: CustomerType;
  status: CustomerStatus;
  address: string | null;
  company_name: string | null;
  notes: string | null;
  assigned_staff_id: number | null;
  created_at: string;
  updated_at: string;
}

// --- BusinessPartner ---
export type PartnerType = "management_company" | "contractor" | "financial_institution" | "other";

export interface BusinessPartner {
  id: number;
  name: string;
  partner_type: PartnerType;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  bank_name: string | null;
  bank_branch: string | null;
  bank_account_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// --- Department ---
export interface Department {
  id: number;
  name: string;
  parent_id: number | null;
  manager_id: number | null;
  created_at: string;
  updated_at: string;
}

// --- Employee ---
export type EmployeeRole = "admin" | "manager" | "staff" | "viewer";
export type EmployeeStatus = "active" | "on_leave" | "retired";

export interface Employee {
  id: number;
  name: string;
  email: string;
  department_id: number | null;
  position: string | null;
  role: EmployeeRole;
  hire_date: string | null;
  license_info: string | null;
  status: EmployeeStatus;
  created_at: string;
  updated_at: string;
}

// --- Deal ---
export type DealType = "rental_brokerage" | "sales_brokerage" | "property_management";
export type DealStatus = "active" | "won" | "lost" | "cancelled";
export type DealStage = "inquiry" | "viewing" | "application" | "screening" | "contract" | "completed";

export interface Deal {
  id: number;
  deal_type: DealType;
  property_id: number | null;
  customer_id: number | null;
  assigned_staff_id: number | null;
  status: DealStatus;
  stage: DealStage;
  expected_revenue: number | null;
  actual_revenue: number | null;
  notes: string | null;
  started_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

// --- Account ---
export type AccountType = "asset" | "liability" | "equity" | "revenue" | "expense";
export type TaxCategory = "taxable" | "non_taxable" | "exempt";

export interface Account {
  id: number;
  code: string;
  name: string;
  account_type: AccountType;
  parent_id: number | null;
  tax_category: TaxCategory;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

// --- JournalEntry ---
export type JournalStatus = "draft" | "pending" | "approved" | "rejected";

export interface JournalEntryLine {
  id: number;
  account_id: number;
  debit_amount: number;
  credit_amount: number;
  description: string | null;
}

export interface JournalEntry {
  id: number;
  entry_date: string;
  description: string;
  status: JournalStatus;
  created_by: number | null;
  approved_by: number | null;
  lines: JournalEntryLine[];
  created_at: string;
  updated_at: string;
}

// --- TrialBalance ---
export interface TrialBalanceItem {
  account_id: number;
  account_code: string;
  account_name: string;
  account_type: AccountType;
  debit_total: number;
  credit_total: number;
  balance: number;
}

export interface TrialBalanceResponse {
  period_start: string;
  period_end: string;
  items: TrialBalanceItem[];
}

// --- KPI ---
export type KpiPeriod = "monthly" | "quarterly" | "yearly";
export type KpiType = "sales_target" | "close_rate" | "customer_acquisition_cost" | "average_close_days" | "occupancy_rate" | "rent_collection_rate";

export interface KpiTarget {
  id: number;
  employee_id: number | null;
  department_id: number | null;
  period: KpiPeriod;
  period_start: string;
  kpi_type: KpiType;
  target_value: number;
  actual_value: number | null;
  created_at: string;
  updated_at: string;
}

export interface KpiDashboardItem {
  kpi_type: KpiType;
  target_value: number;
  actual_value: number | null;
  achievement_rate: number | null;
  period: KpiPeriod;
  period_start: string;
}

// --- Document ---
export type DocumentCategory = "design" | "requirements" | "rules" | "philosophy" | "specification" | "manual" | "other";
export type DocumentStatus = "draft" | "review" | "approved" | "archived";

export interface DocumentVersion {
  id: number;
  document_id: number;
  version: number;
  content: string;
  change_summary: string | null;
  created_by: number | null;
  created_at: string;
}

export interface Document {
  id: number;
  tenant_id: number;
  title: string;
  category: DocumentCategory;
  status: DocumentStatus;
  current_version: number;
  created_by: number | null;
  approved_by: number | null;
  created_at: string;
  updated_at: string;
}
