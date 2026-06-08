export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded-xl ${className}`}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-2.5 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-2.5 w-full" />
      <Skeleton className="h-2.5 w-5/6" />
    </div>
  )
}

export function SkeletonStatCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 flex items-center gap-3">
      <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
      <div className="space-y-1.5 flex-1">
        <Skeleton className="h-5 w-8" />
        <Skeleton className="h-2.5 w-16" />
      </div>
    </div>
  )
}

export function SkeletonOrderRow() {
  return (
    <div className="px-4 py-3 flex items-center gap-3">
      <Skeleton className="h-3.5 w-16 shrink-0" />
      <Skeleton className="h-3 flex-1" />
      <Skeleton className="h-6 w-20 rounded-full shrink-0" />
    </div>
  )
}
