import { redirect } from "next/navigation"

import { getAppSession } from "@/lib/session"
import { getChannelsAction } from "@/lib/actions/chat"
import { getFamilyDataAction } from "@/lib/actions/family"
import { ChatPageClient } from "@/components/chat/chat-page-client"

export default async function ChatPage() {
  const session = await getAppSession()
  if (!session) redirect("/login")

  const [channelsResult, familyResult] = await Promise.all([
    getChannelsAction(),
    getFamilyDataAction(),
  ])

  const initialChannels = "error" in channelsResult ? [] : channelsResult.channels
  const members =
    "error" in familyResult
      ? []
      : familyResult.members.map((m) => ({
          id: m.id,
          displayName: m.displayName,
        }))

  return (
    <ChatPageClient
      initialChannels={initialChannels}
      currentUserId={session.userId}
      currentUserName={session.displayName}
      familyMembers={members}
    />
  )
}
