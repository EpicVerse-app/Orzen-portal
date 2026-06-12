import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Package, BarChart2, ChevronRight, Store, Users } from 'lucide-react'
import AdminDashboardStats from '@/components/admin/AdminDashboardStats'
import OrderStatusBadge from '@/components/ui/OrderStatusBadge'

function shortId(id: string) { return 'ORD-' + id.replace(/-/g, '').slice(0, 6).toUpperCase() }
function fmtDate(d: string)   { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('id,role,company_id,full_name').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const cid = profile.company_id

  const [
    { count: branchCount   },
    { count: userCount     },
    { count: orderTotal    },
    { count: orderPending  },
    { count: orderShipped  },
    { count: orderDelivered},
    { data: recentOrders   },
    { data: users          },
  ] = await Promise.all([
    supabase.from('branches').select('*', { count: 'exact', head: true }).eq('company_id', cid),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('company_id', cid),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'shipped'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'delivered'),
    supabase.from('orders').select('id,status,created_at,branch:branches(name,city)').order('created_at', { ascending: false }).limit(8),
    supabase.from('users').select('id,full_name,role,email').eq('company_id', cid).order('created_at', { ascending: false }).limit(5),
  ])


  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const ROLE_COLOR: Record<string, string> = {
    admin: 'bg-red-100 text-red-700',
    super_manager: 'bg-blue-100 text-blue-700',
    store_head: 'bg-violet-100 text-violet-700',
    store_manager: 'bg-green-100 text-green-700',
    vendor: 'bg-orange-100 text-orange-700',
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="animate-fade-in-up stagger-1" style={{ opacity: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">{profile.full_name}</h1>
        <p className="text-sm text-gray-400 mt-0.5">Administrator · {today}</p>
      </div>

      {/* Animated Stats grid */}
      <AdminDashboardStats
        branchCount={branchCount || 0}
        userCount={userCount || 0}
        orderTotal={orderTotal || 0}
        orderPending={orderPending || 0}
        orderShipped={orderShipped || 0}
        orderDelivered={orderDelivered || 0}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in-up stagger-4" style={{ opacity: 0 }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-bold text-gray-800">Recent Orders</h2>
            </div>
            <Link href="/dashboard/admin/orders" className="text-xs font-semibold flex items-center gap-0.5 hover:underline" style={{ color: '#570439' }}>
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {(recentOrders || []).map((o: any, i: number) => (
              <div key={o.id}
                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors animate-fade-in-up"
                style={{ opacity: 0, animationDelay: `${(i + 5) * 40}ms` }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800">{shortId(o.id)}</p>
                  <p className="text-[11px] text-gray-400">{(o.branch as any)?.name} · {fmtDate(o.created_at)}</p>
                </div>
                <OrderStatusBadge status={o.status as any} />
              </div>
            ))}
            {!recentOrders?.length && (
              <p className="text-sm text-gray-400 text-center py-10">No orders yet</p>
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in-up stagger-5" style={{ opacity: 0 }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-bold text-gray-800">Recent Users</h2>
            </div>
            <Link href="/dashboard/admin/users" className="text-xs font-semibold flex items-center gap-0.5 hover:underline" style={{ color: '#570439' }}>
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {(users || []).map((u: any) => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ backgroundColor: '#570439' }}>
                  {u.full_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{u.full_name}</p>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${ROLE_COLOR[u.role] || 'bg-gray-100 text-gray-500'}`}>
                    {u.role?.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Manage Products', href: '/dashboard/admin/products', icon: Package,   color: 'bg-orange-50 text-orange-600' },
          { label: 'Manage Branches', href: '/dashboard/admin/branches', icon: Store,     color: 'bg-blue-50 text-blue-600'    },
          { label: 'Manage Users',    href: '/dashboard/admin/users',    icon: Users,     color: 'bg-violet-50 text-violet-600'},
          { label: 'View Reports',    href: '/dashboard/admin/reports',  icon: BarChart2, color: 'bg-green-50 text-green-600'  },
        ].map(({ label, href, icon: Icon, color }, i) => (
          <Link key={href} href={href}
            className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 card-hover animate-fade-in-up stagger-${i + 5}`}
            style={{ opacity: 0 }}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color.split(' ')[0]}`}>
              <Icon className={`w-4 h-4 ${color.split(' ')[1]}`} />
            </div>
            <p className="text-sm font-semibold text-gray-700">{label}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
