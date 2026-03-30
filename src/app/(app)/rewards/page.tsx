import { redirect } from "next/navigation"

import { getDashboardDataAction } from "@/lib/actions/dashboard"
import {
  getFamilyLeaderboardAction,
  getRewardShopAction,
  getAchievementsAction,
  getFamilyGoalAction,
  getCompletedGoalsAction,
} from "@/lib/actions/rewards"
import { FamilyLeaderboard } from "@/components/rewards/family-leaderboard"
import { RewardShop } from "@/components/rewards/reward-shop"
import { AchievementGallery } from "@/components/rewards/achievement-gallery"
import { CommunityGoal } from "@/components/rewards/community-goal"

export default async function RewardsPage() {
  const dashResult = await getDashboardDataAction()

  if ("error" in dashResult) {
    if (dashResult.error === "Nicht angemeldet.") redirect("/login")
    if (dashResult.error === "Du gehoerst keiner Familie an.")
      redirect("/onboarding")
    return (
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <p className="text-sm text-muted-foreground">
          Belohnungen konnten nicht geladen werden. Bitte Seite neu laden.
        </p>
      </main>
    )
  }

  const { role } = dashResult
  const isAdultOrAdmin = role === "admin" || role === "adult"

  // Load all data in parallel
  const [leaderboardResult, shopResult, achievementsResult, goalResult, completedGoalsResult] =
    await Promise.all([
      getFamilyLeaderboardAction(),
      getRewardShopAction(),
      getAchievementsAction(),
      getFamilyGoalAction(),
      getCompletedGoalsAction(),
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

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Belohnungen & Erfolge
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Punkte sammeln, Belohnungen einloesen und gemeinsam Ziele erreichen.
        </p>
      </div>

      {/* Sections with generous spacing per design system */}
      <div className="space-y-12">
        {/* 1. Leaderboard */}
        <FamilyLeaderboard members={leaderboardMembers} isAdultOrAdmin={isAdultOrAdmin} />

        {/* 2. Reward Shop */}
        <RewardShop
          initialRewards={shopRewards}
          initialBalance={shopBalance}
          isAdultOrAdmin={isAdultOrAdmin}
          maxVisible={6}
          showViewAll
        />

        {/* 3. Achievement Badges */}
        <AchievementGallery achievements={achievements} />

        {/* 4. Community Goal */}
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
