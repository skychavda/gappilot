import { Skeleton } from '@/components/ui/skeleton'

export default function TranscriptsLoading() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-10 w-44 rounded-xl" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="flex items-center gap-4 px-5 py-3 bg-slate-50/50 border-b border-slate-100">
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className="h-3.5 w-16 ml-4" />
          <Skeleton className="h-3.5 w-14 ml-4" />
          <Skeleton className="h-3.5 w-16 ml-4" />
          <Skeleton className="h-3.5 w-10 ml-4" />
          <Skeleton className="h-3.5 w-12 ml-4" />
        </div>

        {/* Table rows */}
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-5 w-20 rounded-full ml-4" />
              <Skeleton className="h-5 w-20 rounded-full ml-4" />
              <Skeleton className="h-4 w-12 ml-4" />
              <Skeleton className="h-4 w-6 ml-4" />
              <Skeleton className="h-4 w-20 ml-4" />
              <Skeleton className="h-4 w-4 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
