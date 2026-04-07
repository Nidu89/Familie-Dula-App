"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Users, MessageCircle, Plus } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { createDirectChannelAction, type ChatChannel } from "@/lib/actions/chat"
import { useToast } from "@/hooks/use-toast"

interface ChatSidebarProps {
  channels: ChatChannel[]
  activeChannelId: string | null
  currentUserId: string
  familyMembers: { id: string; displayName: string }[]
  onSelectChannel: (channelId: string) => void
  onChannelCreated: (channel: ChatChannel) => void
}

export function ChatSidebar({
  channels,
  activeChannelId,
  currentUserId,
  familyMembers,
  onSelectChannel,
  onChannelCreated,
}: ChatSidebarProps) {
  const t = useTranslations("chat")
  const tc = useTranslations("common")
  const { toast } = useToast()
  const [dmSheetOpen, setDmSheetOpen] = useState(false)
  const [creatingDm, setCreatingDm] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  const familyChannel = channels.find((c) => c.type === "family")
  const dmChannels = channels.filter((c) => c.type === "direct")

  // Members who don't have a DM yet
  const existingDmUserIds = new Set(
    dmChannels.flatMap((c) => c.members.map((m) => m.id))
  )
  const availableForDm = familyMembers.filter(
    (m) => m.id !== currentUserId && !existingDmUserIds.has(m.id)
  )

  async function handleCreateDm(targetUserId: string) {
    setCreatingDm(targetUserId)
    try {
      const result = await createDirectChannelAction({ targetUserId })
      if ("error" in result) {
        toast({ title: tc("error"), description: result.error, variant: "destructive" })
        return
      }
      const target = familyMembers.find((m) => m.id === targetUserId)
      const newChannel: ChatChannel = {
        id: result.channelId,
        familyId: "",
        type: "direct",
        name: target?.displayName || "Direktnachricht",
        lastMessage: null,
        lastMessageAt: null,
        lastMessageSender: null,
        unreadCount: 0,
        members: [
          { id: currentUserId, displayName: "" },
          { id: targetUserId, displayName: target?.displayName || "" },
        ],
      }
      onChannelCreated(newChannel)
      setDmSheetOpen(false)
      setMobileOpen(false)
    } catch {
      toast({ title: tc("error"), description: tc("unexpectedError"), variant: "destructive" })
    } finally {
      setCreatingDm(null)
    }
  }

  function handleSelect(channelId: string) {
    onSelectChannel(channelId)
    setMobileOpen(false)
  }

  const channelList = (
    <div className="flex flex-col h-full">
      {/* Family channel */}
      {familyChannel && (
        <div className="px-3 pt-3 pb-2">
          <button
            type="button"
            onClick={() => handleSelect(familyChannel.id)}
            className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl transition-all ${
              activeChannelId === familyChannel.id
                ? "bg-gradient-to-br from-[#6c5a00] to-[#ffd709] text-white shadow-md"
                : "hover:bg-muted"
            }`}
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full shrink-0 ${
                activeChannelId === familyChannel.id
                  ? "bg-white/20"
                  : "bg-secondary/10"
              }`}
            >
              <Users
                className={`h-5 w-5 ${
                  activeChannelId === familyChannel.id
                    ? "text-white"
                    : "text-secondary"
                }`}
              />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="font-semibold text-sm truncate">
                {t("familyChannel")}
              </p>
              {familyChannel.lastMessage && (
                <p
                  className={`text-xs truncate mt-0.5 ${
                    activeChannelId === familyChannel.id
                      ? "text-white/70"
                      : "text-muted-foreground"
                  }`}
                >
                  {familyChannel.lastMessageSender}: {familyChannel.lastMessage}
                </p>
              )}
            </div>
            {familyChannel.unreadCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5">
                {familyChannel.unreadCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* DM section */}
      <div className="px-6 pt-4 pb-2 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {t("directMessages")}
        </span>
        <button
          type="button"
          onClick={() => setDmSheetOpen(true)}
          className="p-1.5 rounded-full hover:bg-muted transition-colors"
          aria-label={t("newDirectMessage")}
        >
          <Plus className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* DM list */}
      <div className="flex-1 overflow-y-auto px-3 space-y-0.5 scrollbar-none">
        {dmChannels.length === 0 ? (
          <p className="px-4 py-3 text-xs text-muted-foreground">
            {t("noChannelsDescription")}
          </p>
        ) : (
          dmChannels.map((ch) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => handleSelect(ch.id)}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl transition-all ${
                activeChannelId === ch.id
                  ? "bg-gradient-to-br from-[#6c5a00] to-[#ffd709] text-white shadow-md"
                  : "hover:bg-muted"
              }`}
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full shrink-0 text-xs font-bold ${
                  activeChannelId === ch.id
                    ? "bg-white/20 text-white"
                    : "bg-secondary-container text-secondary"
                }`}
              >
                {ch.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="font-medium text-sm truncate">{ch.name}</p>
                {ch.lastMessage && (
                  <p
                    className={`text-xs truncate mt-0.5 ${
                      activeChannelId === ch.id
                        ? "text-white/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {ch.lastMessage}
                  </p>
                )}
              </div>
              {ch.unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5">
                  {ch.unreadCount}
                </span>
              )}
            </button>
          ))
        )}
      </div>

      {/* New DM Sheet */}
      <Sheet open={dmSheetOpen} onOpenChange={setDmSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-[2rem] px-6 pb-10">
          <SheetHeader className="mb-4">
            <SheetTitle className="font-display text-xl font-bold text-secondary">
              {t("newDirectMessage")}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-1">
            {availableForDm.length === 0 && dmChannels.length > 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {t("noChannelsDescription")}
              </p>
            ) : (
              [...availableForDm, ...dmChannels.map((c) => {
                const other = c.members.find((m) => m.id !== currentUserId)
                return other ? { id: other.id, displayName: other.displayName } : null
              }).filter(Boolean) as { id: string; displayName: string }[]].filter(
                (member, index, self) => self.findIndex((m) => m.id === member.id) === index
              ).map((member) => {
                const existingChannel = dmChannels.find((c) =>
                  c.members.some((m) => m.id === member.id)
                )
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => {
                      if (existingChannel) {
                        handleSelect(existingChannel.id)
                        setDmSheetOpen(false)
                      } else {
                        handleCreateDm(member.id)
                      }
                    }}
                    disabled={creatingDm === member.id}
                    className="flex items-center gap-4 w-full rounded-2xl px-5 py-4 hover:bg-muted active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-container text-secondary text-sm font-bold shrink-0">
                      {member.displayName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {member.displayName}
                    </span>
                    {existingChannel && (
                      <MessageCircle className="h-4 w-4 text-muted-foreground ml-auto" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex w-80 border-r border-outline-variant/15 flex-col bg-surface-container-low shrink-0">
        {channelList}
      </div>

      {/* Mobile: toggle button (shown when thread is active) */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-24 left-4 z-30 p-2.5 rounded-full bg-card shadow-md"
        aria-label={t("directMessages")}
      >
        <MessageCircle className="h-5 w-5 text-foreground" />
      </button>

      {/* Mobile sidebar sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <SheetHeader className="px-6 pt-6 pb-2">
            <SheetTitle className="font-display text-xl font-bold text-secondary">
              {t("pageTitle")}
            </SheetTitle>
          </SheetHeader>
          {channelList}
        </SheetContent>
      </Sheet>
    </>
  )
}
