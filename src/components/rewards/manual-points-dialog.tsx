"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

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
import { manualPointsAction } from "@/lib/actions/rewards"

const manualPointsFormSchema = z.object({
  amount: z
    .number()
    .int("Betrag muss eine ganze Zahl sein")
    .refine((val) => val !== 0, "Betrag darf nicht 0 sein"),
  comment: z.string().max(500).optional().or(z.literal("")),
})

type ManualPointsFormValues = z.infer<typeof manualPointsFormSchema>

interface ManualPointsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  childId: string | null
  childName: string
  currentBalance: number
  onSuccess: () => void
}

export function ManualPointsDialog({
  open,
  onOpenChange,
  childId,
  childName,
  currentBalance,
  onSuccess,
}: ManualPointsDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ManualPointsFormValues>({
    resolver: zodResolver(manualPointsFormSchema),
    defaultValues: {
      amount: 0,
      comment: "",
    },
  })

  const watchAmount = form.watch("amount")
  const previewBalance = Math.max(0, currentBalance + (watchAmount || 0))

  async function onSubmit(values: ManualPointsFormValues) {
    if (!childId) return
    setIsSubmitting(true)
    try {
      const result = await manualPointsAction(
        childId,
        values.amount,
        values.comment || undefined
      )

      if ("error" in result) {
        toast({
          title: "Fehler",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Punkte gebucht",
        description: `${result.amountApplied > 0 ? "+" : ""}${result.amountApplied} Punkte. Neuer Stand: ${result.newBalance}`,
      })

      form.reset()
      onOpenChange(false)
      onSuccess()
    } catch {
      toast({
        title: "Fehler",
        description: "Punkte konnten nicht gebucht werden.",
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
          <DialogTitle>Punkte vergeben</DialogTitle>
          <DialogDescription>
            Punkte manuell fuer {childName} hinzufuegen oder abziehen.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg bg-muted p-3 text-center">
          <p className="text-xs text-muted-foreground">Aktueller Stand</p>
          <p className="text-2xl font-bold">{currentBalance} Punkte</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Betrag</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="z.B. 10 oder -5"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    Positiv = hinzufuegen, negativ = abziehen
                  </p>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kommentar (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="z.B. Bonus fuer gutes Benehmen"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Preview */}
            <div className="rounded-lg border bg-card p-3 text-center">
              <p className="text-xs text-muted-foreground">
                Neuer Stand nach Buchung
              </p>
              <p
                className={`text-xl font-bold ${previewBalance !== currentBalance ? "text-primary" : ""}`}
              >
                {previewBalance} Punkte
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Buchen..." : "Buchen"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
