import { redirect } from "next/navigation"

import { getAppSession } from "@/lib/session"
import {
  getFamilyLeaderboardAction,
  getRewardShopAction,
  getAchievementsAction,
  getFamilyGoalAction,
  getCompletedGoalsAction,
  getRewardsOverviewAction,
} from "@/lib/actions/rewards"
import { FamilyLeaderboard } from "@/components/rewards/family-leaderboard"
import { RewardShop } from "@/components/rewards/reward-shop"
import { AchievementGallery } from "@/components/rewards/achievement-gallery"
import { CommunityGoal } from "@/components/rewards/community-goal"
import { JarsSection } from "@/components/rewards/jars-section"
import { RewardsPageHeader } from "@/components/rewards/rewards-page-header"

export default async function RewardsPage() {
  const session = await getAppSession()
  if (!session) redirect("/login")

  const isAdultOrAdmin = session.role === "admin" || session.role === "adult"

  const [leaderboardResult, shopResult, achievementsResult, goalResult, completedGoalsResult, overviewResult] =
    await Promise.all([
      getFamilyLeaderboardAction(),
      getRewardShopAction(),
      getAchievementsAction(),
      getFamilyGoalAction(),
      getCompletedGoalsAction(),
      getRewardsOverviewAction(),
    ])

  const leaderboardMembers =
    "error" in leaderboardResult ? [] : leaderboardResult.members
  const shopRewards = "error" in shopResult ? [] : shopResult.rewards
  const shopBalance = "error" in shopResult ? 0 : shopResult.userBalance
  const achievements =
    "error" in achievementsResult ? [] : achievementsResult.achievements
  const familyGoal =
    "error" in goalResult ? null : goalResult.goal
  const goalContributions =
    "error" in goalResult ? [] : goalResult.contributions
  const completedGoals =
    "error" in completedGoalsResult ? [] : completedGoalsResult.goals
  const childrenOverview =
    "error" in overviewResult ? [] : overviewResult.children

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <RewardsPageHeader />

      <div className="space-y-12">
        <FamilyLeaderboard members={leaderboardMembers} isAdultOrAdmin={isAdultOrAdmin} />

        <JarsSection
          childProfiles={childrenOverview}
          isAdultOrAdmin={isAdultOrAdmin}
          currentUserId={session.userId}
        />

        <RewardShop
          initialRewards={shopRewards}
          initialBalance={shopBalance}
          isAdultOrAdmin={isAdultOrAdmin}
          maxVisible={6}
          showViewAll
        />

        <AchievementGallery achievements={achievements} />

        <CommunityGoal
          initialGoal={familyGoal}
          initialContributions={goalContributions}
          initialCompletedGoals={completedGoals}
          userBalance={shopBalance}
          isAdultOrAdmin={isAdultOrAdmin}
        />
      </div>
    </main>
  )
}
