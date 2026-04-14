"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { Loader2, Pencil, Check, X } from "lucide-react"

import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import {
  updateFamilyNameSchema,
  type UpdateFamilyNameFormValues,
} from "@/lib/validations/family"
import { updateFamilyNameAction } from "@/lib/actions/family"
import { useErrorTranslation } from "@/lib/use-error-translation"

interface FamilyNameSectionProps {
  familyName: string
  isAdmin: boolean
}

export function FamilyNameSection({
  familyName,
  isAdmin,
}: FamilyNameSectionProps) {
  const t = useTranslations("family.nameSection")
  const tc = useTranslations("common")
  const te = useErrorTranslation()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const form = useForm<UpdateFamilyNameFormValues>({
    resolver: zodResolver(updateFamilyNameSchema),
    defaultValues: {
      familyName,
    },
  })

  async function onSubmit(values: UpdateFamilyNameFormValues) {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const result = await updateFamilyNameAction(values.familyName)
      if (result?.error) {
        setErrorMessage(te(result.error))
      } else {
        setIsEditing(false)
        router.refresh()
      }
    } catch {
      setErrorMessage(tc("unexpectedError"))
    } finally {
      setIsLoading(false)
    }
  }

  function onCancel() {
    setIsEditing(false)
    setErrorMessage(null)
    form.reset({ familyName })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("title")}</CardTitle>
        <CardDescription>
          {t("description")}
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

        {isEditing ? (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex items-start gap-2"
            >
              <FormField
                control={form.control}
                name="familyName"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        type="text"
                        placeholder={t("placeholder")}
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading}
                aria-label={t("saveAria")}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                aria-label={t("cancelAria")}
              >
                <X className="h-4 w-4" />
              </Button>
            </form>
          </Form>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-lg font-medium">{familyName}</p>
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(true)}
                aria-label={t("editAria")}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
