-- Companies
create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  slug text unique not null,
  created_at timestamptz default now()
);

-- Branches
create table branches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text not null,
  address text,
  city text,
  state text,
  region text, -- north | south | east | west
  created_at timestamptz default now()
);

-- Users
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references companies(id) on delete cascade,
  branch_id uuid references branches(id) on delete set null,
  full_name text not null,
  role text not null check (role in ('store_manager','super_manager','mvm','hvm','vendor')),
  scope_region text,  -- for mvm/hvm: north | south | east | west
  scope_state text,   -- for super_manager: Tamil Nadu etc.
  created_at timestamptz default now()
);

-- Categories
create table categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

-- Products
create table products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  name text not null,
  unit text not null default 'pcs',
  image_url text,
  created_at timestamptz default now()
);

-- Orders
create table orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  branch_id uuid references branches(id) on delete cascade,
  created_by uuid references users(id),
  approved_by uuid references users(id),
  approved_by_role text,
  status text not null default 'submitted'
    check (status in ('submitted','approved','rejected','packing','loaded','shipped','delivered','closed')),
  escalation_deadline timestamptz,
  delivery_photo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Order Items
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  quantity int not null check (quantity > 0)
);

-- Order Status Logs
create table order_status_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  status text not null,
  changed_by uuid references users(id),
  note text,
  photo_url text,
  created_at timestamptz default now()
);

-- Damage Reports
create table damage_reports (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  branch_id uuid references branches(id),
  reported_by uuid references users(id),
  damaged_qty int not null,
  reason text not null,
  photo_url text not null,
  status text not null default 'pending'
    check (status in ('pending','pickup_scheduled','replaced','closed')),
  created_at timestamptz default now()
);

-- RLS: enable on all tables
alter table companies enable row level security;
alter table branches enable row level security;
alter table users enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_status_logs enable row level security;
alter table damage_reports enable row level security;

-- Users can only see data from their own company
create policy "company_isolation" on users
  for all using (company_id = (select company_id from users where id = auth.uid()));

create policy "company_isolation" on branches
  for all using (company_id = (select company_id from users where id = auth.uid()));

create policy "company_isolation" on categories
  for all using (company_id = (select company_id from users where id = auth.uid()));

create policy "company_isolation" on products
  for all using (company_id = (select company_id from users where id = auth.uid()));

create policy "company_isolation" on orders
  for all using (company_id = (select company_id from users where id = auth.uid()));

create policy "company_isolation" on order_items
  for all using (
    order_id in (
      select id from orders
      where company_id = (select company_id from users where id = auth.uid())
    )
  );

create policy "company_isolation" on damage_reports
  for all using (
    branch_id in (
      select id from branches
      where company_id = (select company_id from users where id = auth.uid())
    )
  );
