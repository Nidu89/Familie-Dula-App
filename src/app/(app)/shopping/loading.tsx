import { Skeleton } from "@/components/ui/skeleton"

export default function ShoppingLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 pt-6 pb-48 sm:px-6 sm:pt-8 md:pb-40">
      {/* Page header */}
      <div className="mb-8 md:mb-12">
        <Skeleton className="h-3 w-28 mb-2" />
        <Skeleton className="h-10 w-48 mb-1" />
        <Skeleton className="h-5 w-40" />
      </div>

      {/* New list button */}
      <div className="mb-8">
        <Skeleton className="h-14 w-40 rounded-full" />
      </div>

      {/* Lists grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-[2rem] bg-card p-7 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    </main>
  )
}
