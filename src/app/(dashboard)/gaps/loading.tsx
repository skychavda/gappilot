import { Skeleton } from '@/components/ui/skeleton'

function GapCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-5 space-y-4">
        {/* Badges row */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-12 rounded" />
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-4 w-20 ml-auto" />
        </div>
        {/* Question */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
        </div>
        {/* Agent response box */}
        <div className="bg-slate-50 rounded-xl p-3.5 space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        {/* Suggested answer box */}
        <div className="bg-teal-50 border border-teal-100 rounded-xl p-3.5 space-y-2">
          <Skeleton className="h-3 w-32 bg-teal-200" />
          <Skeleton className="h-4 w-full bg-teal-200" />
          <Skeleton className="h-4 w-4/5 bg-teal-200" />
        </div>
      </div>
      {/* Action buttons */}
      <div className="flex border-t border-slate-100">
        <Skeleton className="flex-1 h-12 rounded-none" />
        <div className="w-px bg-slate-100" />
        <Skeleton className="flex-1 h-12 rounded-none" />
      </div>
    </div>
  )
}

export default function GapsLoading() {
  return (
    <div className="flex gap-5 h-full">
      {/* Filter sidebar skeleton */}
      <aside className="hidden lg:block w-52 flex-shrink-0">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <div className="space-y-1">
                {Array.from({ length: i === 2 ? 6 : 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-8 w-full rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main panel */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-36 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        </div>

        {/* Gap cards */}
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <GapCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
