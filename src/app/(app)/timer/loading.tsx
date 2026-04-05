import { Skeleton } from "@/components/ui/skeleton"

export default function TimerLoading() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Page header */}
      <div className="mb-8">
        <Skeleton className="h-8 w-40 mb-1" />
        <Skeleton className="h-5 w-64" />
      </div>

      {/* Timer Display */}
      <div className="rounded-[2rem] bg-card p-8 mb-6">
        <div className="flex flex-col items-center gap-6">
          <Skeleton className="h-40 w-40 rounded-full" />
          <Skeleton className="h-6 w-32" />
          <div className="flex gap-3">
            <Skeleton className="h-12 w-28 rounded-full" />
            <Skeleton className="h-12 w-28 rounded-full" />
          </div>
        </div>
      </div>

      {/* Templates */}
      <div className="rounded-[2rem] bg-card p-8">
        <Skeleton className="h-6 w-24 mb-4" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="min-w-[140px] rounded-xl bg-muted/30 p-4 shrink-0">
              <Skeleton className="h-10 w-10 rounded-full mb-3" />
              <Skeleton className="h-4 w-20 mb-1" />
              <Skeleton className="h-3 w-14" />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
