export function StatsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-${count} gap-2 sm:gap-3`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gray-100 animate-pulse shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-8 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-2.5 w-16 bg-gray-100 rounded-lg animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function OrderListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="h-3 w-24 bg-gray-100 rounded-lg animate-pulse" />
      </div>
      <div className="divide-y divide-gray-50">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-5 py-3.5 flex items-center gap-3">
            <div className="h-3.5 w-16 bg-gray-100 rounded-lg animate-pulse shrink-0" />
            <div className="flex-1 h-3 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-6 w-20 bg-gray-100 rounded-full animate-pulse shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-3/4 bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-2.5 w-1/2 bg-gray-100 rounded-lg animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-2.5 w-full bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-2.5 w-4/5 bg-gray-100 rounded-lg animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Full dashboard skeletons per role
export function StoreDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="h-7 w-48 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-4 w-72 bg-gray-100 rounded-lg animate-pulse" />
      </div>
      <StatsSkeleton count={3} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2"><OrderListSkeleton rows={6} /></div>
        <CardSkeleton rows={2} />
      </div>
    </div>
  )
}

export function SuperDashboardSkeleton() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="space-y-1">
        <div className="h-7 w-56 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-4 w-48 bg-gray-100 rounded-lg animate-pulse" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 flex items-center gap-3 ${i === 4 ? 'col-span-2 lg:col-span-1' : ''}`}>
            <div className="w-10 h-10 rounded-xl bg-gray-100 animate-pulse shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-6 w-8 bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-2.5 w-14 bg-gray-100 rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CardSkeleton rows={3} />
        <CardSkeleton rows={4} />
      </div>
    </div>
  )
}

export function VendorDashboardSkeleton() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="space-y-1">
        <div className="h-7 w-48 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-4 w-40 bg-gray-100 rounded-lg animate-pulse" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-100 animate-pulse shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-5 w-8 bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-2.5 w-16 bg-gray-100 rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>
      <CardSkeleton rows={3} />
    </div>
  )
}

export function OrderPageSkeleton() {
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="h-7 w-32 bg-gray-200 rounded-xl animate-pulse" />
      <OrderListSkeleton rows={8} />
    </div>
  )
}
