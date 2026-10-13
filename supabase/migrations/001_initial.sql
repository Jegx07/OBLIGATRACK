-- ObligaTrack — Initial Schema Migration
-- Run this in the Supabase SQL Editor before starting the application.

-- ─────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────
create table if not exists profiles (
  id         uuid primary key default uuid_generate_v4(),
  full_name  text not null,
  email      text not null unique,
  role       text not null default 'member' check (role in ('admin', 'manager', 'member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- CONTRACTS
-- ─────────────────────────────────────────
create table if not exists contracts (
  id                  uuid primary key default uuid_generate_v4(),
  contract_reference  text not null unique,
  title               text not null,
  first_party         text not null,
  second_party        text not null,
  description         text,
  start_date          date not null,
  end_date            date not null,
  renewal_date        date,
  status              text not null default 'draft'
                        check (status in ('draft', 'active', 'expired', 'terminated')),
  notes               text,
  created_by          uuid references profiles(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint contracts_dates_check check (end_date > start_date)
);

create index if not exists idx_contracts_status       on contracts(status);
create index if not exists idx_contracts_end_date     on contracts(end_date);
create index if not exists idx_contracts_renewal_date on contracts(renewal_date);

-- ─────────────────────────────────────────
-- OBLIGATIONS
-- ─────────────────────────────────────────
create table if not exists obligations (
  id                     uuid primary key default uuid_generate_v4(),
  contract_id            uuid not null references contracts(id) on delete restrict,
  title                  text not null,
  original_clause        text,
  structured_description text,
  obligation_type        text not null default 'other'
                           check (obligation_type in ('payment','delivery','reporting','renewal','compliance','service','other')),
  responsible_party      text,
  owner_id               uuid references profiles(id) on delete set null,
  trigger_type           text check (trigger_type in ('fixed_date','relative_to_start','relative_to_event','manual')),
  trigger_date           date,
  duration_days          integer check (duration_days >= 0),
  due_date               date,
  reminder_date          date,
  priority               text not null default 'medium'
                           check (priority in ('low','medium','high','critical')),
  status                 text not null default 'pending'
                           check (status in ('pending','in_progress','completed','cancelled')),
  notes                  text,
  created_by             uuid references profiles(id) on delete set null,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists idx_obligations_contract_id on obligations(contract_id);
create index if not exists idx_obligations_owner_id    on obligations(owner_id);
create index if not exists idx_obligations_due_date    on obligations(due_date);
create index if not exists idx_obligations_status      on obligations(status);
create index if not exists idx_obligations_priority    on obligations(priority);

-- ─────────────────────────────────────────
-- ACTIVITY LOG
-- ─────────────────────────────────────────
create table if not exists activity_log (
  id          uuid primary key default uuid_generate_v4(),
  entity_type text not null,
  entity_id   text not null,
  action      text not null,
  description text not null,
  actor_id    uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_activity_log_entity on activity_log(entity_type, entity_id);
create index if not exists idx_activity_log_created on activity_log(created_at desc);

-- ─────────────────────────────────────────
-- UPDATED_AT TRIGGER
-- ─────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_profiles_updated_at') then
    create trigger trg_profiles_updated_at
      before update on profiles
      for each row execute function set_updated_at();
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_contracts_updated_at') then
    create trigger trg_contracts_updated_at
      before update on contracts
      for each row execute function set_updated_at();
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_obligations_updated_at') then
    create trigger trg_obligations_updated_at
      before update on obligations
      for each row execute function set_updated_at();
  end if;
end $$;

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────
-- Enable RLS on all tables
alter table profiles     enable row level security;
alter table contracts    enable row level security;
alter table obligations  enable row level security;
alter table activity_log enable row level security;

-- For MVP single-organisation deployment:
-- Allow all operations for authenticated users (or anon for local dev).
-- Tighten these policies before production deployment.

create policy "Allow all for authenticated" on profiles
  for all using (true) with check (true);

create policy "Allow all for authenticated" on contracts
  for all using (true) with check (true);

create policy "Allow all for authenticated" on obligations
  for all using (true) with check (true);

create policy "Allow all for authenticated" on activity_log
  for all using (true) with check (true);
