-- detect_negotiation_opportunities: finds vendors where spend exceeds a
-- threshold over 12 months with at least 3 months of history.
-- Filters out vendors marked "Do Not Call" in vendor_preferences.
-- Called from the client via supabase.rpc('detect_negotiation_opportunities').

create or replace function detect_negotiation_opportunities(
  p_threshold numeric default 5000
)
returns table (
  vendor_name      text,
  annual_spend     numeric,
  avg_invoice      numeric,
  month_count      bigint,
  estimated_saving numeric
)
language sql
stable
security definer
as $$
  select
    t.vendor_name,
    sum(t.amount)                              as annual_spend,
    avg(t.amount)                              as avg_invoice,
    count(distinct (w.year * 100 + w.month))   as month_count,
    round(sum(t.amount) * 0.15, 2)             as estimated_saving
  from transactions t
  join workspaces w on w.id = t.workspace_id
  left join vendor_preferences vp
    on  vp.vendor_name = t.vendor_name
    and vp.user_id     = auth.uid()
  where w.user_id = auth.uid()
    and t.transaction_date >= now() - interval '12 months'
    and (vp.do_not_call is null or vp.do_not_call = false)
  group by t.vendor_name
  having sum(t.amount) >= p_threshold
     and count(distinct (w.year * 100 + w.month)) >= 3
  order by annual_spend desc;
$$;
