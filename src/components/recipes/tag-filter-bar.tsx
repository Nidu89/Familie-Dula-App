"use client"

import { useTranslations } from "next-intl"
import { PREDEFINED_TAGS } from "@/lib/validations/recipes"

interface TagFilterBarProps {
  allTags: string[]
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
}

export function TagFilterBar({
  allTags,
  selectedTags,
  onTagsChange,
}: TagFilterBarProps) {
  const t = useTranslations("recipes")

  function toggleTag(tag: string) {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter((t) => t !== tag))
    } else {
      onTagsChange([...selectedTags, tag])
    }
  }

  // Sort predefined tags first, then custom tags
  const sortedTags = [
    ...PREDEFINED_TAGS.filter((pt) => allTags.includes(pt)),
    ...allTags.filter(
      (tag) => !PREDEFINED_TAGS.includes(tag as (typeof PREDEFINED_TAGS)[number])
    ),
  ]

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={t("filterByTags")}>
      {sortedTags.map((tag) => {
        const isActive = selectedTags.includes(tag)
        const isPredefined = PREDEFINED_TAGS.includes(
          tag as (typeof PREDEFINED_TAGS)[number]
        )
        // Use translated label for predefined tags
        const label = isPredefined ? t(`tags.${tag}`) : tag

        return (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(tag)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              isActive
                ? "bg-secondary text-white shadow-md"
                : "bg-surface-container-high text-foreground hover:bg-muted"
            }`}
            aria-pressed={isActive}
          >
            {label}
          </button>
        )
      })}

      {selectedTags.length > 0 && (
        <button
          type="button"
          onClick={() => onTagsChange([])}
          className="px-4 py-2 rounded-full text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          {t("clearFilters")}
        </button>
      )}
    </div>
  )
}
