import { Skeleton } from '@/components/ui/skeleton'

function KBEntrySkeleton() {
  return (
    <div className="p-5 border-b border-slate-100 last:border-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2.5">
          {/* Question */}
          <div className="flex items-start gap-2">
            <Skeleton className="h-3 w-6 mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </div>
          {/* Answer */}
          <div className="flex items-start gap-2">
            <Skeleton className="h-3 w-6 mt-0.5 flex-shrink-0 bg-teal-100" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-5/6" />
              <Skeleton className="h-3.5 w-3/4" />
            </div>
          </div>
          {/* Meta */}
          <div className="flex items-center gap-3 pl-14">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-3.5 w-24" />
          </div>
        </div>
        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="w-8 h-8 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export default function KBLoading() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>

      {/* Search bar */}
      <Skeleton className="h-10 w-full rounded-xl" />

      {/* Entries */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <KBEntrySkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
