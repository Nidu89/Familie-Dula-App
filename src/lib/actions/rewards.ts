"use server"

import { createClient } from "@/lib/supabase/server"
import { manualPointsSchema } from "@/lib/validations/tasks"
import {
  createRewardSchema,
  updateRewardSchema,
  createGoalSchema,
  contributeToGoalSchema,
  redeemRewardSchema,
} from "@/lib/validations/rewards"

// ============================================================
// PROJ-6: Belohnungssystem – Server Actions
// ============================================================

// Helper: get current user's profile with family + role info
async function getCurrentProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, family_id, role, display_name, points_balance")
    .eq("id", user.id)
    .single()

  return profile
}

// ============================================================
// Types
// ============================================================

export type ChildPointsSummary = {
  id: string
  displayName: string
  pointsBalance: number
  role: string
}

export type PointsTransaction = {
  id: string
  profileId: string
  amount: number
  type: "task_completion" | "manual_add" | "manual_deduct" | "reward_redemption" | "goal_contribution"
  taskId: string | null
  taskTitle: string | null
  comment: string | null
  createdByName: string | null
  createdAt: string
}

export type LeaderboardMember = {
  id: string
  displayName: string
  role: string
  pointsBalance: number
  avatarUrl: string | null
}

export type Reward = {
  id: string
  familyId: string
  title: string
  description: string | null
  iconEmoji: string
  pointsCost: number
  isActive: boolean
  createdBy: string
  createdAt: string
}

export type RewardRedemption = {
  id: string
  rewardId: string
  redeemedBy: string
  pointsSpent: number
  createdAt: string
}

export type Achievement = {
  id: string
  slug: string
  title: string
  description: string | null
  icon: string
  criteriaType: string
  criteriaValue: Record<string, unknown>
  earned: boolean
  earnedAt: string | null
}

export type FamilyGoal = {
  id: string
  familyId: string
  title: string
  description: string | null
  emoji: string | null
  targetPoints: number
  collectedPoints: number
  status: "active" | "completed" | "cancelled"
  createdBy: string
  createdAt: string
  completedAt: string | null
}

export type GoalContribution = {
  id: string
  goalId: string
  contributedBy: string
  contributedByName: string | null
  amount: number
  createdAt: string
}

// ============================================================
// getRewardsOverviewAction (existing)
// ============================================================

export async function getRewardsOverviewAction(): Promise<
  { children: ChildPointsSummary[] } | { error: string }
> {
  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehoerst keiner Familie an." }

  const supabase = await createClient()

  // Fetch all children in the family with their points balance
  const { data: children, error: childError } = await supabase
    .from("profiles")
    .select("id, display_name, points_balance, role")
    .eq("family_id", profile.family_id)
    .eq("role", "child")
    .order("display_name")

  if (childError) {
    return { error: "Punkte-Uebersicht konnte nicht geladen werden." }
  }

  return {
    children: (children || []).map((c) => ({
      id: c.id,
      displayName: c.display_name || "Kind",
      pointsBalance: c.points_balance ?? 0,
      role: c.role || "child",
    })),
  }
}

// ============================================================
// getPointsHistoryAction (existing)
// ============================================================

export async function getPointsHistoryAction(
  profileId: string
): Promise<{ transactions: PointsTransaction[] } | { error: string }> {
  if (!profileId || typeof profileId !== "string") {
    return { error: "Ungueltige Profil-ID." }
  }

  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehoerst keiner Familie an." }

  // Children can only see their own history
  if (profile.role === "child" && profileId !== profile.id) {
    return { error: "Du kannst nur deine eigene Punktehistorie einsehen." }
  }

  const supabase = await createClient()

  // Verify target belongs to same family
  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("id, family_id")
    .eq("id", profileId)
    .eq("family_id", profile.family_id)
    .single()

  if (!targetProfile) {
    return { error: "Profil nicht gefunden oder nicht in deiner Familie." }
  }

  // Fetch transactions with task title and creator name via joins
  const { data: rawTransactions, error: txError } = await supabase
    .from("points_transactions")
    .select(
      `
      id,
      profile_id,
      amount,
      type,
      task_id,
      task:task_id (
        title
      ),
      comment,
      creator:created_by (
        display_name
      ),
      created_at
    `
    )
    .eq("profile_id", profileId)
    .eq("family_id", profile.family_id)
    .order("created_at", { ascending: false })
    .limit(200)

  if (txError) {
    return { error: "Punktehistorie konnte nicht geladen werden." }
  }

  const transactions: PointsTransaction[] = (rawTransactions || []).map((tx) => ({
    id: tx.id,
    profileId: tx.profile_id,
    amount: tx.amount,
    type: tx.type as PointsTransaction["type"],
    taskId: tx.task_id,
    taskTitle: (() => {
      const t = tx.task as unknown
      if (Array.isArray(t)) return (t[0] as { title: string } | undefined)?.title || null
      return (t as { title: string } | null)?.title || null
    })(),
    comment: tx.comment,
    createdByName: (() => {
      const c = tx.creator as unknown
      if (Array.isArray(c)) return (c[0] as { display_name: string | null } | undefined)?.display_name || null
      return (c as { display_name: string | null } | null)?.display_name || null
    })(),
    createdAt: tx.created_at,
  }))

  return { transactions }
}

// ============================================================
// manualPointsAction (existing)
// ============================================================

export type ManualPointsResult = {
  newBalance: number
  amountApplied: number
  type: string
}

export async function manualPointsAction(
  profileId: string,
  amount: number,
  comment?: string
): Promise<ManualPointsResult | { error: string }> {
  const parsed = manualPointsSchema.safeParse({ profileId, amount, comment })
  if (!parsed.success) {
    return { error: "Ungueltige Eingaben." }
  }

  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehoerst keiner Familie an." }
  if (!["adult", "admin"].includes(profile.role ?? "")) {
    return { error: "Nur Erwachsene und Admins duerfen Punkte manuell buchen." }
  }

  const supabase = await createClient()

  // Call the atomic RPC function
  const { data, error } = await supabase.rpc("manual_points_booking", {
    p_profile_id: parsed.data.profileId,
    p_amount: parsed.data.amount,
    p_comment: parsed.data.comment || null,
  })

  if (error) {
    if (error.message.includes("different family")) {
      return { error: "Nicht berechtigt – anderes Familienmitglied." }
    }
    if (error.message.includes("Amount must not be zero")) {
      return { error: "Betrag darf nicht 0 sein." }
    }
    return { error: "Punkte konnten nicht gebucht werden." }
  }

  const result = data as {
    new_balance: number
    amount_applied: number
    type: string
  }

  return {
    newBalance: result.new_balance,
    amountApplied: result.amount_applied,
    type: result.type,
  }
}

// ============================================================
// getFamilyLeaderboardAction (NEW)
// ============================================================

export async function getFamilyLeaderboardAction(): Promise<
  { members: LeaderboardMember[] } | { error: string }
> {
  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehoerst keiner Familie an." }

  const supabase = await createClient()

  const { data: members, error: membersError } = await supabase
    .from("profiles")
    .select("id, display_name, role, points_balance, avatar_url")
    .eq("family_id", profile.family_id)
    .order("points_balance", { ascending: false })

  if (membersError) {
    return { error: "Leaderboard konnte nicht geladen werden." }
  }

  return {
    members: (members || []).map((m) => ({
      id: m.id,
      displayName: m.display_name || "Mitglied",
      role: m.role || "child",
      pointsBalance: m.points_balance ?? 0,
      avatarUrl: (m as Record<string, unknown>).avatar_url as string | null,
    })),
  }
}

// ============================================================
// getRewardShopAction (NEW)
// ============================================================

export async function getRewardShopAction(): Promise<
  { rewards: Reward[]; userBalance: number; isAdultOrAdmin: boolean } | { error: string }
> {
  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehoerst keiner Familie an." }

  const isAdultOrAdmin = ["adult", "admin"].includes(profile.role ?? "")
  const supabase = await createClient()

  let query = supabase
    .from("family_rewards")
    .select("*")
    .eq("family_id", profile.family_id)
    .order("points_cost", { ascending: true })

  // Children only see active rewards; adults see all (to re-activate)
  if (!isAdultOrAdmin) {
    query = query.eq("is_active", true)
  }

  const { data: rewards, error: rewardsError } = await query

  if (rewardsError) {
    return { error: "Belohnungen konnten nicht geladen werden." }
  }

  return {
    rewards: (rewards || []).map((r) => ({
      id: r.id,
      familyId: r.family_id,
      title: r.title,
      description: r.description,
      iconEmoji: r.icon_emoji,
      pointsCost: r.points_cost,
      isActive: r.is_active,
      createdBy: r.created_by,
      createdAt: r.created_at,
    })),
    userBalance: profile.points_balance ?? 0,
    isAdultOrAdmin,
  }
}

// ============================================================
// createRewardAction (NEW)
// ============================================================

export async function createRewardAction(data: {
  title: string
  description?: string
  iconEmoji: string
  pointsCost: number
}): Promise<{ reward: { id: string } } | { error: string }> {
  const parsed = createRewardSchema.safeParse(data)
  if (!parsed.success) {
    return { error: "Ungueltige Eingaben: " + parsed.error.issues.map((i) => i.message).join(", ") }
  }

  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehoerst keiner Familie an." }
  if (!["adult", "admin"].includes(profile.role ?? "")) {
    return { error: "Nur Erwachsene und Admins duerfen Belohnungen anlegen." }
  }

  const supabase = await createClient()

  const { data: reward, error: insertError } = await supabase
    .from("family_rewards")
    .insert({
      family_id: profile.family_id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      icon_emoji: parsed.data.iconEmoji,
      points_cost: parsed.data.pointsCost,
      created_by: profile.id,
    })
    .select("id")
    .single()

  if (insertError || !reward) {
    return { error: "Belohnung konnte nicht erstellt werden." }
  }

  return { reward: { id: reward.id } }
}

// ============================================================
// updateRewardAction (NEW)
// ============================================================

export async function updateRewardAction(
  id: string,
  data: {
    title?: string
    description?: string
    iconEmoji?: string
    pointsCost?: number
    isActive?: boolean
  }
): Promise<{ success: true } | { error: string }> {
  if (!id || typeof id !== "string") {
    return { error: "Ungueltige Belohnungs-ID." }
  }

  const parsed = updateRewardSchema.safeParse(data)
  if (!parsed.success) {
    return { error: "Ungueltige Eingaben: " + parsed.error.issues.map((i) => i.message).join(", ") }
  }

  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehoerst keiner Familie an." }
  if (!["adult", "admin"].includes(profile.role ?? "")) {
    return { error: "Nur Erwachsene und Admins duerfen Belohnungen bearbeiten." }
  }

  const supabase = await createClient()

  // Verify reward belongs to caller's family
  const { data: existing } = await supabase
    .from("family_rewards")
    .select("id, family_id")
    .eq("id", id)
    .eq("family_id", profile.family_id)
    .single()

  if (!existing) {
    return { error: "Belohnung nicht gefunden." }
  }

  // Build update payload (only set fields that were provided)
  const updatePayload: Record<string, unknown> = {}
  if (parsed.data.title !== undefined) updatePayload.title = parsed.data.title
  if (parsed.data.description !== undefined) updatePayload.description = parsed.data.description || null
  if (parsed.data.iconEmoji !== undefined) updatePayload.icon_emoji = parsed.data.iconEmoji
  if (parsed.data.pointsCost !== undefined) updatePayload.points_cost = parsed.data.pointsCost
  if (parsed.data.isActive !== undefined) updatePayload.is_active = parsed.data.isActive

  if (Object.keys(updatePayload).length === 0) {
    return { error: "Keine Aenderungen angegeben." }
  }

  const { error: updateError } = await supabase
    .from("family_rewards")
    .update(updatePayload)
    .eq("id", id)

  if (updateError) {
    return { error: "Belohnung konnte nicht aktualisiert werden." }
  }

  return { success: true }
}

// ============================================================
// redeemRewardAction (NEW)
// ============================================================

export type RedeemRewardResult = {
  newBalance: number
  rewardTitle: string
  pointsSpent: number
}

export async function redeemRewardAction(
  rewardId: string
): Promise<RedeemRewardResult | { error: string }> {
  const parsed = redeemRewardSchema.safeParse({ rewardId })
  if (!parsed.success) {
    return { error: "Ungueltige Belohnungs-ID." }
  }

  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehoerst keiner Familie an." }

  const supabase = await createClient()

  const { data, error } = await supabase.rpc("redeem_reward", {
    p_reward_id: parsed.data.rewardId,
  })

  if (error) {
    if (error.message.includes("Insufficient points")) {
      return { error: "Nicht genuegend Punkte." }
    }
    if (error.message.includes("not active")) {
      return { error: "Diese Belohnung ist nicht mehr verfuegbar." }
    }
    if (error.message.includes("different family")) {
      return { error: "Nicht berechtigt." }
    }
    if (error.message.includes("not found")) {
      return { error: "Belohnung nicht gefunden." }
    }
    return { error: "Belohnung konnte nicht eingeloest werden." }
  }

  const result = data as {
    new_balance: number
    reward_title: string
    points_spent: number
  }

  return {
    newBalance: result.new_balance,
    rewardTitle: result.reward_title,
    pointsSpent: result.points_spent,
  }
}

// ============================================================
// getAchievementsAction (NEW)
// ============================================================

export async function getAchievementsAction(): Promise<
  { achievements: Achievement[] } | { error: string }
> {
  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }

  const supabase = await createClient()

  // Fetch all achievements
  const { data: allAchievements, error: achError } = await supabase
    .from("achievements")
    .select("*")
    .order("title")

  if (achError) {
    return { error: "Abzeichen konnten nicht geladen werden." }
  }

  // Fetch earned achievements for this user
  const { data: earnedAchievements } = await supabase
    .from("profile_achievements")
    .select("achievement_id, earned_at")
    .eq("profile_id", profile.id)

  const earnedMap = new Map(
    (earnedAchievements || []).map((ea) => [ea.achievement_id, ea.earned_at])
  )

  return {
    achievements: (allAchievements || []).map((a) => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      description: a.description,
      icon: a.icon,
      criteriaType: a.criteria_type,
      criteriaValue: a.criteria_value as Record<string, unknown>,
      earned: earnedMap.has(a.id),
      earnedAt: earnedMap.get(a.id) || null,
    })),
  }
}

// ============================================================
// checkAndAwardAchievementsAction (NEW – internal use)
// ============================================================

export async function checkAndAwardAchievementsAction(
  profileId: string
): Promise<{ awarded: string[] } | { error: string }> {
  if (!profileId || typeof profileId !== "string") {
    return { error: "Ungueltige Profil-ID." }
  }

  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehoerst keiner Familie an." }

  const supabase = await createClient()

  // Get the target profile's family to verify same family
  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("id, family_id")
    .eq("id", profileId)
    .eq("family_id", profile.family_id)
    .single()

  if (!targetProfile) {
    return { error: "Profil nicht gefunden oder nicht in deiner Familie." }
  }

  // Fetch all achievements
  const { data: allAchievements, error: achError } = await supabase
    .from("achievements")
    .select("*")

  if (achError || !allAchievements) {
    return { error: "Abzeichen konnten nicht geladen werden." }
  }

  // Fetch already earned achievements
  const { data: alreadyEarned } = await supabase
    .from("profile_achievements")
    .select("achievement_id")
    .eq("profile_id", profileId)

  const earnedIds = new Set((alreadyEarned || []).map((e) => e.achievement_id))

  // Fetch completed tasks for this profile
  const { data: completedTasks } = await supabase
    .from("tasks")
    .select("id, category, completed_at, status")
    .eq("assigned_to", profileId)
    .eq("status", "done")
    .eq("family_id", profile.family_id)

  const tasks = completedTasks || []
  const awarded: string[] = []

  for (const achievement of allAchievements) {
    // Skip if already earned
    if (earnedIds.has(achievement.id)) continue

    const criteria = achievement.criteria_value as Record<string, unknown>
    let criteriaMet = false

    switch (achievement.criteria_type) {
      case "task_count_by_category": {
        const category = criteria.category as string
        const count = criteria.count as number
        const matchingTasks = tasks.filter((t) => t.category === category)
        criteriaMet = matchingTasks.length >= count
        break
      }

      case "task_completed_before_hour": {
        const hour = criteria.hour as number
        const count = criteria.count as number
        const earlyTasks = tasks.filter((t) => {
          if (!t.completed_at) return false
          const completedDate = new Date(t.completed_at)
          return completedDate.getHours() < hour
        })
        criteriaMet = earlyTasks.length >= count
        break
      }

      case "tasks_per_week": {
        const count = criteria.count as number
        // Check if any week has >= count completed tasks
        const weekMap = new Map<string, number>()
        for (const t of tasks) {
          if (!t.completed_at) continue
          const d = new Date(t.completed_at)
          // ISO week key: year-week
          const startOfYear = new Date(d.getFullYear(), 0, 1)
          const weekNum = Math.ceil(
            ((d.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
          )
          const key = `${d.getFullYear()}-W${weekNum}`
          weekMap.set(key, (weekMap.get(key) || 0) + 1)
        }
        for (const weekCount of weekMap.values()) {
          if (weekCount >= count) {
            criteriaMet = true
            break
          }
        }
        break
      }
    }

    if (criteriaMet) {
      // Award the achievement
      const { error: insertError } = await supabase
        .from("profile_achievements")
        .insert({
          profile_id: profileId,
          achievement_id: achievement.id,
          family_id: profile.family_id,
        })

      if (!insertError) {
        awarded.push(achievement.slug)
      }
      // If it fails due to UNIQUE constraint, that's fine – already earned
    }
  }

  return { awarded }
}

// ============================================================
// getFamilyGoalAction (NEW)
// ============================================================

export async function getFamilyGoalAction(): Promise<
  { goal: FamilyGoal | null; contributions: GoalContribution[] } | { error: string }
> {
  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehoerst keiner Familie an." }

  const supabase = await createClient()

  // Fetch active goal for the family
  const { data: goals, error: goalError } = await supabase
    .from("family_goals")
    .select("*")
    .eq("family_id", profile.family_id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)

  if (goalError) {
    return { error: "Familienziel konnte nicht geladen werden." }
  }

  const goal = goals && goals.length > 0 ? goals[0] : null

  if (!goal) {
    return { goal: null, contributions: [] }
  }

  // Fetch contributions for this goal with contributor names
  const { data: rawContributions, error: contribError } = await supabase
    .from("goal_contributions")
    .select(
      `
      id,
      goal_id,
      contributed_by,
      contributor:contributed_by (
        display_name
      ),
      amount,
      created_at
    `
    )
    .eq("goal_id", goal.id)
    .order("created_at", { ascending: false })
    .limit(50)

  if (contribError) {
    return { error: "Beitraege konnten nicht geladen werden." }
  }

  return {
    goal: {
      id: goal.id,
      familyId: goal.family_id,
      title: goal.title,
      description: goal.description,
      emoji: goal.emoji,
      targetPoints: goal.target_points,
      collectedPoints: goal.collected_points,
      status: goal.status as "active" | "completed" | "cancelled",
      createdBy: goal.created_by,
      createdAt: goal.created_at,
      completedAt: goal.completed_at,
    },
    contributions: (rawContributions || []).map((c) => ({
      id: c.id,
      goalId: c.goal_id,
      contributedBy: c.contributed_by,
      contributedByName: (() => {
        const contrib = c.contributor as unknown
        if (Array.isArray(contrib))
          return (contrib[0] as { display_name: string | null } | undefined)?.display_name || null
        return (contrib as { display_name: string | null } | null)?.display_name || null
      })(),
      amount: c.amount,
      createdAt: c.created_at,
    })),
  }
}

// ============================================================
// getCompletedGoalsAction (NEW)
// ============================================================

export async function getCompletedGoalsAction(): Promise<
  { goals: FamilyGoal[] } | { error: string }
> {
  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehoerst keiner Familie an." }

  const supabase = await createClient()

  const { data: goals, error: goalsError } = await supabase
    .from("family_goals")
    .select("*")
    .eq("family_id", profile.family_id)
    .in("status", ["completed", "cancelled"])
    .order("completed_at", { ascending: false })
    .limit(10)

  if (goalsError) {
    return { error: "Vergangene Ziele konnten nicht geladen werden." }
  }

  return {
    goals: (goals || []).map((g) => ({
      id: g.id,
      familyId: g.family_id,
      title: g.title,
      description: g.description,
      emoji: g.emoji,
      targetPoints: g.target_points,
      collectedPoints: g.collected_points,
      status: g.status as "active" | "completed" | "cancelled",
      createdBy: g.created_by,
      createdAt: g.created_at,
      completedAt: g.completed_at,
    })),
  }
}

// ============================================================
// createFamilyGoalAction (NEW)
// ============================================================

export async function createFamilyGoalAction(data: {
  title: string
  description?: string
  emoji?: string
  targetPoints: number
}): Promise<{ goal: { id: string } } | { error: string }> {
  const parsed = createGoalSchema.safeParse(data)
  if (!parsed.success) {
    return { error: "Ungueltige Eingaben: " + parsed.error.issues.map((i) => i.message).join(", ") }
  }

  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehoerst keiner Familie an." }
  if (!["adult", "admin"].includes(profile.role ?? "")) {
    return { error: "Nur Erwachsene und Admins duerfen Familienziele anlegen." }
  }

  const supabase = await createClient()

  // Check no other active goal exists
  const { data: existingGoals } = await supabase
    .from("family_goals")
    .select("id")
    .eq("family_id", profile.family_id)
    .eq("status", "active")
    .limit(1)

  if (existingGoals && existingGoals.length > 0) {
    return { error: "Es gibt bereits ein aktives Familienziel. Bitte schliesse es zuerst ab." }
  }

  const { data: goal, error: insertError } = await supabase
    .from("family_goals")
    .insert({
      family_id: profile.family_id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      emoji: parsed.data.emoji || null,
      target_points: parsed.data.targetPoints,
      created_by: profile.id,
    })
    .select("id")
    .single()

  if (insertError || !goal) {
    return { error: "Familienziel konnte nicht erstellt werden." }
  }

  return { goal: { id: goal.id } }
}

// ============================================================
// contributeToGoalAction (NEW)
// ============================================================

export type ContributeToGoalResult = {
  newBalance: number
  amountContributed: number
  goalCompleted: boolean
}

export async function contributeToGoalAction(
  goalId: string,
  amount: number
): Promise<ContributeToGoalResult | { error: string }> {
  const parsed = contributeToGoalSchema.safeParse({ goalId, amount })
  if (!parsed.success) {
    return { error: "Ungueltige Eingaben: " + parsed.error.issues.map((i) => i.message).join(", ") }
  }

  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehoerst keiner Familie an." }

  const supabase = await createClient()

  const { data, error } = await supabase.rpc("contribute_to_goal", {
    p_goal_id: parsed.data.goalId,
    p_amount: parsed.data.amount,
  })

  if (error) {
    if (error.message.includes("not active")) {
      return { error: "Dieses Ziel ist nicht mehr aktiv." }
    }
    if (error.message.includes("No points available")) {
      return { error: "Keine Punkte verfuegbar zum Beisteuern." }
    }
    if (error.message.includes("different family")) {
      return { error: "Nicht berechtigt." }
    }
    if (error.message.includes("not found")) {
      return { error: "Familienziel nicht gefunden." }
    }
    return { error: "Punkte konnten nicht beigesteuert werden." }
  }

  const result = data as {
    new_balance: number
    amount_contributed: number
    goal_completed: boolean
  }

  return {
    newBalance: result.new_balance,
    amountContributed: result.amount_contributed,
    goalCompleted: result.goal_completed,
  }
}

// ============================================================
// completeFamilyGoalAction (NEW)
// ============================================================

export async function completeFamilyGoalAction(
  goalId: string
): Promise<{ success: true } | { error: string }> {
  if (!goalId || typeof goalId !== "string") {
    return { error: "Ungueltige Ziel-ID." }
  }

  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehoerst keiner Familie an." }
  if (!["adult", "admin"].includes(profile.role ?? "")) {
    return { error: "Nur Erwachsene und Admins duerfen Familienziele abschliessen." }
  }

  const supabase = await createClient()

  // Verify goal belongs to caller's family
  const { data: existing } = await supabase
    .from("family_goals")
    .select("id, family_id, status")
    .eq("id", goalId)
    .eq("family_id", profile.family_id)
    .single()

  if (!existing) {
    return { error: "Familienziel nicht gefunden." }
  }

  if (existing.status === "completed") {
    return { error: "Dieses Ziel ist bereits abgeschlossen." }
  }

  const { error: updateError } = await supabase
    .from("family_goals")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", goalId)

  if (updateError) {
    return { error: "Familienziel konnte nicht abgeschlossen werden." }
  }

  return { success: true }
}
