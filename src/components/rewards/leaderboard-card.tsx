"use client"

import { useTranslations } from "next-intl"
import { Trophy, Medal, User, History, PlusCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import type { LeaderboardMember } from "@/lib/actions/rewards"

interface LeaderboardCardProps {
  member: LeaderboardMember
  rank: number
  isAdultOrAdmin: boolean
  onShowHistory: (memberId: string) => void
  onManualPoints?: (memberId: string) => void
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function LeaderboardCard({ member, rank, isAdultOrAdmin, onShowHistory, onManualPoints }: LeaderboardCardProps) {
  const t = useTranslations("rewards.leaderboard")
  const tc = useTranslations("common")
  const isFirst = rank === 1
  const isSecond = rank === 2

  return (
    <div
      className={`relative flex flex-col items-center gap-3 rounded-[2rem] p-6 transition-transform hover:-translate-y-1 ${
        isFirst
          ? "bg-card shadow-[0_0_3rem_rgba(42,47,50,0.06)]"
          : isSecond
            ? "bg-card shadow-[0_0_3rem_rgba(42,47,50,0.04)]"
            : "bg-muted opacity-80"
      }`}
    >
      {/* Activity Bubble decoration for rank 1 */}
      {isFirst && (
        <div
          className="pointer-events-none absolute -right-2 -top-2 h-20 w-20 bg-tertiary-container/30"
          style={{
            borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
          }}
          aria-hidden="true"
        />
      )}

      {/* Avatar */}
      <div className="relative">
        <Avatar
          className={`h-16 w-16 ${
            isFirst
              ? "ring-4 ring-primary/40"
              : isSecond
                ? "ring-4 ring-surface-high/60"
                : ""
          }`}
        >
          {member.avatarUrl && (
            <AvatarImage src={member.avatarUrl} alt={member.displayName} />
          )}
          <AvatarFallback
            className={`text-lg font-bold ${
              isFirst
                ? "bg-primary text-primary-foreground"
                : isSecond
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {member.avatarUrl ? (
              <User className="h-6 w-6" />
            ) : (
              getInitials(member.displayName)
            )}
          </AvatarFallback>
        </Avatar>

        {/* Rank badge */}
        {isFirst && (
          <div
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full"
            style={{
              background: "linear-gradient(135deg, #6c5a00, #ffd709)",
            }}
            aria-label={t("rank1")}
          >
            <Trophy className="h-3.5 w-3.5 text-white" />
          </div>
        )}
        {isSecond && (
          <div
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-surface-high"
            aria-label={t("rank2")}
          >
            <Medal className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Name + Points */}
      <div className="text-center">
        <p className="font-display text-sm font-bold">{member.displayName}</p>
        <p className="text-xs text-muted-foreground capitalize">
          {member.role === "child"
            ? t("roleChild")
            : member.role === "admin"
              ? t("roleAdmin")
              : t("roleAdult")}
        </p>
      </div>

      <div className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5">
        <span className="font-display text-lg font-black text-accent-foreground">
          {member.pointsBalance}
        </span>
        <span className="text-xs font-medium text-accent-foreground/70">
          {tc("pts")}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 gap-1 rounded-full px-2.5 text-xs text-muted-foreground"
          onClick={() => onShowHistory(member.id)}
        >
          <History className="h-3 w-3" />
          Verlauf
        </Button>
        {isAdultOrAdmin && onManualPoints && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 rounded-full px-2.5 text-xs text-muted-foreground"
            onClick={() => onManualPoints(member.id)}
          >
            <PlusCircle className="h-3 w-3" />
            Punkte
          </Button>
        )}
      </div>
    </div>
  )
}
