import { Skeleton } from "@/components/ui/skeleton"

export default function FamilySettingsLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 pt-6 pb-20 sm:px-6 sm:pt-8">
      {/* Hero Header */}
      <section className="mb-16">
        <Skeleton className="h-3 w-28 mb-2" />
        <Skeleton className="h-12 w-48 mb-4" />
        <Skeleton className="h-5 w-72" />
      </section>

      {/* Member Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-[2rem] bg-card p-8">
            <div className="flex items-center gap-4 mb-6">
              <Skeleton className="h-14 w-14 rounded-full shrink-0" />
              <div>
                <Skeleton className="h-5 w-28 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>

      {/* Activity Summary */}
      <div className="rounded-[2rem] bg-card p-10">
        <div className="flex flex-col lg:flex-row gap-10 items-center">
          <div className="flex-1">
            <Skeleton className="h-9 w-52 mb-3" />
            <Skeleton className="h-5 w-72" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full lg:w-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl bg-muted/30 p-6 text-center">
                <Skeleton className="h-10 w-10 rounded-full mx-auto mb-2" />
                <Skeleton className="h-4 w-16 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Settings */}
      <div className="mt-16 max-w-2xl space-y-6">
        <div className="rounded-[2rem] bg-card p-8">
          <Skeleton className="h-6 w-36 mb-4" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        <div className="rounded-[2rem] bg-card p-8">
          <Skeleton className="h-6 w-40 mb-4" />
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>
      </div>
    </main>
  )
}
