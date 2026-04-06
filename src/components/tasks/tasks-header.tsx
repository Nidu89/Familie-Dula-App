"use client"

import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"

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
  const t = useTranslations("tasks")
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div />
        {isAdultOrAdmin && (
          <Button size="sm" className="gap-1.5" onClick={onNewTask}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t("newTask")}</span>
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={selectedMember} onValueChange={onMemberChange}>
          <SelectTrigger className="w-[180px]" aria-label={t("header.filterByPerson")}>
            <SelectValue placeholder={t("header.allPersons")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("header.allPersons")}</SelectItem>
            <SelectItem value="unassigned">{t("header.unassigned")}</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[160px]" aria-label={t("header.filterByStatus")}>
            <SelectValue placeholder={t("header.allStatuses")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("header.allStatuses")}</SelectItem>
            <SelectItem value="open">{t("header.open")}</SelectItem>
            <SelectItem value="in_progress">{t("header.inProgress")}</SelectItem>
            <SelectItem value="done">{t("header.done")}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedDueGroup} onValueChange={onDueGroupChange}>
          <SelectTrigger
            className="w-[180px]"
            aria-label={t("header.filterByDue")}
          >
            <SelectValue placeholder={t("header.allDueDates")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("header.allDueDates")}</SelectItem>
            <SelectItem value="overdue">{t("header.overdue")}</SelectItem>
            <SelectItem value="today">{t("header.today")}</SelectItem>
            <SelectItem value="this_week">{t("header.thisWeek")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
