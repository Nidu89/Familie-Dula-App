import { redirect } from "next/navigation"
import { getAppSession } from "@/lib/session"
import { getMomentsAction } from "@/lib/actions/moments"
import { MomentsPageClient } from "@/components/moments/moments-page-client"

export default async function MomentsPage() {
  const session = await getAppSession()

  if (!session) redirect("/login")

  const result = await getMomentsAction({ limit: 12 })
  const initialMoments = "moments" in result ? result.moments : []
  const initialHasMore = "hasMore" in result ? result.hasMore : false

  return (
    <MomentsPageClient
      currentUserId={session.userId}
      isAdmin={session.role === "admin"}
      initialMoments={initialMoments}
      initialHasMore={initialHasMore}
    />
  )
}
