import { redirect } from "next/navigation"

import { MemberListSection } from "@/components/family/member-list-section"
import { FamilyNameSection } from "@/components/family/family-name-section"
import { LeaveFamilySection } from "@/components/family/leave-family-section"
import { LanguageSwitcher } from "@/components/family/language-switcher"
import {
  FamilySettingsHero,
  FamilyActivitySummary,
} from "@/components/family/family-settings-header"
import { getFamilyDataAction } from "@/lib/actions/family"

export default async function FamilySettingsPage() {
  const result = await getFamilyDataAction()

  if ("error" in result) {
    redirect("/onboarding")
  }

  const { family, members, currentUserId, isAdmin, activeInviteCode } = result
  const adminCount = members.filter((m) => m.role === "admin").length
  const isLastAdmin = isAdmin && adminCount <= 1

  return (
    <main className="mx-auto max-w-7xl px-4 pt-6 pb-20 sm:px-6 sm:pt-8">
      <FamilySettingsHero />

      {/* Member Grid */}
      <MemberListSection
        members={members}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        existingCode={activeInviteCode?.code ?? null}
        existingCodeExpiresAt={activeInviteCode?.expiresAt ?? null}
      />

      {/* Activity Summary */}
      <FamilyActivitySummary
        memberCount={members.length}
        adminCount={adminCount}
      />

      {/* Bottom settings */}
      <div className="mt-16 max-w-2xl space-y-6">
        <LanguageSwitcher />
        <FamilyNameSection familyName={family.name} isAdmin={isAdmin} />
        <LeaveFamilySection isLastAdmin={isLastAdmin} />
      </div>
    </main>
  )
}
