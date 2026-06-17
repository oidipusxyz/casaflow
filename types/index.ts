// ─── Auth & Workspace ────────────────────────────────────────────────────────

export type UserRole = 'suami' | 'istri'

export interface Profile {
  id: string
  name: string
  role: UserRole
  avatar_url: string | null
  phone: string | null
  birth_date: string | null
  workspace_id: string | null
  created_at: string
  updated_at: string
}

export interface Workspace {
  id: string
  name: string
  created_by: string
  wedding_date: string | null
  created_at: string
}

export interface WorkspaceInvite {
  id: string
  workspace_id: string
  invited_by: string
  invited_email: string
  token: string
  status: 'pending' | 'accepted' | 'expired'
  expires_at: string
  created_at: string
}

// ─── Phase 1 ─────────────────────────────────────────────────────────────────

export type LandDocumentType = 'AJB' | 'SHM' | 'IMB' | 'PBG' | 'PBB' | 'lainnya'
export type LandDocumentStatus = 'belum' | 'proses' | 'selesai'

export interface Land {
  id: string
  workspace_id: string
  location: string
  area_m2: number
  purchase_price: number
  purchase_date: string
  seller_name: string | null
  certificate_number: string | null
  current_value: number | null
  pbb_due_month: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface LandDocument {
  id: string
  land_id: string
  type: LandDocumentType
  status: LandDocumentStatus
  file_url: string | null
  file_name: string | null
  notes: string | null
  completed_date: string | null
  created_at: string
}

export type ChecklistStatus = 'belum_mulai' | 'dalam_proses' | 'selesai'
export type AssignedTo = 'suami' | 'istri' | 'berdua'

export interface ChecklistCategory {
  id: string
  workspace_id: string
  name: string
  color: string
  icon: string | null
  sort_order: number
  is_default: boolean
}

export interface ChecklistItem {
  id: string
  workspace_id: string
  category_id: string
  title: string
  assigned_to: AssignedTo
  status: ChecklistStatus
  due_date: string | null
  months_before: number | null
  notes: string | null
  vendor_name: string | null
  vendor_price: number | null
  is_default: boolean
  completed_at: string | null
  created_at: string
}

export interface BudgetCategory {
  id: string
  workspace_id: string
  name: string
  icon: string | null
  color: string
  estimated_amount: number
  sort_order: number
  is_default: boolean
  notes: string | null
}

export type PaymentType = 'DP' | 'cicilan' | 'lunas' | 'lainnya'
export type PaidBy = 'suami' | 'istri' | 'ortu_suami' | 'ortu_istri' | 'bersama'

export interface BudgetPayment {
  id: string
  category_id: string
  workspace_id: string
  description: string
  amount: number
  payment_date: string | null
  payment_type: PaymentType | null
  paid_by: PaidBy | null
  receipt_url: string | null
  created_at: string
}

export interface SavingsGoal {
  id: string
  workspace_id: string
  name: string
  target_amount: number
  target_date: string
  created_at: string
}

export interface SavingsDeposit {
  id: string
  goal_id: string
  workspace_id: string
  amount: number
  deposit_date: string
  deposited_by: PaidBy | null
  notes: string | null
  created_at: string
}

// ─── Phase 2 ─────────────────────────────────────────────────────────────────

export type AccountType = 'keluarga' | 'suami' | 'istri'

export interface Account {
  id: string
  workspace_id: string
  name: string
  type: AccountType
  owner_id: string | null
  bank_name: string | null
  account_number_last4: string | null
  current_balance: number
  safe_balance_threshold: number | null
  is_balance_visible: boolean
  created_at: string
}

export interface AccountBalanceUpdate {
  id: string
  account_id: string
  balance: number
  updated_by: string
  notes: string | null
  updated_at: string
}

export type ContributionMethod = 'persentase' | 'nominal' | 'custom'

export interface ContributionAgreement {
  id: string
  workspace_id: string
  month: string
  method: ContributionMethod
  husband_income: number | null
  wife_income: number | null
  husband_contribution: number
  wife_contribution: number
  percentage: number | null
  notes: string | null
  agreed_at: string
  agreed_by: string
}

export type ExpenseCategoryType = 'wajib' | 'tabungan' | 'hiburan' | 'lainnya'

export interface ExpenseCategory {
  id: string
  workspace_id: string
  name: string
  type: ExpenseCategoryType
  icon: string | null
  color: string
  sort_order: number
  is_default: boolean
}

export interface MonthlyBudget {
  id: string
  workspace_id: string
  month: string
  category_id: string
  planned_amount: number
}

export interface Expense {
  id: string
  workspace_id: string
  category_id: string
  amount: number
  description: string | null
  expense_date: string
  paid_by: 'suami' | 'istri' | 'bersama' | null
  receipt_url: string | null
  notes: string | null
  created_by: string
  created_at: string
}

export interface EmergencyFund {
  id: string
  workspace_id: string
  target_amount: number | null
  current_amount: number
  storage_description: string | null
  updated_at: string
}

// ─── Phase 3 ─────────────────────────────────────────────────────────────────

export type RentalStatus = 'aktif' | 'akan_habis' | 'selesai'

export interface RentalContract {
  id: string
  workspace_id: string
  address: string
  landlord_name: string | null
  landlord_phone: string | null
  rent_amount: number
  rent_frequency: 'bulanan' | 'tahunan'
  start_date: string
  duration_months: number
  end_date: string
  deposit_amount: number
  renewal_notes: string | null
  contract_file_url: string | null
  status: RentalStatus
  move_out_target: string | null
  notes: string | null
  created_at: string
}

export type FurnitureStatus =
  | 'wishlist'
  | 'dipertimbangkan'
  | 'disetujui'
  | 'dibeli'
  | 'disimpan'
  | 'terpasang'

export interface FurnitureRoom {
  id: string
  workspace_id: string
  name: string
  sort_order: number
  is_default: boolean
}

export interface FurnitureItem {
  id: string
  workspace_id: string
  room_id: string | null
  name: string
  status: FurnitureStatus
  priority: 'tinggi' | 'sedang' | 'rendah'
  estimated_price: number | null
  actual_price: number | null
  store_name: string | null
  store_url: string | null
  purchase_date: string | null
  storage_location: string | null
  photo_url: string | null
  approved_by_suami: boolean
  approved_by_istri: boolean
  notes: string | null
  added_by: string
  created_at: string
  updated_at: string
}

// ─── Phase 4 ─────────────────────────────────────────────────────────────────

export type MilestoneStatus = 'rencana' | 'dalam_proses' | 'tercapai'

export interface Milestone {
  id: string
  workspace_id: string
  title: string
  description: string | null
  target_date: string | null
  target_year: number | null
  estimated_cost: number | null
  status: MilestoneStatus
  linked_module: string | null
  notes: string | null
  photo_url: string | null
  achieved_at: string | null
  sort_order: number
  is_default: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export type InsuranceType = 'jiwa' | 'kesehatan' | 'kendaraan' | 'properti' | 'kecelakaan' | 'lainnya'

export interface InsurancePolicy {
  id: string
  workspace_id: string
  type: InsuranceType
  product_name: string
  company: string | null
  policy_number: string | null
  insured: 'suami' | 'istri' | 'keduanya' | null
  coverage_amount: number | null
  premium_amount: number
  premium_frequency: 'bulanan' | 'tahunan'
  premium_due_day: number | null
  start_date: string | null
  end_date: string | null
  agent_contact: string | null
  notes: string | null
  is_active: boolean
  created_at: string
}
