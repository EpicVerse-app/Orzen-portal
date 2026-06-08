import { CardSkeleton } from '@/components/ui/PageSkeleton'
export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-7 w-40 bg-gray-200 rounded-xl animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gray-100 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-3 w-full bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-3 w-1/3 bg-gray-100 rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
