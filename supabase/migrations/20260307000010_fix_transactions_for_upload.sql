-- Make transactions table match app upload flow (nullable vendor_name/transaction_date, description).
-- Safe if table was created by workspaces_transactions; fixes table from create_transactions.

do $$
begin
  -- Add description if missing (create_transactions has no description)
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'transactions' and column_name = 'description'
  ) then
    alter table public.transactions add column description text;
  end if;

  -- Allow nulls so CSV rows with missing date/vendor still insert (no-op if already nullable)
  alter table public.transactions alter column vendor_name drop not null;
  alter table public.transactions alter column transaction_date drop not null;
end $$;
