import { redirect } from "next/navigation"
import { checkAndJoinEmailInvitationAction } from "@/lib/actions/family"
import { OnboardingClient } from "./onboarding-client"

export default async function OnboardingPage() {
  // Check if the user has a pending email invitation and auto-join
  const { familyId } = await checkAndJoinEmailInvitationAction()

  if (familyId) {
    redirect("/dashboard")
  }

  return <OnboardingClient />
}
