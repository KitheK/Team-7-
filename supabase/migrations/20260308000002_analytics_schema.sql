-- ============================================================
-- Alfred Analytics Backend
-- Vendor normalization, cross-month analytics, opportunity engine
-- ============================================================

-- 1. vendor_aliases: rule-based vendor name normalization
create table if not exists public.vendor_aliases (
  id uuid primary key default gen_random_uuid(),
  pattern text not null,
  canonical_name text not null,
  match_type text not null default 'contains'
    check (match_type in ('exact', 'contains', 'regex')),
  category text,
  created_at timestamptz not null default now()
);

alter table public.vendor_aliases enable row level security;

create policy "Anyone can read vendor aliases"
  on public.vendor_aliases for select using (true);

-- Seed vendor aliases from known vendor patterns
insert into public.vendor_aliases (pattern, canonical_name, match_type, category) values
  -- Cloud & Infrastructure
  ('aws', 'Amazon Web Services', 'contains', 'Cloud & Infrastructure'),
  ('amazon web services', 'Amazon Web Services', 'contains', 'Cloud & Infrastructure'),
  ('amzn aws', 'Amazon Web Services', 'contains', 'Cloud & Infrastructure'),
  ('google cloud', 'Google Cloud', 'contains', 'Cloud & Infrastructure'),
  ('gcp', 'Google Cloud', 'exact', 'Cloud & Infrastructure'),
  ('azure', 'Microsoft Azure', 'contains', 'Cloud & Infrastructure'),
  ('digitalocean', 'DigitalOcean', 'contains', 'Cloud & Infrastructure'),
  ('cloudflare', 'Cloudflare', 'contains', 'Cloud & Infrastructure'),
  ('heroku', 'Heroku', 'contains', 'Cloud & Infrastructure'),
  ('vercel', 'Vercel', 'contains', 'Cloud & Infrastructure'),
  -- CRM & Sales
  ('salesforce', 'Salesforce', 'contains', 'CRM & Sales'),
  ('hubspot', 'HubSpot', 'contains', 'CRM & Sales'),
  ('pipedrive', 'Pipedrive', 'contains', 'CRM & Sales'),
  ('zoho crm', 'Zoho CRM', 'contains', 'CRM & Sales'),
  -- Communications
  ('slack', 'Slack', 'contains', 'Communications'),
  ('zoom', 'Zoom', 'contains', 'Communications'),
  ('twilio', 'Twilio', 'contains', 'Communications'),
  ('vonage', 'Vonage', 'contains', 'Communications'),
  ('discord', 'Discord', 'contains', 'Communications'),
  -- Design & Creative
  ('adobe', 'Adobe', 'contains', 'Design & Creative'),
  ('figma', 'Figma', 'contains', 'Design & Creative'),
  ('canva', 'Canva', 'contains', 'Design & Creative'),
  -- Customer Support
  ('zendesk', 'Zendesk', 'contains', 'Customer Support'),
  ('intercom', 'Intercom', 'contains', 'Customer Support'),
  ('freshdesk', 'Freshdesk', 'contains', 'Customer Support'),
  -- Dev & Engineering
  ('github', 'GitHub', 'contains', 'Dev & Engineering'),
  ('gitlab', 'GitLab', 'contains', 'Dev & Engineering'),
  ('atlassian', 'Atlassian', 'contains', 'Dev & Engineering'),
  ('jira', 'Atlassian', 'contains', 'Dev & Engineering'),
  ('bitbucket', 'Atlassian', 'contains', 'Dev & Engineering'),
  -- Productivity
  ('notion', 'Notion', 'contains', 'Productivity'),
  ('asana', 'Asana', 'contains', 'Productivity'),
  ('monday', 'Monday.com', 'contains', 'Productivity'),
  ('trello', 'Trello', 'contains', 'Productivity'),
  ('confluence', 'Atlassian', 'contains', 'Productivity'),
  -- Finance & Payments
  ('stripe', 'Stripe', 'contains', 'Finance & Payments'),
  ('paypal', 'PayPal', 'contains', 'Finance & Payments'),
  ('quickbooks', 'QuickBooks', 'contains', 'Finance & Payments'),
  ('xero', 'Xero', 'contains', 'Finance & Payments'),
  -- Marketing & Analytics
  ('mailchimp', 'Mailchimp', 'contains', 'Marketing & Analytics'),
  ('sendgrid', 'SendGrid', 'contains', 'Marketing & Analytics'),
  ('segment', 'Segment', 'contains', 'Marketing & Analytics'),
  ('amplitude', 'Amplitude', 'contains', 'Marketing & Analytics'),
  ('mixpanel', 'Mixpanel', 'contains', 'Marketing & Analytics'),
  ('datadog', 'Datadog', 'contains', 'Marketing & Analytics')
on conflict do nothing;

-- 2. v_transactions_normalized: join transactions with vendor aliases
create or replace view public.v_transactions_normalized as
select
  t.id as transaction_id,
  t.workspace_id,
  t.vendor_name,
  t.amount,
  t.transaction_date,
  t.description,
  t.batch_id,
  t.created_at,
  w.user_id,
  w.year,
  w.month,
  coalesce(va.canonical_name, t.vendor_name) as vendor_canonical,
  coalesce(va.category, 'Other') as vendor_category,
  case when va.id is not null then 'alias' else 'raw' end as normalization_method
from public.transactions t
join public.workspaces w on w.id = t.workspace_id
left join lateral (
  select va2.id, va2.canonical_name, va2.category
  from public.vendor_aliases va2
  where
    (va2.match_type = 'exact' and lower(t.vendor_name) = lower(va2.pattern))
    or (va2.match_type = 'contains' and lower(t.vendor_name) like '%' || lower(va2.pattern) || '%')
  order by length(va2.pattern) desc
  limit 1
) va on true;

-- 3. v_monthly_vendor_rollups: per user + vendor + month aggregation
create or replace view public.v_monthly_vendor_rollups as
select
  user_id,
  vendor_canonical,
  vendor_category,
  year,
  month,
  workspace_id,
  sum(amount) as monthly_total,
  count(*) as transaction_count,
  min(transaction_date) as first_txn_date,
  max(transaction_date) as last_txn_date
from public.v_transactions_normalized
group by user_id, vendor_canonical, vendor_category, year, month, workspace_id;

-- 4. v_vendor_cross_month_summary: cross-month analytics per user + vendor
create or replace view public.v_vendor_cross_month_summary as
with rollups as (
  select
    user_id,
    vendor_canonical,
    vendor_category,
    year,
    month,
    monthly_total,
    transaction_count,
    (year * 12 + month) as month_ordinal
  from public.v_monthly_vendor_rollups
),
vendor_agg as (
  select
    user_id,
    vendor_canonical,
    vendor_category,
    count(*) as active_month_count,
    min(year * 100 + month) as first_seen_ym,
    max(year * 100 + month) as last_seen_ym,
    avg(monthly_total) as average_monthly_spend,
    sum(monthly_total) as total_spend,
    max(monthly_total) as max_monthly_spend,
    min(monthly_total) as min_monthly_spend,
    sum(transaction_count) as total_transaction_count
  from rollups
  group by user_id, vendor_canonical, vendor_category
),
latest as (
  select distinct on (user_id, vendor_canonical)
    user_id,
    vendor_canonical,
    monthly_total as latest_monthly_spend,
    year as latest_year,
    month as latest_month
  from rollups
  order by user_id, vendor_canonical, month_ordinal desc
),
consecutive as (
  select
    user_id,
    vendor_canonical,
    max(streak) as consecutive_month_count
  from (
    select
      user_id,
      vendor_canonical,
      count(*) over (partition by user_id, vendor_canonical, grp) as streak
    from (
      select
        user_id,
        vendor_canonical,
        month_ordinal,
        month_ordinal - row_number() over (
          partition by user_id, vendor_canonical order by month_ordinal
        ) as grp
      from rollups
    ) gaps
  ) streaks
  group by user_id, vendor_canonical
),
normalization_info as (
  select distinct on (user_id, vendor_canonical)
    user_id,
    vendor_canonical,
    normalization_method
  from public.v_transactions_normalized
  order by user_id, vendor_canonical, created_at desc
)
select
  a.user_id,
  a.vendor_canonical,
  a.vendor_category,
  a.active_month_count,
  coalesce(c.consecutive_month_count, 1) as consecutive_month_count,
  a.first_seen_ym,
  a.last_seen_ym,
  round(a.average_monthly_spend, 2) as average_monthly_spend,
  l.latest_monthly_spend,
  round(a.average_monthly_spend * 12, 2) as annualized_spend,
  a.total_spend,
  a.total_transaction_count,
  a.max_monthly_spend,
  a.min_monthly_spend,
  case
    when a.active_month_count >= 2 and a.average_monthly_spend > 0
    then round(((l.latest_monthly_spend - a.average_monthly_spend) / a.average_monthly_spend) * 100, 2)
    else 0
  end as price_creep_pct,
  coalesce(ni.normalization_method, 'raw') as normalization_method
from vendor_agg a
join latest l on l.user_id = a.user_id and l.vendor_canonical = a.vendor_canonical
left join consecutive c on c.user_id = a.user_id and c.vendor_canonical = a.vendor_canonical
left join normalization_info ni on ni.user_id = a.user_id and ni.vendor_canonical = a.vendor_canonical;

-- 5. opportunities table
create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vendor_name text not null,
  canonical_vendor_name text,
  category text,
  type text not null check (type in ('email_cancellation', 'ai_negotiation', 'manual_review')),
  reason_codes text[] not null default '{}',
  explanation text not null default '',
  confidence numeric(5,2) not null default 0,
  annualized_spend numeric(12,2) not null default 0,
  estimated_annual_savings numeric(12,2) not null default 0,
  secured_annual_savings numeric(12,2) not null default 0,
  recurring_months integer not null default 0,
  latest_monthly_spend numeric(12,2),
  price_creep_pct numeric(5,2),
  status text not null default 'detected' check (status in (
    'detected', 'recommended', 'email_drafted', 'email_sent',
    'ai_call_started', 'ai_call_completed', 'resolved', 'dismissed'
  )),
  action_taken_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, canonical_vendor_name)
);

alter table public.opportunities enable row level security;

create policy "Users can read own opportunities"
  on public.opportunities for select
  using (user_id = auth.uid());

create policy "Users can update own opportunities"
  on public.opportunities for update
  using (user_id = auth.uid());

create policy "Service role can manage opportunities"
  on public.opportunities for all
  using (true)
  with check (true);

create index if not exists idx_opportunities_user on public.opportunities (user_id);
create index if not exists idx_opportunities_status on public.opportunities (status);
create index if not exists idx_opportunities_type on public.opportunities (type);

create or replace function public.set_opportunities_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_opportunities_updated_at
  before update on public.opportunities
  for each row execute function public.set_opportunities_updated_at();

-- 6. get_opportunity_summary RPC
create or replace function public.get_opportunity_summary(p_user_id uuid)
returns json as $$
  select json_build_object(
    'securedSavings', coalesce(sum(secured_annual_savings), 0),
    'potentialSavings', coalesce(
      sum(estimated_annual_savings) filter (where status not in ('resolved', 'dismissed')), 0
    ),
    'totalOpportunities', count(*) filter (where status not in ('dismissed')),
    'emailCancellationCount', count(*) filter (
      where type = 'email_cancellation' and status not in ('resolved', 'dismissed')
    ),
    'aiNegotiationCount', count(*) filter (
      where type = 'ai_negotiation' and status not in ('resolved', 'dismissed')
    ),
    'manualReviewCount', count(*) filter (
      where type = 'manual_review' and status not in ('resolved', 'dismissed')
    )
  )
  from public.opportunities
  where user_id = p_user_id;
$$ language sql stable security definer;
