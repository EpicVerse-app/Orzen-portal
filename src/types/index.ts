export type UserRole = 'store_manager' | 'store_head' | 'super_manager' | 'mvm' | 'hvm' | 'vendor' | 'admin'

export interface Company {
  id: string
  name: string
  logo_url: string | null
  slug: string
  primary_color: string | null
  sidebar_color: string | null
}

export interface CategoryWithCount {
  id: string
  name: string
  description: string | null
  product_count: number
}

export interface Branch {
  id: string
  company_id: string
  name: string
  address: string
  city: string
  state: string
  region: string
}

export interface AppUser {
  id: string
  email: string
  full_name: string
  role: UserRole
  company_id: string
  branch_id: string | null
  scope_region: string | null
  scope_state: string | null
  company: Company
  branch: Branch | null
}

export interface Category {
  id: string
  company_id: string
  name: string
}

export interface Product {
  id: string
  company_id: string
  category_id: string
  name: string
  unit: string
  image_url: string | null
  category: Category
}

export type OrderStatus =
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'packing'
  | 'loaded'
  | 'shipped'
  | 'delivered'
  | 'closed'

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  product: Product
}

export interface Order {
  id: string
  company_id: string
  branch_id: string
  created_by: string
  approved_by: string | null
  status: OrderStatus
  escalation_deadline: string
  created_at: string
  branch: Branch
  items: OrderItem[]
  approved_by_role: UserRole | null
}

export interface DamageReport {
  id: string
  order_id: string
  branch_id: string
  reported_by: string
  damaged_qty: number
  reason: string
  photo_url: string
  status: 'pending' | 'pickup_scheduled' | 'replaced' | 'closed'
  created_at: string
}

export interface CartItem {
  product: Product
  quantity: number
}
