import { Skeleton } from "@/components/ui/skeleton"

export default function CalendarLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Calendar Header */}
      <div className="rounded-[2rem] bg-card p-6 mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-20 rounded-full" />
            <Skeleton className="h-9 w-20 rounded-full" />
            <Skeleton className="h-9 w-20 rounded-full" />
          </div>
        </div>
      </div>

      {/* Month Grid + Day Panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Month Grid */}
        <div className="rounded-[2rem] bg-card p-6 sm:p-8">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
          {/* Day cells */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        </div>

        {/* Day Focus Panel + Weather */}
        <div className="flex flex-col gap-6">
          <div className="rounded-[2rem] bg-card p-8">
            <Skeleton className="h-7 w-40 mb-4" />
            <Skeleton className="h-5 w-32 mb-6" />
            <div className="space-y-3">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          </div>
          <div className="rounded-[2rem] bg-card p-8">
            <Skeleton className="h-7 w-24 mb-4" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </main>
  )
}
