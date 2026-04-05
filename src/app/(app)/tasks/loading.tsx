import { Skeleton } from "@/components/ui/skeleton"

export default function TasksLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 pt-6 pb-48 sm:px-6 sm:pt-8 md:pb-40">
      {/* Page header */}
      <div className="mb-8 md:mb-12">
        <Skeleton className="h-3 w-28 mb-2" />
        <Skeleton className="h-10 w-56 mb-1" />
        <Skeleton className="h-5 w-48" />
      </div>

      {/* New task button */}
      <div className="mb-8">
        <Skeleton className="h-14 w-44 rounded-full" />
      </div>

      {/* Bento Grid — 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Haushalt Column */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="flex items-center justify-between px-2">
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          {[1, 2].map((i) => (
            <div key={i} className="rounded-[2rem] bg-card p-8">
              <Skeleton className="h-5 w-3/4 mb-3" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <Skeleton className="h-10 w-full rounded-full" />
            </div>
          ))}
        </div>

        {/* Eigene To-dos Column */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="px-2">
            <Skeleton className="h-7 w-32" />
          </div>
          {[1, 2].map((i) => (
            <div key={i} className="rounded-[2rem] bg-card p-8">
              <Skeleton className="h-5 w-3/4 mb-3" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <Skeleton className="h-10 w-full rounded-full" />
            </div>
          ))}
        </div>

        {/* Wochen-Challenge Column */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="px-2">
            <Skeleton className="h-7 w-44" />
          </div>
          <div className="rounded-[2rem] bg-secondary/10 p-8 min-h-[400px]">
            <Skeleton className="h-5 w-32 rounded-full mb-6" />
            <Skeleton className="h-10 w-3/4 mb-4" />
            <Skeleton className="h-4 w-full mb-8" />
            <div className="space-y-4 mb-8">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <Skeleton className="h-3 flex-1 rounded-full" />
                </div>
              ))}
            </div>
            <Skeleton className="h-20 w-full rounded-md" />
          </div>
        </div>
      </div>
    </main>
  )
}
