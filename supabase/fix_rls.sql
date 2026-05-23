-- Drop old recursive policies
drop policy if exists "company_isolation" on users;
drop policy if exists "company_isolation" on branches;
drop policy if exists "company_isolation" on categories;
drop policy if exists "company_isolation" on products;
drop policy if exists "company_isolation" on orders;
drop policy if exists "company_isolation" on order_items;
drop policy if exists "company_isolation" on damage_reports;

-- Users: can read their own row (needed for login/role check)
create policy "users_read_own"
  on users for select
  using (id = auth.uid());

-- Users: can read others in same company
create policy "users_read_same_company"
  on users for select
  using (
    company_id = (
      select company_id from users
      where id = auth.uid()
      limit 1
    )
  );

-- Helper function to get current user's company_id safely
create or replace function get_my_company_id()
returns uuid
language sql
security definer
stable
as $$
  select company_id from users where id = auth.uid() limit 1;
$$;

-- Branches
create policy "branches_company_isolation"
  on branches for all
  using (company_id = get_my_company_id());

-- Categories
create policy "categories_company_isolation"
  on categories for all
  using (company_id = get_my_company_id());

-- Products
create policy "products_company_isolation"
  on products for all
  using (company_id = get_my_company_id());

-- Orders
create policy "orders_company_isolation"
  on orders for all
  using (company_id = get_my_company_id());

-- Order Items
create policy "order_items_company_isolation"
  on order_items for all
  using (
    order_id in (
      select id from orders
      where company_id = get_my_company_id()
    )
  );

-- Damage Reports
create policy "damage_reports_company_isolation"
  on damage_reports for all
  using (
    branch_id in (
      select id from branches
      where company_id = get_my_company_id()
    )
  );
