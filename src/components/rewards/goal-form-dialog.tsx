"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

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
import { useToast } from "@/hooks/use-toast"
import { createFamilyGoalAction } from "@/lib/actions/rewards"
import {
  createGoalSchema,
  type CreateGoalFormValues,
} from "@/lib/validations/rewards"

interface GoalFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function GoalFormDialog({
  open,
  onOpenChange,
  onSuccess,
}: GoalFormDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CreateGoalFormValues>({
    resolver: zodResolver(createGoalSchema),
    defaultValues: {
      title: "",
      description: "",
      emoji: "",
      targetPoints: 500,
    },
  })

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        title: "",
        description: "",
        emoji: "",
        targetPoints: 500,
      })
    }
  }, [open, form])

  async function onSubmit(values: CreateGoalFormValues) {
    setIsSubmitting(true)
    try {
      const result = await createFamilyGoalAction(values)
      if ("error" in result) {
        toast({
          title: "Fehler",
          description: result.error,
          variant: "destructive",
        })
        return
      }
      toast({
        title: "Familienziel erstellt",
        description: `"${values.title}" ist jetzt das aktive Familienziel.`,
      })
      onOpenChange(false)
      onSuccess()
    } catch {
      toast({
        title: "Fehler",
        description: "Familienziel konnte nicht erstellt werden.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Neues Familienziel</DialogTitle>
          <DialogDescription>
            Erstelle ein gemeinsames Ziel, auf das die ganze Familie hinarbeitet.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="emoji"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emoji</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="z.B. &#x1F3A2;"
                      maxLength={4}
                      className="text-center text-2xl"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zielname</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="z.B. Grosser Zoobesuch"
                      maxLength={100}
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
                  <FormLabel>Beschreibung (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Worum geht es bei diesem Ziel?"
                      rows={2}
                      maxLength={200}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetPoints"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zielpunkte</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={100}
                      max={100000}
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? 100
                            : Number(e.target.value)
                        )
                      }
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    Alle Familienmitglieder arbeiten gemeinsam auf dieses Ziel hin.
                  </p>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Erstellen..." : "Ziel starten"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
