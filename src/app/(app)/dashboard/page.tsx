import { redirect } from "next/navigation"
import { getDashboardDataAction } from "@/lib/actions/dashboard"
import { DashboardContent } from "@/components/dashboard/dashboard-content"

export default async function DashboardPage() {
  const result = await getDashboardDataAction()

  if ("error" in result) {
    if (
      result.error === "Nicht angemeldet." ||
      result.error === "Not logged in."
    ) {
      redirect("/login")
    }
    if (
      result.error === "Du gehoerst keiner Familie an." ||
      result.error === "You do not belong to a family."
    ) {
      redirect("/onboarding")
    }
    return (
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <p className="text-sm text-muted-foreground">{result.error}</p>
      </main>
    )
  }

  return (
    <DashboardContent
      user={result.user}
      family={result.family}
      role={result.role}
      memberCount={result.memberCount}
    />
  )
}
