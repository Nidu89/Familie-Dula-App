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
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import {
  createRewardAction,
  updateRewardAction,
  type Reward,
} from "@/lib/actions/rewards"
import {
  createRewardSchema,
  type CreateRewardFormValues,
} from "@/lib/validations/rewards"

interface RewardFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editReward?: Reward | null
  onSuccess: () => void
}

export function RewardFormDialog({
  open,
  onOpenChange,
  editReward,
  onSuccess,
}: RewardFormDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const isEditing = !!editReward

  const form = useForm<CreateRewardFormValues>({
    resolver: zodResolver(createRewardSchema),
    defaultValues: {
      title: "",
      description: "",
      iconEmoji: "",
      pointsCost: 10,
    },
  })

  // Reset form when dialog opens/closes or editReward changes
  useEffect(() => {
    if (open) {
      if (editReward) {
        form.reset({
          title: editReward.title,
          description: editReward.description || "",
          iconEmoji: editReward.iconEmoji,
          pointsCost: editReward.pointsCost,
        })
        setIsActive(editReward.isActive)
      } else {
        form.reset({
          title: "",
          description: "",
          iconEmoji: "",
          pointsCost: 10,
        })
        setIsActive(true)
      }
    }
  }, [open, editReward, form])

  async function onSubmit(values: CreateRewardFormValues) {
    setIsSubmitting(true)
    try {
      if (isEditing && editReward) {
        const result = await updateRewardAction(editReward.id, {
          title: values.title,
          description: values.description,
          iconEmoji: values.iconEmoji,
          pointsCost: values.pointsCost,
          isActive,
        })
        if ("error" in result) {
          toast({
            title: "Fehler",
            description: result.error,
            variant: "destructive",
          })
          return
        }
        toast({
          title: "Belohnung aktualisiert",
          description: `"${values.title}" wurde gespeichert.`,
        })
      } else {
        const result = await createRewardAction(values)
        if ("error" in result) {
          toast({
            title: "Fehler",
            description: result.error,
            variant: "destructive",
          })
          return
        }
        toast({
          title: "Belohnung erstellt",
          description: `"${values.title}" ist jetzt im Shop verfuegbar.`,
        })
      }

      onOpenChange(false)
      onSuccess()
    } catch {
      toast({
        title: "Fehler",
        description: "Belohnung konnte nicht gespeichert werden.",
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
          <DialogTitle>
            {isEditing ? "Belohnung bearbeiten" : "Neue Belohnung"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Aendere die Details dieser Belohnung."
              : "Erstelle eine neue Belohnung fuer den Shop."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="iconEmoji"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emoji-Icon</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="z.B. &#x1F3AE;"
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
                  <FormLabel>Titel</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="z.B. 30 Min. Spielzeit"
                      maxLength={50}
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
                      placeholder="Kurze Beschreibung der Belohnung"
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
              name="pointsCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Punktekosten</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={9999}
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? 1 : Number(e.target.value)
                        )
                      }
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Active toggle only in edit mode */}
            {isEditing && (
              <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                <div>
                  <p className="text-sm font-medium">Sichtbar im Shop</p>
                  <p className="text-xs text-muted-foreground">
                    Deaktivierte Belohnungen sind fuer Kinder nicht sichtbar.
                  </p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            )}

            <DialogFooter>
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
