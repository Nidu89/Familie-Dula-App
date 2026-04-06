"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
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
  const t = useTranslations("rewards.manualPoints")
  const tc = useTranslations("common")
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
          title: tc("error"),
          description: result.error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: t("success"),
        description: `${result.amountApplied > 0 ? "+" : ""}${result.amountApplied} Punkte. Neuer Stand: ${result.newBalance}`,
      })

      form.reset()
      onOpenChange(false)
      onSuccess()
    } catch {
      toast({
        title: tc("error"),
        description: t("error"),
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
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description", { childName })}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg bg-muted p-3 text-center">
          <p className="text-xs text-muted-foreground">{t("currentBalance")}</p>
          <p className="text-2xl font-bold">{currentBalance} {tc("points")}</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("amountLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder={t("amountPlaceholder")}
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    {t("amountHint")}
                  </p>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("commentLabel")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("commentPlaceholder")}
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
                {t("newBalance")}
              </p>
              <p
                className={`text-xl font-bold ${previewBalance !== currentBalance ? "text-primary" : ""}`}
              >
                {previewBalance} {tc("points")}
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("submitLoading") : t("submit")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
