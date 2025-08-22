-- 1) Documents table (using existing user_id column)
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Storage bucket for file uploads
insert into storage.buckets (id, name, public) 
values ('docs', 'docs', false)
on conflict (id) do nothing;

-- 3) Triggers
create or replace function public.set_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;

drop trigger if exists trg_documents_updated_at on public.documents;
create trigger trg_documents_updated_at
before update on public.documents
for each row execute procedure public.set_updated_at();

-- 4) RLS
alter table public.documents enable row level security;

-- Read own docs
create policy "read own documents"
on public.documents for select
using (auth.uid() = user_id);

-- Insert own docs
create policy "insert own documents"
on public.documents for insert
with check (auth.uid() = user_id);

-- Update own docs
create policy "update own documents"
on public.documents for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Delete own docs
create policy "delete own documents"
on public.documents for delete
using (auth.uid() = user_id);

-- 5) Storage RLS for 'docs' bucket
create policy "upload own files"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'docs'
  and (auth.uid()::text) = (storage.foldername(name))[1]  -- path like: <user_id>/filename.ext
);

create policy "read own files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'docs'
  and (auth.uid()::text) = (storage.foldername(name))[1]
);

create policy "delete own files"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'docs'
  and (auth.uid()::text) = (storage.foldername(name))[1]
);