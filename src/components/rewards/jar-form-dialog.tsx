"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslations } from "next-intl"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import {
  createJarAction,
  updateJarAction,
  type SavingsJar,
} from "@/lib/actions/rewards"
import { useErrorTranslation } from "@/lib/use-error-translation"
import { type JarType } from "@/lib/validations/rewards"

const jarFormSchema = z.object({
  name: z
    .string()
    .min(1, "Name ist erforderlich")
    .max(50, "Maximal 50 Zeichen"),
  jarType: z.enum(["spend", "save", "donate", "custom"]),
  targetAmount: z
    .number()
    .int("Muss eine ganze Zahl sein")
    .min(0, "Darf nicht negativ sein")
    .max(99999, "Maximal 99.999"),
})

type JarFormValues = z.infer<typeof jarFormSchema>

interface JarFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editJar?: SavingsJar | null
  childProfileId: string
  childName: string
  onSuccess: () => void
}

export function JarFormDialog({
  open,
  onOpenChange,
  editJar,
  childProfileId,
  childName,
  onSuccess,
}: JarFormDialogProps) {
  const t = useTranslations("rewards.jarForm")
  const tj = useTranslations("rewards.jars")
  const tc = useTranslations("common")
  const te = useErrorTranslation()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!editJar

  const form = useForm<JarFormValues>({
    resolver: zodResolver(jarFormSchema),
    defaultValues: {
      name: "",
      jarType: "save" as JarType,
      targetAmount: 0,
    },
  })

  // Reset form when dialog opens/closes or editJar changes
  useEffect(() => {
    if (open) {
      if (editJar) {
        form.reset({
          name: editJar.name,
          jarType: editJar.jarType,
          targetAmount: editJar.targetAmount,
        })
      } else {
        form.reset({
          name: "",
          jarType: "save",
          targetAmount: 0,
        })
      }
    }
  }, [open, editJar, form])

  async function onSubmit(values: JarFormValues) {
    setIsSubmitting(true)
    try {
      if (isEditing && editJar) {
        const result = await updateJarAction(editJar.id, {
          name: values.name,
          jarType: values.jarType as JarType,
          targetAmount: values.targetAmount,
        })
        if ("error" in result) {
          toast({
            title: tc("error"),
            description: te(result.error),
            variant: "destructive",
          })
          return
        }
        toast({
          title: t("updated"),
          description: t("updatedDescription", { name: values.name }),
        })
      } else {
        const result = await createJarAction({
          profileId: childProfileId,
          name: values.name,
          jarType: values.jarType as JarType,
          targetAmount: values.targetAmount,
        })
        if ("error" in result) {
          toast({
            title: tc("error"),
            description: te(result.error),
            variant: "destructive",
          })
          return
        }
        toast({
          title: t("created"),
          description: t("createdDescription", { name: values.name }),
        })
      }

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
          <DialogTitle>
            {isEditing ? t("editTitle") : t("createTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t("editDescription", { childName })
              : t("createDescription", { childName })}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("nameLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("namePlaceholder")}
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
              name="jarType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("typeLabel")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("typePlaceholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="spend">{tj("type.spend")}</SelectItem>
                      <SelectItem value="save">{tj("type.save")}</SelectItem>
                      <SelectItem value="donate">{tj("type.donate")}</SelectItem>
                      <SelectItem value="custom">{tj("type.custom")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("targetLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={99999}
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? 0 : Number(e.target.value)
                        )
                      }
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    {t("targetHint")}
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
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? tc("saving")
                  : isEditing
                    ? tc("save")
                    : tc("create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
