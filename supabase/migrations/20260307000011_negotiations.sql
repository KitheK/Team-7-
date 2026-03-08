-- Negotiation system: tracks AI-powered vendor calls, live transcripts,
-- and per-vendor preferences (Do Not Call, tone).

-- ───────────────────────────────────────────────────────────────
-- negotiations: one row per AI negotiation call attempt
-- ───────────────────────────────────────────────────────────────

create table if not exists public.negotiations (
  id               uuid          primary key default gen_random_uuid(),
  workspace_id     uuid          not null references public.workspaces(id) on delete cascade,
  user_id          uuid          not null references auth.users(id) on delete cascade,
  vendor_name      text          not null,
  vendor_phone     text,
  status           text          not null default 'pending'
                   check (status in ('pending', 'calling', 'completed', 'failed', 'cancelled')),
  tone             text          default 'collaborative'
                   check (tone in ('collaborative', 'assertive', 'firm')),
  call_id          text,
  target_discount  numeric(5,2),
  agreed_discount  numeric(5,2),
  annual_spend     numeric(12,2),
  script           jsonb         default '{}',
  brief            jsonb         default '{}',
  outcome          text
                   check (outcome in ('success', 'partial', 'rejected', 'no_answer', 'error')),
  follow_up_email  text,
  created_at       timestamptz   not null default now(),
  updated_at       timestamptz   not null default now()
);

-- ───────────────────────────────────────────────────────────────
-- call_transcript_lines: real-time streamed utterances
-- ───────────────────────────────────────────────────────────────

create table if not exists public.call_transcript_lines (
  id               uuid          primary key default gen_random_uuid(),
  negotiation_id   uuid          not null references public.negotiations(id) on delete cascade,
  speaker          text          not null
                   check (speaker in ('agent', 'vendor')),
  content          text          not null,
  timestamp_ms     integer,
  created_at       timestamptz   not null default now()
);

-- ───────────────────────────────────────────────────────────────
-- vendor_preferences: per-user vendor settings
-- ───────────────────────────────────────────────────────────────

create table if not exists public.vendor_preferences (
  id               uuid          primary key default gen_random_uuid(),
  user_id          uuid          not null references auth.users(id) on delete cascade,
  vendor_name      text          not null,
  do_not_call      boolean       not null default false,
  preferred_tone   text          default 'collaborative'
                   check (preferred_tone in ('collaborative', 'assertive', 'firm')),
  notes            text,
  created_at       timestamptz   not null default now(),
  unique(user_id, vendor_name)
);

-- ───────────────────────────────────────────────────────────────
-- Auto-update updated_at on negotiations
-- ───────────────────────────────────────────────────────────────

create or replace function trg_set_negotiations_updated_at()
returns trigger
language plpgsql
security definer
as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$;

create trigger set_negotiations_updated_at
  before update on public.negotiations
  for each row
  execute function trg_set_negotiations_updated_at();

-- ───────────────────────────────────────────────────────────────
-- RLS policies
-- ───────────────────────────────────────────────────────────────

alter table public.negotiations enable row level security;
alter table public.call_transcript_lines enable row level security;
alter table public.vendor_preferences enable row level security;

create policy "negotiations_owner_only" on public.negotiations
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "transcript_lines_owner_only" on public.call_transcript_lines
  for all using (
    exists (
      select 1 from public.negotiations n
      where n.id = call_transcript_lines.negotiation_id
        and n.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.negotiations n
      where n.id = call_transcript_lines.negotiation_id
        and n.user_id = auth.uid()
    )
  );

create policy "vendor_preferences_owner_only" on public.vendor_preferences
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ───────────────────────────────────────────────────────────────
-- Indexes
-- ───────────────────────────────────────────────────────────────

create index if not exists idx_negotiations_workspace on public.negotiations(workspace_id);
create index if not exists idx_negotiations_user on public.negotiations(user_id);
create index if not exists idx_negotiations_status on public.negotiations(status);
create index if not exists idx_transcript_negotiation on public.call_transcript_lines(negotiation_id);
create index if not exists idx_vendor_prefs_user on public.vendor_preferences(user_id);

-- ───────────────────────────────────────────────────────────────
-- Realtime: enable on negotiations and transcript tables
-- ───────────────────────────────────────────────────────────────

alter table public.negotiations replica identity full;
alter table public.call_transcript_lines replica identity full;

alter publication supabase_realtime add table public.negotiations;
alter publication supabase_realtime add table public.call_transcript_lines;

-- ───────────────────────────────────────────────────────────────
-- Extend anomalies type CHECK to include negotiation_saving
-- ───────────────────────────────────────────────────────────────

alter table public.anomalies drop constraint if exists anomalies_type_check;
alter table public.anomalies add constraint anomalies_type_check
  check (type in (
    'zombie_subscription',
    'price_creep',
    'policy_violation',
    'uncategorised',
    'negotiation_saving'
  ));
