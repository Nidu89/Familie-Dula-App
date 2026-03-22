import { redirect } from "next/navigation"
import { checkAndJoinEmailInvitationAction } from "@/lib/actions/family"
import { OnboardingClient } from "./onboarding-client"

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ set_password?: string }>
}) {
  const params = await searchParams
  // Check if the user has a pending email invitation and auto-join
  const { familyId } = await checkAndJoinEmailInvitationAction()

  if (familyId) {
    // Email-invited users need to set a password before going to dashboard
    if (params.set_password === "true") {
      redirect("/auth/reset-password?invited=true")
    }
    redirect("/dashboard")
  }

  return <OnboardingClient />
}
