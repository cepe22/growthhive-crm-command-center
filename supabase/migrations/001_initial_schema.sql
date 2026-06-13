create type public.user_role as enum ('admin', 'sales', 'accounting');
create type public.invoice_status as enum ('draft', 'sent', 'paid', 'overdue');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.user_role not null default 'sales',
  created_at timestamptz not null default now()
);
create table public.pipeline_stages (id smallserial primary key, name text unique not null, position smallint not null);
insert into public.pipeline_stages(name, position) values ('Leads',1),('Discovery Call',2),('Pitching & Propose',3),('Negotiating & Dealing',4),('Agreement Signed',5),('Client (Active)',6),('Post-Client',7);
create table public.clients (
  id uuid primary key default gen_random_uuid(), brand_name text not null, pic_name text, pic_phone text, pic_email text,
  gh_pic uuid references public.users(id), industry text, active_services text[] default '{}', contract_status text,
  contract_start date, contract_end date, monthly_retainer numeric(14,2) default 0, notes text,
  pipeline_stage smallint references public.pipeline_stages(id), archived_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.communication_logs (id uuid primary key default gen_random_uuid(), client_id uuid references public.clients(id) on delete cascade, log_date date not null, channel text, summary text not null, created_by uuid references public.users(id), created_at timestamptz default now());
create table public.invoices (
  id uuid primary key default gen_random_uuid(), invoice_number text unique not null, client_id uuid references public.clients(id),
  bill_to text not null, client_address text, client_phone text, client_email text, invoice_date date not null, due_date date not null,
  subtotal numeric(14,2) not null default 0, discount_type text, discount_value numeric(14,2) default 0, tax_rate numeric(5,2) default 0,
  balance_due numeric(14,2) not null default 0, status public.invoice_status not null default 'draft', payment_date date,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table public.invoice_items (id uuid primary key default gen_random_uuid(), invoice_id uuid references public.invoices(id) on delete cascade, description text not null, amount numeric(14,2) not null);
create table public.income_entries (id uuid primary key default gen_random_uuid(), entry_date date not null, client_id uuid references public.clients(id), invoice_id uuid references public.invoices(id), description text not null, amount numeric(14,2) not null, category text, created_at timestamptz default now());
create table public.expense_entries (id uuid primary key default gen_random_uuid(), entry_date date not null, description text not null, amount numeric(14,2) not null, category text, paid_by text, created_at timestamptz default now());
create table public.bank_statement_uploads (id uuid primary key default gen_random_uuid(), file_path text not null, period_month date, analysis_result jsonb, status text default 'uploaded', uploaded_by uuid references public.users(id), created_at timestamptz default now());
create table public.notification_logs (id uuid primary key default gen_random_uuid(), notification_type text not null, recipient text not null, entity_id uuid, sent_at timestamptz default now(), status text);

create or replace function public.current_role() returns public.user_role language sql stable security definer set search_path = public as $$ select role from public.users where id = auth.uid() $$;
alter table public.users enable row level security; alter table public.clients enable row level security; alter table public.communication_logs enable row level security;
alter table public.invoices enable row level security; alter table public.invoice_items enable row level security; alter table public.income_entries enable row level security;
alter table public.expense_entries enable row level security; alter table public.bank_statement_uploads enable row level security; alter table public.notification_logs enable row level security;
create policy "users read authenticated" on public.users for select to authenticated using (true);
create policy "crm read" on public.clients for select to authenticated using (public.current_role() in ('admin','sales'));
create policy "crm write" on public.clients for all to authenticated using (public.current_role() in ('admin','sales')) with check (public.current_role() in ('admin','sales'));
create policy "communications crm" on public.communication_logs for all to authenticated using (public.current_role() in ('admin','sales')) with check (public.current_role() in ('admin','sales'));
create policy "invoice access" on public.invoices for all to authenticated using (public.current_role() in ('admin','accounting')) with check (public.current_role() in ('admin','accounting'));
create policy "invoice items access" on public.invoice_items for all to authenticated using (public.current_role() in ('admin','accounting')) with check (public.current_role() in ('admin','accounting'));
create policy "income access" on public.income_entries for all to authenticated using (public.current_role() in ('admin','accounting')) with check (public.current_role() in ('admin','accounting'));
create policy "expense access" on public.expense_entries for all to authenticated using (public.current_role() in ('admin','accounting')) with check (public.current_role() in ('admin','accounting'));
create policy "statement access" on public.bank_statement_uploads for all to authenticated using (public.current_role() in ('admin','accounting')) with check (public.current_role() in ('admin','accounting'));
create policy "notification admin" on public.notification_logs for all to authenticated using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
