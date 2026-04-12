"use client"

import { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

const EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
  {
    label: "Belohnungen",
    emojis: ["🎁", "🏆", "⭐", "🌟", "💎", "👑", "🎯", "🎮", "🎬", "🎨", "🎵", "🎪"],
  },
  {
    label: "Essen",
    emojis: ["🍕", "🍔", "🍦", "🍩", "🍪", "🎂", "🍫", "🍬", "🧁", "🍿", "🥤", "🍭"],
  },
  {
    label: "Aktivitäten",
    emojis: ["⚽", "🏀", "🎾", "🏊", "🚴", "🎳", "🛹", "🎿", "🏕️", "🎣", "🧗", "🤸"],
  },
  {
    label: "Tiere",
    emojis: ["🐶", "🐱", "🐰", "🦊", "🐼", "🦁", "🐸", "🦋", "🐝", "🐬", "🦄", "🐧"],
  },
  {
    label: "Natur",
    emojis: ["🌈", "☀️", "🌙", "⚡", "🔥", "❄️", "🌸", "🌺", "🍀", "🌴", "🌻", "🍁"],
  },
  {
    label: "Gesichter",
    emojis: ["😊", "😎", "🤩", "😇", "🥳", "😍", "🤗", "😜", "🧐", "💪", "🙌", "❤️"],
  },
  {
    label: "Objekte",
    emojis: ["📚", "✏️", "🎒", "💡", "🔑", "🛒", "🧹", "🧸", "📱", "💰", "🎈", "🏠"],
  },
]

interface EmojiPickerProps {
  value: string
  onChange: (emoji: string) => void
}

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const [open, setOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState(0)

  function handleSelect(emoji: string) {
    onChange(emoji)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-14 w-14 text-2xl rounded-2xl"
        >
          {value || "😊"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        {/* Category tabs */}
        <div className="flex gap-1 overflow-x-auto px-2 pt-2 pb-1 scrollbar-none">
          {EMOJI_CATEGORIES.map((cat, i) => (
            <button
              key={cat.label}
              type="button"
              onClick={() => setActiveCategory(i)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeCategory === i
                  ? "bg-secondary text-white"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
        {/* Emoji grid */}
        <div className="grid grid-cols-6 gap-1 p-2">
          {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleSelect(emoji)}
              className={`flex h-10 w-full items-center justify-center rounded-lg text-xl transition-colors hover:bg-muted ${
                value === emoji ? "bg-primary/20 ring-2 ring-primary" : ""
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
