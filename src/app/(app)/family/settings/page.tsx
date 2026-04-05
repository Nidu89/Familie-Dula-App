import { redirect } from "next/navigation"

import { MemberListSection } from "@/components/family/member-list-section"
import { FamilyNameSection } from "@/components/family/family-name-section"
import { LeaveFamilySection } from "@/components/family/leave-family-section"
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
      {/* Hero Header */}
      <section className="mb-16 relative">
        <div
          className="absolute -top-12 -right-8 w-48 h-48 bg-primary/20 -z-10"
          style={{
            borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
          }}
        />
        <div className="max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-wider text-primary-foreground">
            Familien-Sandbox
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold text-secondary mb-4 leading-tight">
            Die Crew
          </h1>
          <p className="text-base md:text-lg text-muted-foreground font-medium max-w-xl">
            Jede Sandbox braucht ihre Macher. Verwalte Rollen und den
            Spassfaktor fuer das ganze Team.
          </p>
        </div>
      </section>

      {/* Member Grid */}
      <MemberListSection
        members={members}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        existingCode={activeInviteCode?.code ?? null}
        existingCodeExpiresAt={activeInviteCode?.expiresAt ?? null}
      />

      {/* Activity Summary */}
      <section className="mt-20">
        <div className="bg-card p-10 rounded-xl flex flex-col lg:flex-row gap-10 items-center">
          <div className="flex-1">
            <h4 className="font-display text-3xl font-extrabold text-secondary mb-3">
              Familien-Aktivitaet
            </h4>
            <p className="text-muted-foreground max-w-md">
              Alles auf einen Blick — eure Familie waechst und gedeiht!
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full lg:w-auto">
            <div className="bg-background p-6 rounded-lg text-center">
              <span className="block text-3xl font-black text-secondary">
                {String(members.length).padStart(2, "0")}
              </span>
              <span className="text-xs font-bold text-muted-foreground uppercase">
                Mitglieder
              </span>
            </div>
            <div className="bg-background p-6 rounded-lg text-center">
              <span className="block text-3xl font-black text-primary-foreground">
                {String(adminCount).padStart(2, "0")}
              </span>
              <span className="text-xs font-bold text-muted-foreground uppercase">
                Admins
              </span>
            </div>
            <div className="bg-tertiary-container p-6 rounded-lg text-center">
              <span className="block text-3xl font-black text-foreground">
                100%
              </span>
              <span className="text-xs font-bold text-foreground/60 uppercase">
                Spassfaktor
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom settings */}
      <div className="mt-16 max-w-2xl space-y-6">
        <FamilyNameSection familyName={family.name} isAdmin={isAdmin} />
        <LeaveFamilySection isLastAdmin={isLastAdmin} />
      </div>
    </main>
  )
}
