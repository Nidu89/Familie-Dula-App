"use client"

interface DashboardHeaderProps {
  displayName: string
  familyName: string
  memberCount: number
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 6) return "Gute Nacht"
  if (hour < 12) return "Guten Morgen"
  if (hour < 18) return "Guten Tag"
  return "Guten Abend"
}

export function DashboardHeader({
  displayName,
  familyName,
  memberCount,
}: DashboardHeaderProps) {
  const greeting = getGreeting()

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <span className="font-display text-xs font-bold uppercase tracking-widest text-primary-foreground">
          {greeting} &middot; Familie {familyName}
        </span>
        <h1 className="mt-2 font-display text-4xl font-black text-foreground md:text-5xl">
          Hallo, {displayName}!
        </h1>
      </div>

      <div className="hidden items-center gap-3 md:flex">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <span className="text-sm font-bold text-muted-foreground">
            +{memberCount}
          </span>
        </div>
      </div>
    </div>
  )
}
