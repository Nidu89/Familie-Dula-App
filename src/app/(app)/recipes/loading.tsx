import { Skeleton } from "@/components/ui/skeleton"

export default function RecipesLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 pt-6 pb-48 sm:px-6 sm:pt-8 md:pb-40">
      {/* Page header */}
      <div className="mb-8 md:mb-12">
        <Skeleton className="h-3 w-28 mb-2" />
        <Skeleton className="h-10 w-56 mb-1" />
        <Skeleton className="h-5 w-44" />
      </div>

      {/* Tabs */}
      <div className="mb-8 flex gap-3">
        <Skeleton className="h-10 w-28 rounded-full" />
        <Skeleton className="h-10 w-32 rounded-full" />
      </div>

      {/* Filter bar */}
      <div className="mb-8 flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>

      {/* Recipe grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-[2rem] bg-card p-6 space-y-4">
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-6 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
