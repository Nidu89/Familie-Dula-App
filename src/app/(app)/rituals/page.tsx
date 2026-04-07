import { redirect } from "next/navigation"

import { getAppSession } from "@/lib/session"
import { RitualsPageClient } from "@/components/rituals/rituals-page-client"

export default async function RitualsPage() {
  const session = await getAppSession()
  if (!session) redirect("/login")

  const isAdult = session.role === "admin" || session.role === "adult"

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <RitualsPageClient isAdult={isAdult} userId={session.userId} />
    </main>
  )
}
