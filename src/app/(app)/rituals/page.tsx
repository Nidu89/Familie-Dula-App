import { redirect } from "next/navigation"

import { getDashboardDataAction } from "@/lib/actions/dashboard"
import { RitualsPageClient } from "@/components/rituals/rituals-page-client"
import { RitualsPageHeader } from "@/components/rituals/rituals-page-header"

export default async function RitualsPage() {
  const result = await getDashboardDataAction()

  if ("error" in result) {
    if (result.error === "Nicht angemeldet.") redirect("/login")
    if (result.error === "Du gehoerst keiner Familie an.") redirect("/onboarding")
    return (
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <RitualsPageHeader showError />
      </main>
    )
  }

  const { user, role } = result
  const isAdult = role === "admin" || role === "adult"

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <RitualsPageClient isAdult={isAdult} userId={user.id} />
    </main>
  )
}
