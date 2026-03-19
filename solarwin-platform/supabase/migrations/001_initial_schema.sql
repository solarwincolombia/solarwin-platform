-- ============================================================
-- Solarwin Platform — Schema inicial
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- Extensiones
create extension if not exists "uuid-ossp";

-- ─── PERFILES ───────────────────────────────────────────────
create type user_role as enum ('broker', 'installer', 'admin');

create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  role user_role not null default 'broker',
  phone text,
  city text,
  company_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Trigger: auto-crear perfil al registrarse
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'broker')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─── COTIZACIONES ────────────────────────────────────────────
create type quote_status as enum ('draft', 'pending', 'approved', 'rejected', 'closed');
create type roof_type as enum ('plana', 'inclinada', 'carport');

create table quotes (
  id uuid default uuid_generate_v4() primary key,
  broker_id uuid references profiles(id) on delete cascade not null,
  client_name text not null,
  client_email text,
  city text not null,
  monthly_consumption_kwh numeric not null,
  num_panels integer not null,
  kwp numeric generated always as (num_panels * 0.635) stored,
  roof_type roof_type not null default 'plana',
  project_value_cop bigint not null,
  commission_month1 bigint generated always as (round(project_value_cop * 0.50 * 0.25)) stored,
  commission_month2 bigint generated always as (round(project_value_cop * 0.50 * 0.20)) stored,
  commission_month3 bigint generated always as (round(project_value_cop * 0.50 * 0.15)) stored,
  status quote_status not null default 'draft',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── PROYECTOS ───────────────────────────────────────────────
create type project_stage as enum ('design', 'equipment', 'installation', 'delivered');

create table projects (
  id uuid default uuid_generate_v4() primary key,
  quote_id uuid references quotes(id),
  installer_id uuid references profiles(id) not null,
  broker_id uuid references profiles(id),
  client_name text not null,
  city text not null,
  kwp numeric not null,
  stage project_stage not null default 'design',
  start_date date,
  end_date date,
  total_value_cop bigint not null,
  installer_payment_cop bigint not null,
  installer_paid boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── COMISIONES ──────────────────────────────────────────────
create table commissions (
  id uuid default uuid_generate_v4() primary key,
  broker_id uuid references profiles(id) not null,
  project_id uuid references projects(id) not null,
  month_number integer check (month_number between 1 and 3) not null,
  amount_cop bigint not null,
  paid boolean default false,
  paid_at timestamptz,
  created_at timestamptz default now()
);

-- ─── CATÁLOGO DE EQUIPOS ─────────────────────────────────────
create table equipment_catalog (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  spec text not null,
  unit text not null,
  public_price_cop bigint not null,
  partner_price_cop bigint not null,
  stock integer not null default 0,
  active boolean default true
);

-- Datos iniciales del catálogo
insert into equipment_catalog (name, spec, unit, public_price_cop, partner_price_cop, stock) values
  ('Panel Solar Tier 1', '635W Mono PERC', 'Panel', 820000, 656000, 500),
  ('Inversor On-Grid', '30kW', 'Unidad', 4200000, 3360000, 20),
  ('Batería LiFePO4', '50kWh', 'Unidad', 18500000, 14800000, 4),
  ('Estructura Carport', 'Acero galvanizado', 'm²', 320000, 256000, 0),
  ('Inversor On-Grid', '10kW', 'Unidad', 1800000, 1440000, 15),
  ('Cable Solar', '6mm² UV resistente', 'Metro', 4500, 3600, 2000);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────
alter table profiles enable row level security;
alter table quotes enable row level security;
alter table projects enable row level security;
alter table commissions enable row level security;
alter table equipment_catalog enable row level security;

-- Profiles: cada usuario ve solo su perfil (admin ve todos)
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- Quotes: brokers ven solo sus cotizaciones
create policy "Brokers see own quotes" on quotes
  for all using (auth.uid() = broker_id);

-- Projects: instaladores ven sus proyectos, brokers los suyos
create policy "Installers see own projects" on projects
  for select using (auth.uid() = installer_id);
create policy "Brokers see linked projects" on projects
  for select using (auth.uid() = broker_id);

-- Commissions: cada broker ve sus comisiones
create policy "Brokers see own commissions" on commissions
  for select using (auth.uid() = broker_id);

-- Equipment catalog: visible para todos los autenticados
create policy "Authenticated can view catalog" on equipment_catalog
  for select using (auth.role() = 'authenticated');

-- ─── ÍNDICES ─────────────────────────────────────────────────
create index idx_quotes_broker_id on quotes(broker_id);
create index idx_quotes_status on quotes(status);
create index idx_projects_installer_id on projects(installer_id);
create index idx_projects_broker_id on projects(broker_id);
create index idx_commissions_broker_id on commissions(broker_id);
