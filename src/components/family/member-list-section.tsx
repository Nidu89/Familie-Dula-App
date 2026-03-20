"use client"

import { useState } from "react"
import { Loader2, Trash2, Shield, UserRound, Baby } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { useRouter } from "next/navigation"

import { updateMemberRoleAction, removeMemberAction } from "@/lib/actions/family"

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
}

const roleLabels: Record<FamilyRole, string> = {
  admin: "Admin",
  adult: "Erwachsener",
  child: "Kind",
}

const roleIcons: Record<FamilyRole, React.ReactNode> = {
  admin: <Shield className="h-3.5 w-3.5" />,
  adult: <UserRound className="h-3.5 w-3.5" />,
  child: <Baby className="h-3.5 w-3.5" />,
}

const roleBadgeVariants: Record<FamilyRole, "default" | "secondary" | "outline"> = {
  admin: "default",
  adult: "secondary",
  child: "outline",
}

export function MemberListSection({
  members,
  currentUserId,
  isAdmin,
}: MemberListSectionProps) {
  const router = useRouter()
  const [loadingMemberId, setLoadingMemberId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<FamilyMember | null>(null)

  const adminCount = members.filter((m) => m.role === "admin").length

  async function handleRoleChange(memberId: string, newRole: string) {
    setLoadingMemberId(memberId)
    setErrorMessage(null)

    try {
      const result = await updateMemberRoleAction(memberId, newRole)
      if (result?.error) {
        setErrorMessage(result.error)
      } else {
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
    }
  }

  if (members.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mitglieder</CardTitle>
          <CardDescription>Noch keine Mitglieder vorhanden.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Lade Familienmitglieder ein, um loszulegen.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mitglieder</CardTitle>
          <CardDescription>
            {members.length} {members.length === 1 ? "Mitglied" : "Mitglieder"} in deiner Familie.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <div
              className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              role="alert"
              aria-live="polite"
            >
              {errorMessage}
            </div>
          )}

          {/* Desktop: Tabelle */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Rolle</TableHead>
                  {isAdmin && <TableHead className="w-[80px]">Aktion</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => {
                  const isSelf = member.id === currentUserId
                  const isLastAdmin = member.role === "admin" && adminCount <= 1
                  const isDisabled = loadingMemberId === member.id

                  return (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.displayName}
                        {isSelf && (
                          <span className="ml-2 text-xs text-muted-foreground">(Du)</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.email}
                      </TableCell>
                      <TableCell>
                        {isAdmin && !isSelf ? (
                          <Select
                            defaultValue={member.role}
                            onValueChange={(value) => handleRoleChange(member.id, value)}
                            disabled={isDisabled}
                          >
                            <SelectTrigger className="w-[140px]" aria-label="Rolle aendern">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="adult">Erwachsener</SelectItem>
                              <SelectItem value="child">Kind</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant={roleBadgeVariants[member.role]} className="gap-1">
                            {roleIcons[member.role]}
                            {roleLabels[member.role]}
                          </Badge>
                        )}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          {!isSelf && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => setConfirmRemove(member)}
                              disabled={isDisabled}
                              aria-label={`${member.displayName} entfernen`}
                            >
                              {isDisabled ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          {isSelf && isLastAdmin && (
                            <span className="text-xs text-muted-foreground">
                              Letzter Admin
                            </span>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: Karten */}
          <div className="space-y-3 md:hidden">
            {members.map((member) => {
              const isSelf = member.id === currentUserId
              const isDisabled = loadingMemberId === member.id

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {member.displayName}
                      {isSelf && (
                        <span className="ml-1 text-xs text-muted-foreground">(Du)</span>
                      )}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {member.email}
                    </p>
                    <Badge
                      variant={roleBadgeVariants[member.role]}
                      className="mt-1 gap-1"
                    >
                      {roleIcons[member.role]}
                      {roleLabels[member.role]}
                    </Badge>
                  </div>

                  {isAdmin && !isSelf && (
                    <div className="ml-2 flex flex-col gap-1">
                      <Select
                        defaultValue={member.role}
                        onValueChange={(value) => handleRoleChange(member.id, value)}
                        disabled={isDisabled}
                      >
                        <SelectTrigger className="h-8 w-[120px] text-xs" aria-label="Rolle aendern">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="adult">Erwachsener</SelectItem>
                          <SelectItem value="child">Kind</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setConfirmRemove(member)}
                        disabled={isDisabled}
                      >
                        {isDisabled ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="mr-1 h-3 w-3" />
                        )}
                        Entfernen
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Bestaetigung: Mitglied entfernen */}
      <Dialog open={!!confirmRemove} onOpenChange={() => setConfirmRemove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mitglied entfernen</DialogTitle>
            <DialogDescription>
              Moechtest du <strong>{confirmRemove?.displayName}</strong> wirklich aus
              der Familie entfernen? Diese Person verliert sofort den Zugriff auf alle
              Familiendaten.
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
    </>
  )
}
