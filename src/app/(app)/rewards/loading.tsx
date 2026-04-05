import { Skeleton } from "@/components/ui/skeleton"

export default function RewardsLoading() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Page header */}
      <div className="mb-8">
        <Skeleton className="h-9 w-64 mb-1" />
        <Skeleton className="h-5 w-80" />
      </div>

      <div className="space-y-12">
        {/* Leaderboard */}
        <div className="rounded-[2rem] bg-card p-8">
          <Skeleton className="h-7 w-36 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Reward Shop */}
        <div className="rounded-[2rem] bg-card p-8">
          <Skeleton className="h-7 w-28 mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl bg-muted/30 p-6">
                <Skeleton className="h-12 w-12 rounded-lg mb-4" />
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-10 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="rounded-[2rem] bg-card p-8">
          <Skeleton className="h-7 w-32 mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2 p-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>

        {/* Community Goal */}
        <div className="rounded-[2rem] bg-card p-8">
          <Skeleton className="h-7 w-36 mb-4" />
          <Skeleton className="h-4 w-full mb-6" />
          <Skeleton className="h-6 w-full rounded-full" />
        </div>
      </div>
    </main>
  )
}
