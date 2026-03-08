-- Upload batches: track each CSV file uploaded by users
create table if not exists public.upload_batches (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  file_name text not null,
  row_count integer not null default 0,
  file_path text,
  created_at timestamptz not null default now()
);

alter table public.upload_batches enable row level security;

create policy "Users can manage their own upload batches"
  on public.upload_batches for all
  using (
    workspace_id in (
      select id from public.workspaces where user_id = auth.uid()
    )
  );

-- Add batch_id to transactions so we can group/delete by upload
alter table public.transactions
  add column if not exists batch_id uuid references public.upload_batches(id) on delete cascade;

-- Storage bucket for raw CSV files
insert into storage.buckets (id, name, public)
values ('csv-uploads', 'csv-uploads', false)
on conflict (id) do nothing;

create policy "Users can upload CSVs"
  on storage.objects for insert
  with check (bucket_id = 'csv-uploads' and auth.role() = 'authenticated');

create policy "Users can read their CSVs"
  on storage.objects for select
  using (bucket_id = 'csv-uploads' and auth.role() = 'authenticated');

create policy "Users can delete their CSVs"
  on storage.objects for delete
  using (bucket_id = 'csv-uploads' and auth.role() = 'authenticated');
