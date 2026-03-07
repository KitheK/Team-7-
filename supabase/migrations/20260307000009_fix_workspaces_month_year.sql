-- Repair: ensure workspaces has month (int) and year (int) for the app.
-- If the table was created by 000000_create_workspaces (month_year text), convert it.

do $$
begin
  -- Add month/year if they don't exist (table was created with month_year)
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'workspaces' and column_name = 'month_year'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'workspaces' and column_name = 'month'
  ) then
    alter table public.workspaces add column if not exists month int;
    alter table public.workspaces add column if not exists year int;
    -- Parse month_year: assume YYYY-MM or similar
    update public.workspaces
    set
      year = case
        when month_year ~ '^\d{4}-\d{1,2}' then (regexp_split_to_array(month_year, '-'))[1]::int
        when month_year ~ '^\d{1,2}-\d{4}' then (regexp_split_to_array(month_year, '-'))[2]::int
        else extract(year from now())::int
      end,
      month = case
        when month_year ~ '^\d{4}-\d{1,2}' then (regexp_split_to_array(month_year, '-'))[2]::int
        when month_year ~ '^\d{1,2}-\d{4}' then (regexp_split_to_array(month_year, '-'))[1]::int
        else extract(month from now())::int
      end
    where month_year is not null and month is null;
    alter table public.workspaces alter column month set not null;
    alter table public.workspaces alter column year set not null;
    alter table public.workspaces drop column if exists month_year;
    alter table public.workspaces drop constraint if exists uq_user_month;
    alter table public.workspaces add constraint uq_user_year_month unique (user_id, year, month);
  end if;
end $$;
