"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Trash2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import {
  createTaskAction,
  updateTaskAction,
  deleteTaskAction,
  type Task,
} from "@/lib/actions/tasks"

type SeriesMode = "single" | "following" | "all"

const RECURRENCE_OPTIONS = [
  { value: "none", label: "Keine Wiederholung" },
  { value: "FREQ=DAILY", label: "Taeglich" },
  { value: "FREQ=WEEKLY", label: "Woechentlich" },
  { value: "FREQ=MONTHLY", label: "Monatlich" },
]

interface FamilyMember {
  id: string
  displayName: string
}

const taskFormSchema = z.object({
  title: z.string().min(1, "Titel ist erforderlich").max(200),
  description: z.string().max(2000).optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
  status: z.enum(["open", "in_progress", "done"]),
  priority: z.enum(["low", "medium", "high"]),
  assignedTo: z.string().optional().or(z.literal("")),
  points: z.number().int().min(0).max(10000).optional().nullable(),
  recurrenceRule: z.string().optional().or(z.literal("")),
  subtasks: z.array(
    z.object({
      title: z.string().min(1, "Titel ist erforderlich"),
      isDone: z.boolean(),
    })
  ),
})

type TaskFormValues = z.infer<typeof taskFormSchema>

interface TaskFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: Task | null
  members: FamilyMember[]
  onSuccess: () => void
}

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
  members,
  onSuccess,
}: TaskFormDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [seriesMode, setSeriesMode] = useState<SeriesMode>("single")
  const isEditing = !!task
  const isRecurring = !!(task?.recurrenceRule || task?.recurrenceParentId)

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: "",
      status: "open",
      priority: "medium",
      assignedTo: "",
      points: null,
      recurrenceRule: "none",
      subtasks: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "subtasks",
  })

  useEffect(() => {
    setSeriesMode("single")
    if (task) {
      form.reset({
        title: task.title,
        description: task.description || "",
        dueDate: task.dueDate || "",
        status: task.status,
        priority: task.priority,
        assignedTo: task.assignedTo || "",
        points: task.points,
        recurrenceRule: task.recurrenceRule || "none",
        subtasks: task.subtasks.map((s) => ({
          title: s.title,
          isDone: s.isDone,
        })),
      })
    } else {
      form.reset({
        title: "",
        description: "",
        dueDate: "",
        status: "open",
        priority: "medium",
        assignedTo: "",
        points: null,
        recurrenceRule: "none",
        subtasks: [],
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task, open])

  async function onSubmit(values: TaskFormValues) {
    setIsSubmitting(true)
    try {
      const payload = {
        title: values.title,
        description: values.description || undefined,
        dueDate: values.dueDate || undefined,
        status: values.status,
        priority: values.priority,
        assignedTo: values.assignedTo || undefined,
        points: values.points ?? undefined,
        recurrenceRule:
          values.recurrenceRule && values.recurrenceRule !== "none"
            ? values.recurrenceRule
            : undefined,
        subtasks: values.subtasks.map((s, i) => ({
          title: s.title,
          isDone: s.isDone,
          position: i,
        })),
      }

      let result
      if (isEditing && task) {
        result = await updateTaskAction(task.id, { ...payload, seriesMode })
      } else {
        result = await createTaskAction(payload)
      }

      if ("error" in result) {
        toast({
          title: "Fehler",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: isEditing ? "Aufgabe aktualisiert" : "Aufgabe erstellt",
        description: isEditing
          ? "Die Aufgabe wurde erfolgreich aktualisiert."
          : "Die Aufgabe wurde erfolgreich erstellt.",
      })
      onOpenChange(false)
      onSuccess()
    } catch {
      toast({
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!task) return
    setIsDeleting(true)
    try {
      const result = await deleteTaskAction(task.id, seriesMode)
      if ("error" in result) {
        toast({
          title: "Fehler",
          description: result.error,
          variant: "destructive",
        })
        return
      }
      toast({
        title: "Aufgabe geloescht",
        description: "Die Aufgabe wurde erfolgreich geloescht.",
      })
      onOpenChange(false)
      onSuccess()
    } catch {
      toast({
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Aufgabe bearbeiten" : "Neue Aufgabe"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Aendere die Details dieser Aufgabe."
              : "Erstelle eine neue Aufgabe fuer die Familie."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titel *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="z.B. Zimmer aufraeumen"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beschreibung</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optionale Beschreibung..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Faelligkeitsdatum</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioritaet</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Niedrig</SelectItem>
                        <SelectItem value="medium">Mittel</SelectItem>
                        <SelectItem value="high">Hoch</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="open">Offen</SelectItem>
                        <SelectItem value="in_progress">
                          In Bearbeitung
                        </SelectItem>
                        <SelectItem value="done">Erledigt</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assignedTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zugewiesen an</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Niemand" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Unzugewiesen</SelectItem>
                        {members.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="points"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Punkte (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={10000}
                        placeholder="0"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const val = e.target.value
                          field.onChange(val === "" ? null : Number(val))
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recurrenceRule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wiederholung</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Keine" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {RECURRENCE_OPTIONS.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Subtasks */}
            <div>
              <p className="text-sm font-medium leading-none">Unteraufgaben</p>
              <div className="mt-2 space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <Input
                      placeholder="Unteraufgabe..."
                      {...form.register(`subtasks.${index}.title`)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      aria-label="Unteraufgabe entfernen"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => append({ title: "", isDone: false })}
                >
                  <Plus className="h-3 w-3" />
                  Unteraufgabe
                </Button>
              </div>
            </div>

            {isEditing && isRecurring && (
              <div className="rounded-md border p-3 space-y-2">
                <p className="text-sm font-medium leading-none">Welche Aufgaben bearbeiten?</p>
                <RadioGroup
                  value={seriesMode}
                  onValueChange={(v) => setSeriesMode(v as SeriesMode)}
                  className="space-y-1"
                >
                  {[
                    { value: "single", label: "Nur diese Aufgabe" },
                    { value: "following", label: "Diese + alle folgenden" },
                    { value: "all", label: "Alle Aufgaben der Serie" },
                  ].map((opt) => (
                    <div key={opt.value} className="flex items-center gap-2">
                      <RadioGroupItem value={opt.value} id={`task-series-${opt.value}`} />
                      <label htmlFor={`task-series-${opt.value}`} className="text-sm font-normal cursor-pointer">
                        {opt.label}
                      </label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            <DialogFooter className="flex-col gap-2 sm:flex-row">
              {isEditing && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting || isSubmitting}
                >
                  {isDeleting ? "Loeschen..." : "Loeschen"}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Speichern..."
                  : isEditing
                    ? "Speichern"
                    : "Erstellen"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
