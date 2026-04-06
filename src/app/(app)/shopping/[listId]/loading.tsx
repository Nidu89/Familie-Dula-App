import { Skeleton } from "@/components/ui/skeleton"

export default function ShoppingDetailLoading() {
  return (
    <main className="mx-auto max-w-3xl px-4 pt-6 pb-48 sm:px-6 sm:pt-8 md:pb-40">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-48" />
        </div>
      </div>

      {/* Quick add input */}
      <div className="mb-6 mt-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-14 flex-1 rounded-xl" />
          <Skeleton className="h-14 w-14 rounded-xl" />
        </div>
      </div>

      {/* Suggestions */}
      <div className="mb-6 flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>

      {/* Items */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-28 mb-3" />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </main>
  )
}
