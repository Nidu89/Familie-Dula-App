import { redirect } from "next/navigation"
import { Settings } from "lucide-react"

import { FamilyNameSection } from "@/components/family/family-name-section"
import { MemberListSection } from "@/components/family/member-list-section"
import { InviteSection } from "@/components/family/invite-section"
import { LeaveFamilySection } from "@/components/family/leave-family-section"
import { getFamilyDataAction } from "@/lib/actions/family"

export default async function FamilySettingsPage() {
  const result = await getFamilyDataAction()

  if ("error" in result) {
    redirect("/onboarding")
  }

  const { family, members, currentUserId, isAdmin, activeInviteCode } = result

  const currentUserMember = members.find((m) => m.id === currentUserId)
  const adminCount = members.filter((m) => m.role === "admin").length
  const isLastAdmin = isAdmin && adminCount <= 1

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Familieneinstellungen
            </h1>
            <p className="text-sm text-muted-foreground">
              Verwalte deine Familie, Mitglieder und Einladungen.
            </p>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        <FamilyNameSection
          familyName={family.name}
          isAdmin={isAdmin}
        />

        <MemberListSection
          members={members}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
        />

        {isAdmin && (
          <InviteSection
            existingCode={activeInviteCode?.code ?? null}
            existingCodeExpiresAt={activeInviteCode?.expiresAt ?? null}
          />
        )}

        <LeaveFamilySection isLastAdmin={isLastAdmin} />
      </div>
    </div>
  )
}
