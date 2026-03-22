"use client"

import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface FamilyMember {
  id: string
  displayName: string
}

interface TasksHeaderProps {
  isAdultOrAdmin: boolean
  onNewTask: () => void
  members: FamilyMember[]
  selectedMember: string
  onMemberChange: (id: string) => void
  selectedStatus: string
  onStatusChange: (status: string) => void
  selectedDueGroup: string
  onDueGroupChange: (group: string) => void
}

export function TasksHeader({
  isAdultOrAdmin,
  onNewTask,
  members,
  selectedMember,
  onMemberChange,
  selectedStatus,
  onStatusChange,
  selectedDueGroup,
  onDueGroupChange,
}: TasksHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div />
        {isAdultOrAdmin && (
          <Button size="sm" className="gap-1.5" onClick={onNewTask}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Neue Aufgabe</span>
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={selectedMember} onValueChange={onMemberChange}>
          <SelectTrigger className="w-[180px]" aria-label="Nach Person filtern">
            <SelectValue placeholder="Alle Personen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Personen</SelectItem>
            <SelectItem value="unassigned">Unzugewiesen</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[160px]" aria-label="Nach Status filtern">
            <SelectValue placeholder="Alle Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            <SelectItem value="open">Offen</SelectItem>
            <SelectItem value="in_progress">In Bearbeitung</SelectItem>
            <SelectItem value="done">Erledigt</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedDueGroup} onValueChange={onDueGroupChange}>
          <SelectTrigger
            className="w-[180px]"
            aria-label="Nach Faelligkeit filtern"
          >
            <SelectValue placeholder="Alle Faelligkeiten" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Faelligkeiten</SelectItem>
            <SelectItem value="overdue">Ueberfaellig</SelectItem>
            <SelectItem value="today">Heute</SelectItem>
            <SelectItem value="this_week">Diese Woche</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
