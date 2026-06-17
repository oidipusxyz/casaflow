-- ============================================================
-- CasaFlow — Supabase Schema
-- Jalankan semua query ini di Supabase SQL Editor
-- ============================================================

-- Keep-alive (wajib pertama)
CREATE TABLE keep_alive (
  id SERIAL PRIMARY KEY,
  pinged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
INSERT INTO keep_alive DEFAULT VALUES;
ALTER TABLE keep_alive DISABLE ROW LEVEL SECURITY;

-- ─── Phase 1: Auth & Workspace ───────────────────────────────────────────────

CREATE TABLE workspaces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Keluarga Kami',
  created_by UUID REFERENCES auth.users(id),
  wedding_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('suami', 'istri')) NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  birth_date DATE,
  workspace_id UUID REFERENCES workspaces(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE workspace_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES auth.users(id),
  invited_email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS: profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view profiles in same workspace"
  ON profiles FOR SELECT
  USING (workspace_id = (SELECT workspace_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (id = auth.uid());

-- RLS: workspaces
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view own workspace"
  ON workspaces FOR SELECT
  USING (id = (SELECT workspace_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Creator can update workspace"
  ON workspaces FOR UPDATE USING (created_by = auth.uid());

-- ─── Phase 1: Tracker Tanah ──────────────────────────────────────────────────

CREATE TABLE lands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  area_m2 DECIMAL(10,2) NOT NULL,
  purchase_price BIGINT NOT NULL,
  purchase_date DATE NOT NULL,
  seller_name TEXT,
  certificate_number TEXT,
  current_value BIGINT,
  pbb_due_month INTEGER CHECK (pbb_due_month BETWEEN 1 AND 12),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE land_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  land_id UUID REFERENCES lands(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('AJB', 'SHM', 'IMB', 'PBG', 'PBB', 'lainnya')) NOT NULL,
  status TEXT CHECK (status IN ('belum', 'proses', 'selesai')) DEFAULT 'belum',
  file_url TEXT,
  file_name TEXT,
  notes TEXT,
  completed_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE lands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can manage lands"
  ON lands FOR ALL
  USING (workspace_id = (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

ALTER TABLE land_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can manage land documents"
  ON land_documents FOR ALL
  USING (land_id IN (SELECT id FROM lands WHERE workspace_id = (SELECT workspace_id FROM profiles WHERE id = auth.uid())));

-- ─── Phase 1: Checklist ──────────────────────────────────────────────────────

CREATE TABLE checklist_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE
);

CREATE TABLE checklist_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  category_id UUID REFERENCES checklist_categories(id),
  title TEXT NOT NULL,
  assigned_to TEXT CHECK (assigned_to IN ('suami', 'istri', 'berdua')) DEFAULT 'berdua',
  status TEXT CHECK (status IN ('belum_mulai', 'dalam_proses', 'selesai')) DEFAULT 'belum_mulai',
  due_date DATE,
  months_before INTEGER,
  notes TEXT,
  vendor_name TEXT,
  vendor_price BIGINT,
  is_default BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE checklist_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can manage checklist categories"
  ON checklist_categories FOR ALL
  USING (workspace_id = (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can manage checklist items"
  ON checklist_items FOR ALL
  USING (workspace_id = (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

-- ─── Phase 1: Anggaran ───────────────────────────────────────────────────────

CREATE TABLE budget_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT DEFAULT '#6366f1',
  estimated_amount BIGINT DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE,
  notes TEXT
);

CREATE TABLE budget_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES budget_categories(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount BIGINT NOT NULL,
  payment_date DATE,
  payment_type TEXT CHECK (payment_type IN ('DP', 'cicilan', 'lunas', 'lainnya')),
  paid_by TEXT CHECK (paid_by IN ('suami', 'istri', 'ortu_suami', 'ortu_istri', 'bersama')),
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can manage budget categories"
  ON budget_categories FOR ALL
  USING (workspace_id = (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

ALTER TABLE budget_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can manage budget payments"
  ON budget_payments FOR ALL
  USING (workspace_id = (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

-- ─── Phase 1: Tabungan Nikah ─────────────────────────────────────────────────

CREATE TABLE savings_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'Dana Pernikahan',
  target_amount BIGINT NOT NULL,
  target_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE savings_deposits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID REFERENCES savings_goals(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,
  deposit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  deposited_by TEXT CHECK (deposited_by IN ('suami', 'istri', 'ortu_suami', 'ortu_istri', 'lainnya')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can manage savings goals"
  ON savings_goals FOR ALL
  USING (workspace_id = (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

ALTER TABLE savings_deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can manage savings deposits"
  ON savings_deposits FOR ALL
  USING (workspace_id = (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

-- ─── Phase 2: Rekening ───────────────────────────────────────────────────────

CREATE TABLE accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('keluarga', 'suami', 'istri')) NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  bank_name TEXT,
  account_number_last4 TEXT,
  current_balance BIGINT DEFAULT 0,
  safe_balance_threshold BIGINT,
  is_balance_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE account_balance_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  balance BIGINT NOT NULL,
  updated_by UUID REFERENCES auth.users(id),
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Account visibility"
  ON accounts FOR SELECT
  USING (
    (type = 'keluarga' AND workspace_id = (SELECT workspace_id FROM profiles WHERE id = auth.uid()))
    OR
    (type IN ('suami', 'istri') AND owner_id = auth.uid())
  );
CREATE POLICY "Account insert by workspace member"
  ON accounts FOR INSERT
  WITH CHECK (workspace_id = (SELECT workspace_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Account update by owner or keluarga"
  ON accounts FOR UPDATE
  USING (
    (type = 'keluarga' AND workspace_id = (SELECT workspace_id FROM profiles WHERE id = auth.uid()))
    OR owner_id = auth.uid()
  );

ALTER TABLE account_balance_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Balance updates visible to account owner or workspace"
  ON account_balance_updates FOR ALL
  USING (account_id IN (SELECT id FROM accounts));

-- ─── Phase 2: Kontribusi & Pengeluaran ───────────────────────────────────────

CREATE TABLE contribution_agreements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  method TEXT CHECK (method IN ('persentase', 'nominal', 'custom')) NOT NULL,
  husband_income BIGINT,
  wife_income BIGINT,
  husband_contribution BIGINT NOT NULL,
  wife_contribution BIGINT NOT NULL,
  percentage DECIMAL(5,2),
  notes TEXT,
  agreed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  agreed_by UUID REFERENCES auth.users(id)
);

CREATE TABLE expense_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('wajib', 'tabungan', 'hiburan', 'lainnya')) DEFAULT 'lainnya',
  icon TEXT,
  color TEXT DEFAULT '#6366f1',
  sort_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE
);

CREATE TABLE monthly_budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  category_id UUID REFERENCES expense_categories(id) ON DELETE CASCADE,
  planned_amount BIGINT DEFAULT 0,
  UNIQUE (workspace_id, month, category_id)
);

CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  category_id UUID REFERENCES expense_categories(id),
  amount BIGINT NOT NULL,
  description TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  paid_by TEXT CHECK (paid_by IN ('suami', 'istri', 'bersama')),
  receipt_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE emergency_fund (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE UNIQUE,
  target_amount BIGINT,
  current_amount BIGINT DEFAULT 0,
  storage_description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE emergency_fund_deposits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,
  deposit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE contribution_agreements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can manage contributions"
  ON contribution_agreements FOR ALL
  USING (workspace_id = (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can manage expense categories"
  ON expense_categories FOR ALL
  USING (workspace_id = (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

ALTER TABLE monthly_budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can manage monthly budgets"
  ON monthly_budgets FOR ALL
  USING (workspace_id = (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can manage expenses"
  ON expenses FOR ALL
  USING (workspace_id = (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

ALTER TABLE emergency_fund ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can manage emergency fund"
  ON emergency_fund FOR ALL
  USING (workspace_id = (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

ALTER TABLE emergency_fund_deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can manage emergency fund deposits"
  ON emergency_fund_deposits FOR ALL
  USING (workspace_id = (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

-- ─── Phase 3: Kontrakan & Furniture ─────────────────────────────────────────

CREATE TABLE rental_contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  landlord_name TEXT,
  landlord_phone TEXT,
  rent_amount BIGINT NOT NULL,
  rent_frequency TEXT CHECK (rent_frequency IN ('bulanan', 'tahunan')) DEFAULT 'tahunan',
  start_date DATE NOT NULL,
  duration_months INTEGER NOT NULL,
  end_date DATE GENERATED ALWAYS AS (start_date + (duration_months || ' months')::INTERVAL) STORED,
  deposit_amount BIGINT DEFAULT 0,
  renewal_notes TEXT,
  contract_file_url TEXT,
  status TEXT CHECK (status IN ('aktif', 'akan_habis', 'selesai')) DEFAULT 'aktif',
  move_out_target DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE house_savings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE UNIQUE,
  total_target BIGINT,
  monthly_saving_target BIGINT,
  current_amount BIGINT DEFAULT 0,
  target_start_year INTEGER,
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE house_savings_cost_breakdown (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  estimated_cost BIGINT DEFAULT 0,
  notes TEXT
);

CREATE TABLE house_savings_deposits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,
  deposit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  source TEXT CHECK (source IN ('rekening_keluarga', 'bonus', 'lainnya')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE furniture_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE
);

CREATE TABLE furniture_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  room_id UUID REFERENCES furniture_rooms(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  status TEXT CHECK (status IN ('wishlist','dipertimbangkan','disetujui','dibeli','disimpan','terpasang')) DEFAULT 'wishlist',
  priority TEXT CHECK (priority IN ('tinggi', 'sedang', 'rendah')) DEFAULT 'sedang',
  estimated_price BIGINT,
  actual_price BIGINT,
  store_name TEXT,
  store_url TEXT,
  purchase_date DATE,
  storage_location TEXT,
  photo_url TEXT,
  approved_by_suami BOOLEAN DEFAULT FALSE,
  approved_by_istri BOOLEAN DEFAULT FALSE,
  notes TEXT,
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE rental_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can manage rental contracts"
  ON rental_contracts FOR ALL
  USING (workspace_id = (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

ALTER TABLE house_savings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can manage house savings"
  ON house_savings FOR ALL
  USING (workspace_id = (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

ALTER TABLE house_savings_cost_breakdown ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can manage cost breakdown"
  ON house_savings_cost_breakdown FOR ALL
  USING (workspace_id = (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

ALTER TABLE house_savings_deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can manage house savings deposits"
  ON house_savings_deposits FOR ALL
  USING (workspace_id = (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

ALTER TABLE furniture_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can manage furniture rooms"
  ON furniture_rooms FOR ALL
  USING (workspace_id = (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

ALTER TABLE furniture_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can manage furniture items"
  ON furniture_items FOR ALL
  USING (workspace_id = (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

-- ─── Phase 4: Roadmap & Asuransi ─────────────────────────────────────────────

CREATE TABLE milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  target_year INTEGER,
  estimated_cost BIGINT,
  status TEXT CHECK (status IN ('rencana', 'dalam_proses', 'tercapai')) DEFAULT 'rencana',
  linked_module TEXT,
  notes TEXT,
  photo_url TEXT,
  achieved_at DATE,
  sort_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE child_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  planned_birth_year INTEGER,
  birth_order INTEGER DEFAULT 1,
  name TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE child_education_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_plan_id UUID REFERENCES child_plans(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  level TEXT CHECK (level IN ('SD', 'SMP', 'SMA', 'kuliah')) NOT NULL,
  current_annual_cost BIGINT NOT NULL,
  inflation_rate DECIMAL(4,2) DEFAULT 8.00,
  calculated_future_cost BIGINT,
  school_preference TEXT,
  notes TEXT
);

CREATE TABLE child_birth_costs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_plan_id UUID REFERENCES child_plans(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  estimated_cost BIGINT DEFAULT 0,
  notes TEXT
);

CREATE TABLE insurance_policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('jiwa', 'kesehatan', 'kendaraan', 'properti', 'kecelakaan', 'lainnya')) NOT NULL,
  product_name TEXT NOT NULL,
  company TEXT,
  policy_number TEXT,
  insured TEXT CHECK (insured IN ('suami', 'istri', 'keduanya')),
  coverage_amount BIGINT,
  premium_amount BIGINT NOT NULL,
  premium_frequency TEXT CHECK (premium_frequency IN ('bulanan', 'tahunan')) DEFAULT 'bulanan',
  premium_due_day INTEGER,
  start_date DATE,
  end_date DATE,
  agent_contact TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE health_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  goal_type TEXT CHECK (goal_type IN ('berat_badan', 'olahraga', 'checkup', 'lainnya')),
  title TEXT NOT NULL,
  target_value DECIMAL,
  current_value DECIMAL,
  unit TEXT,
  target_date DATE,
  reminder_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE career_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  year_target INTEGER NOT NULL,
  income_target BIGINT,
  position_target TEXT,
  skills_to_develop TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE net_worth_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('rekening', 'properti', 'kendaraan', 'investasi', 'lainnya')),
  estimated_value BIGINT NOT NULL,
  owner TEXT CHECK (owner IN ('suami', 'istri', 'bersama')),
  notes TEXT,
  last_updated DATE DEFAULT CURRENT_DATE
);

CREATE TABLE net_worth_debts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('cicilan', 'pinjaman', 'kartu_kredit', 'lainnya')),
  outstanding_amount BIGINT NOT NULL,
  monthly_installment BIGINT,
  due_date DATE,
  owner TEXT CHECK (owner IN ('suami', 'istri', 'bersama')),
  notes TEXT,
  last_updated DATE DEFAULT CURRENT_DATE
);

CREATE TABLE net_worth_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  total_assets BIGINT NOT NULL,
  total_debts BIGINT NOT NULL,
  net_worth BIGINT GENERATED ALWAYS AS (total_assets - total_debts) STORED,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can manage milestones"
  ON milestones FOR ALL
  USING (workspace_id = (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

ALTER TABLE child_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can manage child plans"
  ON child_plans FOR ALL
  USING (workspace_id = (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

ALTER TABLE child_education_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can manage child education plans"
  ON child_education_plans FOR ALL
  USING (workspace_id = (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

ALTER TABLE child_birth_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can manage child birth costs"
  ON child_birth_costs FOR ALL
  USING (workspace_id = (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can manage insurance policies"
  ON insurance_policies FOR ALL
  USING (workspace_id = (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

ALTER TABLE health_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own health goals"
  ON health_goals FOR ALL
  USING (user_id = auth.uid());

ALTER TABLE career_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own career goals"
  ON career_goals FOR ALL
  USING (user_id = auth.uid());

ALTER TABLE net_worth_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can manage net worth assets"
  ON net_worth_assets FOR ALL
  USING (workspace_id = (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

ALTER TABLE net_worth_debts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can manage net worth debts"
  ON net_worth_debts FOR ALL
  USING (workspace_id = (SELECT workspace_id FROM profiles WHERE id = auth.uid()));

ALTER TABLE net_worth_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members can manage net worth snapshots"
  ON net_worth_snapshots FOR ALL
  USING (workspace_id = (SELECT workspace_id FROM profiles WHERE id = auth.uid()));
