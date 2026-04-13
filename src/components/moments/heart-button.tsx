"use client"

import { useState, useTransition } from "react"
import { Heart } from "lucide-react"
import { useTranslations } from "next-intl"
import { toggleReactionAction } from "@/lib/actions/moments"

interface HeartButtonProps {
  momentId: string
  initialLiked: boolean
  initialCount: number
}

export function HeartButton({
  momentId,
  initialLiked,
  initialCount,
}: HeartButtonProps) {
  const t = useTranslations("moments")
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [isPending, startTransition] = useTransition()

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation()

    // Optimistic update
    const newLiked = !liked
    setLiked(newLiked)
    setCount((c) => (newLiked ? c + 1 : Math.max(0, c - 1)))

    startTransition(async () => {
      const result = await toggleReactionAction({ momentId })
      if ("error" in result) {
        // Revert
        setLiked(!newLiked)
        setCount((c) => (newLiked ? Math.max(0, c - 1) : c + 1))
        return
      }
      setLiked(result.liked)
      setCount(result.heartCount)
    })
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      data-liked={liked ? "true" : "false"}
      aria-label={liked ? t("heartAriaUnlike") : t("heartAriaLike")}
      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all active:scale-95 disabled:opacity-60"
    >
      <Heart
        className={`h-4 w-4 transition-colors ${
          liked
            ? "fill-red-500 text-red-500"
            : "fill-none text-muted-foreground"
        }`}
      />
      {count > 0 && (
        <span
          className={liked ? "text-red-500" : "text-muted-foreground"}
        >
          {count}
        </span>
      )}
    </button>
  )
}
