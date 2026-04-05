"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Loader2,
  Trash2,
  Shield,
  UserRound,
  Baby,
  ChevronRight,
  UserPlus,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { updateMemberRoleAction, removeMemberAction } from "@/lib/actions/family"
import { InviteSection } from "./invite-section"

/* ── types ─────────────────────────────────────────────── */

export type FamilyRole = "admin" | "adult" | "child"

export interface FamilyMember {
  id: string
  displayName: string
  email: string
  role: FamilyRole
}

interface MemberListSectionProps {
  members: FamilyMember[]
  currentUserId: string
  isAdmin: boolean
  existingCode?: string | null
  existingCodeExpiresAt?: string | null
}

/* ── role config ───────────────────────────────────────── */

const roleLabels: Record<FamilyRole, string> = {
  admin: "Admin",
  adult: "Erwachsener",
  child: "Kind",
}

const roleIcons: Record<FamilyRole, React.ReactNode> = {
  admin: <Shield className="h-4 w-4" />,
  adult: <UserRound className="h-4 w-4" />,
  child: <Baby className="h-4 w-4" />,
}

const ROLE_STYLES: Record<
  FamilyRole,
  { border: string; badgeBg: string; avatarBg: string; corner: string }
> = {
  admin: {
    border: "border-secondary",
    badgeBg: "bg-secondary",
    avatarBg: "bg-secondary/15 text-secondary",
    corner: "bg-secondary/10",
  },
  adult: {
    border: "border-primary-foreground",
    badgeBg: "bg-primary-foreground",
    avatarBg: "bg-primary/20 text-primary-foreground",
    corner: "bg-primary/15",
  },
  child: {
    border: "border-chart-3",
    badgeBg: "bg-chart-3",
    avatarBg: "bg-chart-3/15 text-chart-3",
    corner: "bg-chart-3/15",
  },
}

/* ── helpers ───────────────────────────────────────────── */

function getInitials(name: string): string {
  const parts = name.trim().split(" ")
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return parts[0].slice(0, 2).toUpperCase()
}

/* ── component ─────────────────────────────────────────── */

export function MemberListSection({
  members,
  currentUserId,
  isAdmin,
  existingCode,
  existingCodeExpiresAt,
}: MemberListSectionProps) {
  const router = useRouter()
  const [loadingMemberId, setLoadingMemberId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [editMember, setEditMember] = useState<FamilyMember | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<FamilyMember | null>(null)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)

  async function handleRoleChange(memberId: string, newRole: string) {
    setLoadingMemberId(memberId)
    setErrorMessage(null)
    try {
      const result = await updateMemberRoleAction(memberId, newRole)
      if (result?.error) {
        setErrorMessage(result.error)
      } else {
        setEditMember(null)
        router.refresh()
      }
    } catch {
      setErrorMessage("Rolle konnte nicht geaendert werden.")
    } finally {
      setLoadingMemberId(null)
    }
  }

  async function handleRemoveMember() {
    if (!confirmRemove) return
    setLoadingMemberId(confirmRemove.id)
    setErrorMessage(null)
    try {
      const result = await removeMemberAction(confirmRemove.id)
      if (result?.error) {
        setErrorMessage(result.error)
      } else {
        router.refresh()
      }
    } catch {
      setErrorMessage("Mitglied konnte nicht entfernt werden.")
    } finally {
      setLoadingMemberId(null)
      setConfirmRemove(null)
      setEditMember(null)
    }
  }

  return (
    <>
      {/* Member Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {members.map((member) => {
          const isSelf = member.id === currentUserId
          const style = ROLE_STYLES[member.role]

          return (
            <div
              key={member.id}
              className="group relative bg-card p-8 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center overflow-hidden"
            >
              {/* Corner decoration */}
              <div
                className={`absolute top-0 right-0 w-24 h-24 ${style.corner} rounded-bl-[4rem]`}
              />

              {/* Avatar */}
              <div className="relative mb-6">
                <div
                  className={`w-28 h-28 rounded-full border-4 ${style.border} p-1 group-hover:scale-105 transition-transform`}
                >
                  <div
                    className={`w-full h-full rounded-full ${style.avatarBg} flex items-center justify-center`}
                  >
                    <span className="text-3xl font-bold">
                      {getInitials(member.displayName)}
                    </span>
                  </div>
                </div>
                {/* Role icon badge */}
                <div
                  className={`absolute -bottom-2 -right-2 w-10 h-10 ${style.badgeBg} text-white rounded-full flex items-center justify-center shadow-lg`}
                >
                  {roleIcons[member.role]}
                </div>
              </div>

              {/* Name */}
              <h3 className="font-display text-2xl font-bold mb-1">
                {member.displayName}
                {isSelf && (
                  <span className="text-xs text-muted-foreground ml-2">
                    (Du)
                  </span>
                )}
              </h3>

              {/* Role chip */}
              <p className="text-secondary font-semibold text-sm mb-6 px-4 py-1 bg-muted rounded-full">
                {roleLabels[member.role]}
              </p>

              {/* Action buttons */}
              <div className="w-full space-y-3 mt-auto">
                <Link
                  href="/calendar"
                  className="block w-full py-3 rounded-full bg-gradient-to-br from-[#6c5a00] to-[#ffd709] text-white font-bold text-center active:scale-[0.98] transition-all shadow-lg"
                >
                  Zeitplan ansehen
                </Link>
                {isAdmin && !isSelf && (
                  <button
                    onClick={() => setEditMember(member)}
                    className="w-full py-3 rounded-full bg-muted text-foreground font-medium hover:bg-surface-high transition-colors active:scale-[0.98]"
                  >
                    Profil bearbeiten
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {/* Add Member Card (admin only) */}
        {isAdmin && (
          <button
            onClick={() => setInviteDialogOpen(true)}
            className="group relative h-full min-h-[320px] bg-surface-container border-2 border-dashed border-muted-foreground/20 rounded-xl p-8 flex flex-col items-center justify-center hover:bg-surface-high transition-all duration-300 active:scale-[0.99]"
          >
            <div className="w-20 h-20 rounded-full bg-card flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
              <UserPlus className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="font-display text-xl font-bold mb-2">
              Neues Mitglied?
            </h3>
            <p className="text-muted-foreground text-sm max-w-[180px]">
              Erweitere die Sandbox und lade jemanden ein
            </p>
            <div className="mt-8 flex items-center gap-2 text-primary-foreground font-bold">
              <span>Mitglied einladen</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </button>
        )}
      </div>

      {/* Edit Member Dialog */}
      <Dialog
        open={!!editMember}
        onOpenChange={() => {
          setEditMember(null)
          setErrorMessage(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Profil bearbeiten</DialogTitle>
            <DialogDescription>
              Rolle von <strong>{editMember?.displayName}</strong> aendern oder
              Mitglied entfernen.
            </DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <div
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              role="alert"
              aria-live="polite"
            >
              {errorMessage}
            </div>
          )}

          {editMember && (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Rolle</label>
                <Select
                  defaultValue={editMember.role}
                  onValueChange={(value) =>
                    handleRoleChange(editMember.id, value)
                  }
                  disabled={loadingMemberId === editMember.id}
                >
                  <SelectTrigger aria-label="Rolle aendern">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="adult">Erwachsener</SelectItem>
                    <SelectItem value="child">Kind</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 border-t">
                <Button
                  variant="destructive"
                  onClick={() => setConfirmRemove(editMember)}
                  disabled={loadingMemberId === editMember.id}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Mitglied entfernen
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Remove Dialog */}
      <Dialog open={!!confirmRemove} onOpenChange={() => setConfirmRemove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mitglied entfernen</DialogTitle>
            <DialogDescription>
              Moechtest du <strong>{confirmRemove?.displayName}</strong> wirklich
              aus der Familie entfernen? Diese Person verliert sofort den Zugriff
              auf alle Familiendaten.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setConfirmRemove(null)}
              disabled={!!loadingMemberId}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveMember}
              disabled={!!loadingMemberId}
            >
              {loadingMemberId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entfernen...
                </>
              ) : (
                "Entfernen"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mitglied einladen</DialogTitle>
            <DialogDescription>
              Lade neue Mitglieder per E-Mail oder Einladungscode ein.
            </DialogDescription>
          </DialogHeader>
          <InviteSection
            existingCode={existingCode}
            existingCodeExpiresAt={existingCodeExpiresAt}
            embedded
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
