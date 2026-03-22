import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { checkAndJoinEmailInvitationAction } from "@/lib/actions/family"
import { OnboardingClient } from "./onboarding-client"

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ set_password?: string }>
}) {
  const params = await searchParams

  // Fallback: User already has a family (e.g. middleware profile query failed)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("family_id")
      .eq("id", user.id)
      .single()
    if (profile?.family_id) {
      redirect("/dashboard")
    }
  }

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
