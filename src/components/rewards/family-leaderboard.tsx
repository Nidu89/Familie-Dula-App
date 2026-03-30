"use client"

import { useState } from "react"
import { Users } from "lucide-react"
import { LeaderboardCard } from "@/components/rewards/leaderboard-card"
import { PointsHistorySheet } from "@/components/rewards/points-history-sheet"
import { ManualPointsDialog } from "@/components/rewards/manual-points-dialog"
import type { LeaderboardMember } from "@/lib/actions/rewards"

interface FamilyLeaderboardProps {
  members: LeaderboardMember[]
  isAdultOrAdmin: boolean
}

export function FamilyLeaderboard({ members, isAdultOrAdmin }: FamilyLeaderboardProps) {
  // History sheet state
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyMemberId, setHistoryMemberId] = useState<string | null>(null)
  const [historyMemberName, setHistoryMemberName] = useState("")

  // Manual points dialog state
  const [manualOpen, setManualOpen] = useState(false)
  const [manualMemberId, setManualMemberId] = useState<string | null>(null)
  const [manualMemberName, setManualMemberName] = useState("")
  const [manualMemberBalance, setManualMemberBalance] = useState(0)

  function handleShowHistory(memberId: string) {
    const member = members.find((m) => m.id === memberId)
    setHistoryMemberId(memberId)
    setHistoryMemberName(member?.displayName || "Mitglied")
    setHistoryOpen(true)
  }

  function handleManualPoints(memberId: string) {
    const member = members.find((m) => m.id === memberId)
    setManualMemberId(memberId)
    setManualMemberName(member?.displayName || "Mitglied")
    setManualMemberBalance(member?.pointsBalance || 0)
    setManualOpen(true)
  }

  if (members.length === 0) {
    return (
      <section className="rounded-[2rem] bg-card p-8" aria-label="Familien-Leaderboard">
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Users className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Noch keine Familienmitglieder vorhanden.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section aria-label="Familien-Leaderboard">
      <div className="mb-4 flex items-baseline gap-3">
        <h2 className="font-display text-xl font-bold">Wer ist vorn?</h2>
        <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
          Leaderboard
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((member, index) => (
          <LeaderboardCard
            key={member.id}
            member={member}
            rank={index + 1}
            isAdultOrAdmin={isAdultOrAdmin}
            onShowHistory={handleShowHistory}
            onManualPoints={isAdultOrAdmin ? handleManualPoints : undefined}
          />
        ))}
      </div>

      <PointsHistorySheet
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        childId={historyMemberId}
        childName={historyMemberName}
      />

      {isAdultOrAdmin && (
        <ManualPointsDialog
          open={manualOpen}
          onOpenChange={setManualOpen}
          childId={manualMemberId}
          childName={manualMemberName}
          currentBalance={manualMemberBalance}
          onSuccess={() => {
            // Page will refresh on next navigation
          }}
        />
      )}
    </section>
  )
}
