import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <main className="px-4 sm:px-6 md:px-10">
      {/* Header */}
      <header className="mb-10 pt-6 md:pt-10">
        <Skeleton className="h-5 w-32 mb-2" />
        <Skeleton className="h-10 w-64 mb-1" />
        <Skeleton className="h-5 w-48" />
      </header>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column */}
        <div className="md:col-span-8 space-y-6">
          {/* Calendar Widget */}
          <div className="rounded-[2rem] bg-card p-8">
            <div className="mb-6 flex items-center justify-between">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <div className="flex gap-4 overflow-hidden">
              <Skeleton className="min-w-[220px] h-36 rounded-[1.5rem] shrink-0" />
              <Skeleton className="min-w-[220px] h-36 rounded-[1.5rem] shrink-0" />
            </div>
          </div>

          {/* Tasks + Rewards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="rounded-[2rem] bg-card p-8">
              <Skeleton className="h-7 w-36 mb-6" />
              <div className="space-y-3">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            </div>
            <div className="rounded-[2rem] bg-card p-8">
              <Skeleton className="h-7 w-32 mb-6" />
              <div className="space-y-3">
                <Skeleton className="h-14 w-full rounded-lg" />
                <Skeleton className="h-14 w-full rounded-lg" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="md:col-span-4 space-y-6">
          <div className="rounded-[2rem] bg-card p-8">
            <Skeleton className="h-7 w-32 mb-4" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
          <div className="rounded-[2rem] bg-card p-8">
            <Skeleton className="h-7 w-28 mb-4" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
          <div className="rounded-[2rem] bg-card p-8">
            <Skeleton className="h-7 w-36 mb-4" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </main>
  )
}
