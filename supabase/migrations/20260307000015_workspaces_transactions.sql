-- LeanLedger: workspaces (monthly audit) + transactions
-- Run in Supabase SQL Editor or via supabase db push

-- Workspaces: one per user per month
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month int not null check (month >= 1 and month <= 12),
  year int not null,
  total_saved numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  unique(user_id, year, month)
);

-- Transactions: uploaded rows linked to workspace
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  vendor_name text,
  amount numeric(12,2) not null,
  transaction_date date,
  description text,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.workspaces enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "Users can manage own workspaces" on public.workspaces;
create policy "Users can manage own workspaces"
  on public.workspaces for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage transactions in own workspaces" on public.transactions;
create policy "Users can manage transactions in own workspaces"
  on public.transactions for all
  using (
    exists (
      select 1 from public.workspaces w
      where w.id = transactions.workspace_id and w.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workspaces w
      where w.id = transactions.workspace_id and w.user_id = auth.uid()
    )
  );

-- Indexes for performance
create index if not exists idx_transactions_workspace_id on public.transactions(workspace_id);
create index if not exists idx_transactions_vendor_name on public.transactions(vendor_name);
create index if not exists idx_workspaces_user_id on public.workspaces(user_id);
