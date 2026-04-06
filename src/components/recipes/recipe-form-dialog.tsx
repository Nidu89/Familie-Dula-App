"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Plus, X, Upload, ImageIcon } from "lucide-react"
import Image from "next/image"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type { Recipe } from "@/lib/actions/recipes"
import {
  createRecipeAction,
  updateRecipeAction,
  uploadRecipeImageAction,
} from "@/lib/actions/recipes"
import { PREDEFINED_TAGS } from "@/lib/validations/recipes"
import { useToast } from "@/hooks/use-toast"

interface IngredientInput {
  name: string
  quantity: string
  unit: string
}

interface RecipeFormDialogProps {
  mode: "create" | "edit"
  recipe?: Recipe
  onSaved: () => void
  onClose?: () => void
  autoOpen?: boolean
}

export function RecipeFormDialog({
  mode,
  recipe,
  onSaved,
  onClose,
  autoOpen = false,
}: RecipeFormDialogProps) {
  const t = useTranslations("recipes")
  const tc = useTranslations("common")
  const { toast } = useToast()

  const [open, setOpen] = useState(autoOpen)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Form fields
  const [title, setTitle] = useState(recipe?.title || "")
  const [description, setDescription] = useState(recipe?.description || "")
  const [tags, setTags] = useState<string[]>(recipe?.tags || [])
  const [customTag, setCustomTag] = useState("")
  const [imageUrl, setImageUrl] = useState<string | null>(
    recipe?.imageUrl || null
  )
  const [ingredients, setIngredients] = useState<IngredientInput[]>(
    recipe?.ingredients.map((i) => ({
      name: i.name,
      quantity: i.quantity || "",
      unit: i.unit || "",
    })) || [{ name: "", quantity: "", unit: "" }]
  )

  // Reset form when recipe changes (for edit mode)
  useEffect(() => {
    if (recipe && mode === "edit") {
      setTitle(recipe.title)
      setDescription(recipe.description || "")
      setTags(recipe.tags)
      setImageUrl(recipe.imageUrl)
      setIngredients(
        recipe.ingredients.length > 0
          ? recipe.ingredients.map((i) => ({
              name: i.name,
              quantity: i.quantity || "",
              unit: i.unit || "",
            }))
          : [{ name: "", quantity: "", unit: "" }]
      )
    }
  }, [recipe, mode])

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen)
    if (!newOpen && onClose) {
      onClose()
    }
  }

  function addIngredient() {
    setIngredients([...ingredients, { name: "", quantity: "", unit: "" }])
  }

  function removeIngredient(index: number) {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  function updateIngredient(
    index: number,
    field: keyof IngredientInput,
    value: string
  ) {
    const updated = [...ingredients]
    updated[index] = { ...updated[index], [field]: value }
    setIngredients(updated)
  }

  function togglePredefinedTag(tag: string) {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag))
    } else {
      setTags([...tags, tag])
    }
  }

  function addCustomTag() {
    const trimmed = customTag.trim().toLowerCase()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
    }
    setCustomTag("")
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag))
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Client-side validation
    const MAX_SIZE = 5 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      toast({
        title: tc("error"),
        description: t("imageTooLarge"),
        variant: "destructive",
      })
      return
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: tc("error"),
        description: t("imageInvalidType"),
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const result = await uploadRecipeImageAction(formData)
      if ("error" in result) {
        toast({
          title: tc("error"),
          description: result.error,
          variant: "destructive",
        })
        return
      }
      setImageUrl(result.url)
    } catch {
      toast({
        title: tc("error"),
        description: tc("unexpectedError"),
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    // Filter out empty ingredients
    const validIngredients = ingredients.filter(
      (i) => i.name.trim().length > 0
    )

    setIsSubmitting(true)
    try {
      if (mode === "create") {
        const result = await createRecipeAction({
          title: title.trim(),
          description: description.trim() || undefined,
          tags,
          imageUrl,
          ingredients: validIngredients,
        })
        if ("error" in result) {
          toast({
            title: tc("error"),
            description: result.error,
            variant: "destructive",
          })
          return
        }
        toast({ title: t("recipeCreated") })
      } else if (recipe) {
        const result = await updateRecipeAction(recipe.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          tags,
          imageUrl,
          ingredients: validIngredients,
        })
        if ("error" in result) {
          toast({
            title: tc("error"),
            description: result.error,
            variant: "destructive",
          })
          return
        }
        toast({ title: t("recipeUpdated") })
      }

      // Reset form for create mode
      if (mode === "create") {
        setTitle("")
        setDescription("")
        setTags([])
        setImageUrl(null)
        setIngredients([{ name: "", quantity: "", unit: "" }])
      }

      handleOpenChange(false)
      onSaved()
    } catch {
      toast({
        title: tc("error"),
        description: tc("unexpectedError"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6 pt-2">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="recipe-title">{t("recipeTitle")}</Label>
        <Input
          id="recipe-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("recipeTitlePlaceholder")}
          maxLength={200}
          autoFocus
          className="rounded-lg"
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="recipe-description">
          {tc("descriptionOptional")}
        </Label>
        <Textarea
          id="recipe-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("recipeDescriptionPlaceholder")}
          maxLength={2000}
          rows={3}
          className="rounded-lg resize-none"
        />
      </div>

      {/* Image upload */}
      <div className="space-y-2">
        <Label>{t("recipeImage")}</Label>
        {imageUrl ? (
          <div className="relative h-40 rounded-2xl overflow-hidden bg-surface-container-low">
            <Image
              src={imageUrl}
              alt={t("recipeImageAlt")}
              fill
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => setImageUrl(null)}
              className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-card/80 backdrop-blur-md shadow-md hover:bg-card"
              aria-label={t("removeImage")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label
            htmlFor="recipe-image-upload"
            className={`flex flex-col items-center justify-center h-32 rounded-2xl border-2 border-dashed border-outline-variant/30 bg-surface-container-low cursor-pointer hover:bg-muted transition-colors ${
              isUploading ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            {isUploading ? (
              <p className="text-sm text-muted-foreground">{t("uploading")}</p>
            ) : (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 mb-2">
                  <Upload className="h-5 w-5 text-secondary" />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("imageUploadHint")}
                </p>
              </>
            )}
            <input
              id="recipe-image-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        )}
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label>{t("recipeTags")}</Label>
        {/* Predefined tags */}
        <div className="flex flex-wrap gap-2">
          {PREDEFINED_TAGS.map((tag) => {
            const isActive = tags.includes(tag)
            return (
              <button
                key={tag}
                type="button"
                onClick={() => togglePredefinedTag(tag)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  isActive
                    ? "bg-secondary text-white"
                    : "bg-surface-container-high text-foreground hover:bg-muted"
                }`}
              >
                {t(`tags.${tag}`)}
              </button>
            )
          })}
        </div>

        {/* Custom tags */}
        {tags
          .filter(
            (tag) =>
              !PREDEFINED_TAGS.includes(
                tag as (typeof PREDEFINED_TAGS)[number]
              )
          )
          .length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags
              .filter(
                (tag) =>
                  !PREDEFINED_TAGS.includes(
                    tag as (typeof PREDEFINED_TAGS)[number]
                  )
              )
              .map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-secondary-container text-secondary"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-destructive"
                    aria-label={t("removeTag", { tag })}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
          </div>
        )}

        {/* Add custom tag */}
        <div className="flex gap-2">
          <Input
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            placeholder={t("customTagPlaceholder")}
            maxLength={50}
            className="rounded-lg flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                addCustomTag()
              }
            }}
          />
          <button
            type="button"
            onClick={addCustomTag}
            disabled={!customTag.trim()}
            className="px-4 py-2 rounded-full text-xs font-bold bg-surface-container-high text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            {t("addTag")}
          </button>
        </div>
      </div>

      {/* Ingredients */}
      <div className="space-y-3">
        <Label>{t("recipeIngredients")}</Label>
        {ingredients.map((ing, index) => (
          <div key={index} className="flex gap-2 items-start">
            <Input
              value={ing.name}
              onChange={(e) => updateIngredient(index, "name", e.target.value)}
              placeholder={t("ingredientNamePlaceholder")}
              maxLength={200}
              className="rounded-lg flex-1"
            />
            <Input
              value={ing.quantity}
              onChange={(e) =>
                updateIngredient(index, "quantity", e.target.value)
              }
              placeholder={t("ingredientQuantityPlaceholder")}
              maxLength={50}
              className="rounded-lg w-20"
            />
            <Input
              value={ing.unit}
              onChange={(e) => updateIngredient(index, "unit", e.target.value)}
              placeholder={t("ingredientUnitPlaceholder")}
              maxLength={50}
              className="rounded-lg w-20"
            />
            {ingredients.length > 1 && (
              <button
                type="button"
                onClick={() => removeIngredient(index)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                aria-label={t("removeIngredient")}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addIngredient}
          className="flex items-center gap-2 text-sm font-medium text-secondary hover:text-secondary/80 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {t("addIngredient")}
        </button>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => handleOpenChange(false)}
          className="px-6 py-3 rounded-full text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          {tc("cancel")}
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !title.trim()}
          className="bg-gradient-to-br from-[#6c5a00] to-[#ffd709] text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isSubmitting
            ? tc("saving")
            : mode === "create"
              ? tc("create")
              : tc("save")}
        </button>
      </div>
    </form>
  )

  if (mode === "edit") {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="rounded-[2rem] sm:rounded-[2rem] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold text-secondary">
              {t("editRecipe")}
            </DialogTitle>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          className="bg-gradient-to-br from-[#6c5a00] to-[#ffd709] text-white font-bold py-4 px-8 rounded-full shadow-lg shadow-primary/20 flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
          aria-label={t("newRecipe")}
        >
          <Plus className="h-5 w-5" />
          {t("newRecipe")}
        </button>
      </DialogTrigger>
      <DialogContent className="rounded-[2rem] sm:rounded-[2rem] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold text-secondary">
            {t("newRecipe")}
          </DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  )
}
