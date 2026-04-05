import { Skeleton } from "@/components/ui/skeleton"

export default function RitualsLoading() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Page header */}
      <div className="mb-8">
        <Skeleton className="h-8 w-40 mb-1" />
        <Skeleton className="h-5 w-72" />
      </div>

      {/* Ritual Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-[2rem] bg-card p-8">
            <Skeleton className="h-6 w-3/4 mb-4" />
            <Skeleton className="h-4 w-1/2 mb-6" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
            <Skeleton className="mt-6 h-10 w-full rounded-full" />
          </div>
        ))}
      </div>
    </main>
  )
}
