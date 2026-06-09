import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ShoppingBag, Calendar, ChevronRight } from 'lucide-react'
import OrderStatusBadge from '@/components/ui/OrderStatusBadge'

function shortId(id: string) { return 'ORD-' + id.replace(/-/g, '').slice(0, 6).toUpperCase() }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }

const STATUS_TABS = [
  { key: 'all',       label: 'All'       },
  { key: 'submitted', label: 'Pending'   },
  { key: 'approved',  label: 'Approved'  },
  { key: 'shipped',   label: 'In Transit'},
  { key: 'delivered', label: 'Delivered' },
  { key: 'rejected',  label: 'Rejected'  },
]

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('users').select('role,company_id').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  let query = supabase
    .from('orders')
    .select('id,status,created_at,branch:branches(name,city,state),items:order_items(id)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (status && status !== 'all') query = query.eq('status', status)

  const { data: orders } = await query
  const activeTab = status || 'all'

  return (
    <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Orders</h1>
        <p className="text-sm text-gray-400 mt-0.5">{orders?.length || 0} orders {status && status !== 'all' ? `· ${status}` : ''}</p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-5 scrollbar-hide">
        {STATUS_TABS.map(tab => (
          <Link key={tab.key}
            href={tab.key === 'all' ? '/dashboard/admin/orders' : `/dashboard/admin/orders?status=${tab.key}`}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === tab.key ? 'text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
            style={activeTab === tab.key ? { backgroundColor: '#570439' } : {}}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {orders?.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-20 text-center">
          <ShoppingBag className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No orders found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {orders?.map((o: any) => {
              const branch = Array.isArray(o.branch) ? o.branch[0] : o.branch
              return (
                <div key={o.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800">{shortId(o.id)}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3 shrink-0" />
                      {fmtDate(o.created_at)}
                      {branch && <span> · {branch.name}, {branch.city}</span>}
                      <span> · {o.items?.length || 0} products</span>
                    </p>
                  </div>
                  <OrderStatusBadge status={o.status as any} />
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
