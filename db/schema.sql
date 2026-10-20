-- Nudge — schema. Idempotent (safe to run repeatedly).
-- Money = integer cents. Quantity = integer thousandths. Tax = basis points.
-- Apply with: node scripts/apply-schema.mjs   (uses DATABASE_URL_UNPOOLED)

create table if not exists users (
  id             text primary key,
  email          text not null unique,
  password_hash  text not null,
  role           text not null check (role in ('freelancer', 'client')),
  name           text not null,
  business_name  text not null default '',
  -- for clients: the freelancer who owns them. null for freelancers.
  freelancer_id  text references users(id),
  created_at     timestamptz not null default now(),
  constraint client_must_have_freelancer
    check ((role = 'client' and freelancer_id is not null)
        or (role = 'freelancer' and freelancer_id is null))
);

create table if not exists invoices (
  id             text primary key,           -- INV-1001: human-readable, sequential on purpose
  freelancer_id  text not null references users(id),
  client_id      text not null references users(id),
  status         text not null check (status in ('draft', 'sent', 'viewed', 'paid', 'void')),
  currency       text not null default 'USD',
  tax_rate_bp    integer not null default 0 check (tax_rate_bp >= 0),
  issued_on      date not null,
  due_on         date not null,
  viewed_at      timestamptz,
  paid_at        timestamptz,
  -- nullable from day one so the share-link feature needs no migration mid-hackathon
  share_token    text unique,
  notes          text not null default '',
  created_at     timestamptz not null default now(),
  constraint invoice_tax_sane check (tax_rate_bp <= 10000)
);

create table if not exists invoice_items (
  id           text primary key,
  invoice_id   text not null references invoices(id) on delete cascade,
  description  text not null,
  qty_milli    integer not null check (qty_milli > 0),
  unit_cents   integer not null check (unit_cents >= 0),
  position     integer not null
);

create index if not exists invoices_freelancer_idx on invoices (freelancer_id, due_on);
create index if not exists invoices_client_idx     on invoices (client_id, status);
create index if not exists items_invoice_idx       on invoice_items (invoice_id, position);

-- Belt and braces on the rule that matters most: a client row's freelancer must
-- itself be a freelancer. Prevents a corrupted seed from silently breaking the
-- isolation tests (they'd pass by denying everything).
create or replace function check_client_owner() returns trigger as $$
begin
  if new.role = 'client' then
    if not exists (select 1 from users where id = new.freelancer_id and role = 'freelancer') then
      raise exception 'client % must reference a freelancer', new.id;
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists users_client_owner_check on users;
create trigger users_client_owner_check
  before insert or update on users
  for each row execute function check_client_owner();
