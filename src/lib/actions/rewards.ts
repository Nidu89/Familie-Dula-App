"use server"

import { createClient } from "@/lib/supabase/server"
import { checkRateLimit, getIP } from "@/lib/rate-limit"
import { manualPointsSchema } from "@/lib/validations/tasks"
import {
  createRewardSchema,
  updateRewardSchema,
  createGoalSchema,
  contributeToGoalSchema,
  redeemRewardSchema,
  createJarSchema,
  updateJarSchema,
  allocatePointsSchema,
  type JarType,
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
  type: "task_completion" | "manual_add" | "manual_deduct" | "reward_redemption" | "goal_contribution" | "ritual_completion"
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

  const ip = await getIP()
  if (!checkRateLimit(`manualPoints:${ip}`, 30, 60 * 60 * 1000)) {
    return { error: "Zu viele Anfragen. Bitte versuche es spaeter erneut." }
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

  const ip = await getIP()
  if (!checkRateLimit(`redeemReward:${ip}`, 30, 60 * 60 * 1000)) {
    return { error: "Zu viele Anfragen. Bitte versuche es spaeter erneut." }
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

  // Fetch achievements, earned status, and completed tasks in parallel
  const [
    { data: allAchievements, error: achError },
    { data: alreadyEarned },
    { data: completedTasks },
  ] = await Promise.all([
    supabase.from("achievements").select("*"),
    supabase
      .from("profile_achievements")
      .select("achievement_id")
      .eq("profile_id", profileId),
    supabase
      .from("tasks")
      .select("id, category, completed_at, status")
      .eq("assigned_to", profileId)
      .eq("status", "done")
      .eq("family_id", profile.family_id),
  ])

  if (achError || !allAchievements) {
    return { error: "Abzeichen konnten nicht geladen werden." }
  }

  const earnedIds = new Set((alreadyEarned || []).map((e) => e.achievement_id))
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

// ============================================================
// PROJ-24: Savings Jars (Taschengeld-Toepfe)
// ============================================================

// Types

export type SavingsJar = {
  id: string
  profileId: string
  familyId: string
  name: string
  jarType: JarType
  targetAmount: number
  currentAmount: number
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type JarTransaction = {
  id: string
  jarId: string
  amount: number
  sourceType: "task" | "manual" | "refund"
  sourceId: string | null
  createdAt: string
}

// ============================================================
// getJarsForChildAction
// ============================================================

export async function getJarsForChildAction(
  childProfileId: string
): Promise<{ jars: SavingsJar[]; unallocatedPoints: number } | { error: string }> {
  if (!childProfileId || typeof childProfileId !== "string") {
    return { error: "Ungueltige Profil-ID." }
  }

  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehoerst keiner Familie an." }

  // Children can only see their own jars
  if (profile.role === "child" && childProfileId !== profile.id) {
    return { error: "Du kannst nur deine eigenen Toepfe sehen." }
  }

  const supabase = await createClient()

  // Verify target belongs to same family
  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("id, family_id, points_balance")
    .eq("id", childProfileId)
    .eq("family_id", profile.family_id)
    .single()

  if (!targetProfile) {
    return { error: "Profil nicht gefunden oder nicht in deiner Familie." }
  }

  const { data: jars, error: jarsError } = await supabase
    .from("savings_jars")
    .select("*")
    .eq("profile_id", childProfileId)
    .eq("family_id", profile.family_id)
    .order("sort_order", { ascending: true })

  if (jarsError) {
    return { error: "Toepfe konnten nicht geladen werden." }
  }

  // Calculate unallocated: total points balance - sum of all jar amounts
  const totalInJars = (jars || []).reduce((sum, j) => sum + (j.current_amount ?? 0), 0)
  const unallocatedPoints = Math.max(0, (targetProfile.points_balance ?? 0) - totalInJars)

  return {
    jars: (jars || []).map((j) => ({
      id: j.id,
      profileId: j.profile_id,
      familyId: j.family_id,
      name: j.name,
      jarType: j.jar_type as JarType,
      targetAmount: j.target_amount ?? 0,
      currentAmount: j.current_amount ?? 0,
      sortOrder: j.sort_order ?? 0,
      createdAt: j.created_at,
      updatedAt: j.updated_at,
    })),
    unallocatedPoints,
  }
}

// ============================================================
// createJarAction
// ============================================================

export async function createJarAction(data: {
  profileId: string
  name: string
  jarType: JarType
  targetAmount: number
}): Promise<{ jar: { id: string } } | { error: string }> {
  const parsed = createJarSchema.safeParse(data)
  if (!parsed.success) {
    return { error: "Ungueltige Eingaben: " + parsed.error.issues.map((i) => i.message).join(", ") }
  }

  const ip = await getIP()
  if (!checkRateLimit(`createJar:${ip}`, 30, 60 * 60 * 1000)) {
    return { error: "Zu viele Anfragen. Bitte versuche es spaeter erneut." }
  }

  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehoerst keiner Familie an." }
  if (!["adult", "admin"].includes(profile.role ?? "")) {
    return { error: "Nur Erwachsene und Admins duerfen Toepfe anlegen." }
  }

  const supabase = await createClient()

  // Verify child belongs to same family
  const { data: childProfile } = await supabase
    .from("profiles")
    .select("id, family_id")
    .eq("id", parsed.data.profileId)
    .eq("family_id", profile.family_id)
    .single()

  if (!childProfile) {
    return { error: "Kind nicht gefunden oder nicht in deiner Familie." }
  }

  // Get current max sort_order for this child's jars
  const { data: existingJars } = await supabase
    .from("savings_jars")
    .select("sort_order")
    .eq("profile_id", parsed.data.profileId)
    .order("sort_order", { ascending: false })
    .limit(1)

  const nextSortOrder = existingJars && existingJars.length > 0
    ? (existingJars[0].sort_order ?? 0) + 1
    : 0

  const { data: jar, error: insertError } = await supabase
    .from("savings_jars")
    .insert({
      profile_id: parsed.data.profileId,
      family_id: profile.family_id,
      name: parsed.data.name,
      jar_type: parsed.data.jarType,
      target_amount: parsed.data.targetAmount,
      current_amount: 0,
      sort_order: nextSortOrder,
    })
    .select("id")
    .single()

  if (insertError || !jar) {
    return { error: "Topf konnte nicht erstellt werden." }
  }

  return { jar: { id: jar.id } }
}

// ============================================================
// updateJarAction
// ============================================================

export async function updateJarAction(
  jarId: string,
  data: {
    name?: string
    jarType?: JarType
    targetAmount?: number
  }
): Promise<{ success: true } | { error: string }> {
  if (!jarId || typeof jarId !== "string") {
    return { error: "Ungueltige Topf-ID." }
  }

  const parsed = updateJarSchema.safeParse(data)
  if (!parsed.success) {
    return { error: "Ungueltige Eingaben: " + parsed.error.issues.map((i) => i.message).join(", ") }
  }

  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehoerst keiner Familie an." }
  if (!["adult", "admin"].includes(profile.role ?? "")) {
    return { error: "Nur Erwachsene und Admins duerfen Toepfe bearbeiten." }
  }

  const supabase = await createClient()

  // Verify jar belongs to caller's family
  const { data: existing } = await supabase
    .from("savings_jars")
    .select("id, family_id")
    .eq("id", jarId)
    .eq("family_id", profile.family_id)
    .single()

  if (!existing) {
    return { error: "Topf nicht gefunden." }
  }

  const updatePayload: Record<string, unknown> = {}
  if (parsed.data.name !== undefined) updatePayload.name = parsed.data.name
  if (parsed.data.jarType !== undefined) updatePayload.jar_type = parsed.data.jarType
  if (parsed.data.targetAmount !== undefined) updatePayload.target_amount = parsed.data.targetAmount
  updatePayload.updated_at = new Date().toISOString()

  if (Object.keys(updatePayload).length <= 1) {
    return { error: "Keine Aenderungen angegeben." }
  }

  const { error: updateError } = await supabase
    .from("savings_jars")
    .update(updatePayload)
    .eq("id", jarId)

  if (updateError) {
    return { error: "Topf konnte nicht aktualisiert werden." }
  }

  return { success: true }
}

// ============================================================
// deleteJarAction
// ============================================================

export async function deleteJarAction(
  jarId: string
): Promise<{ success: true; refundedAmount: number } | { error: string }> {
  if (!jarId || typeof jarId !== "string") {
    return { error: "Ungueltige Topf-ID." }
  }

  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehoerst keiner Familie an." }
  if (!["adult", "admin"].includes(profile.role ?? "")) {
    return { error: "Nur Erwachsene und Admins duerfen Toepfe loeschen." }
  }

  const supabase = await createClient()

  // Fetch the jar to get current amount
  const { data: jar } = await supabase
    .from("savings_jars")
    .select("id, family_id, current_amount, profile_id")
    .eq("id", jarId)
    .eq("family_id", profile.family_id)
    .single()

  if (!jar) {
    return { error: "Topf nicht gefunden." }
  }

  const refundedAmount = jar.current_amount ?? 0

  // If the jar has points, create a refund transaction log entry
  if (refundedAmount > 0) {
    await supabase
      .from("jar_transactions")
      .insert({
        jar_id: jarId,
        amount: -refundedAmount,
        source_type: "refund",
        source_id: null,
      })
  }

  // Delete the jar (points return to unallocated automatically since
  // unallocated = points_balance - sum(jar.current_amount))
  const { error: deleteError } = await supabase
    .from("savings_jars")
    .delete()
    .eq("id", jarId)

  if (deleteError) {
    return { error: "Topf konnte nicht geloescht werden." }
  }

  return { success: true, refundedAmount }
}

// ============================================================
// allocatePointsToJarsAction
// ============================================================

export type AllocatePointsResult = {
  allocations: Array<{ jarId: string; amount: number; newAmount: number }>
}

export async function allocatePointsToJarsAction(
  allocations: Array<{ jarId: string; amount: number }>
): Promise<AllocatePointsResult | { error: string }> {
  const parsed = allocatePointsSchema.safeParse({ allocations })
  if (!parsed.success) {
    return { error: "Ungueltige Eingaben: " + parsed.error.issues.map((i) => i.message).join(", ") }
  }

  const ip = await getIP()
  if (!checkRateLimit(`allocatePoints:${ip}`, 60, 60 * 60 * 1000)) {
    return { error: "Zu viele Anfragen. Bitte versuche es spaeter erneut." }
  }

  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehoerst keiner Familie an." }

  const supabase = await createClient()

  // Filter out zero allocations
  const nonZeroAllocations = parsed.data.allocations.filter((a) => a.amount > 0)
  if (nonZeroAllocations.length === 0) {
    return { error: "Keine Punkte zum Verteilen." }
  }

  // Fetch all referenced jars
  const jarIds = nonZeroAllocations.map((a) => a.jarId)
  const { data: jars, error: jarsError } = await supabase
    .from("savings_jars")
    .select("id, profile_id, family_id, current_amount")
    .in("id", jarIds)
    .eq("family_id", profile.family_id)

  if (jarsError || !jars) {
    return { error: "Toepfe konnten nicht geladen werden." }
  }

  // Verify all jars belong to the current user (children allocate to own jars)
  // or the user is an adult/admin
  const isAdultOrAdmin = ["adult", "admin"].includes(profile.role ?? "")
  for (const jar of jars) {
    if (!isAdultOrAdmin && jar.profile_id !== profile.id) {
      return { error: "Du kannst nur in deine eigenen Toepfe einzahlen." }
    }
  }

  // Verify total allocation doesn't exceed unallocated points
  const jarOwner = jars[0].profile_id
  const { data: ownerProfile } = await supabase
    .from("profiles")
    .select("points_balance")
    .eq("id", jarOwner)
    .single()

  if (!ownerProfile) {
    return { error: "Profil nicht gefunden." }
  }

  // Get total in all jars for this child
  const { data: allJars } = await supabase
    .from("savings_jars")
    .select("current_amount")
    .eq("profile_id", jarOwner)
    .eq("family_id", profile.family_id)

  const totalInJars = (allJars || []).reduce((sum, j) => sum + (j.current_amount ?? 0), 0)
  const unallocated = Math.max(0, (ownerProfile.points_balance ?? 0) - totalInJars)
  const totalAllocating = nonZeroAllocations.reduce((sum, a) => sum + a.amount, 0)

  if (totalAllocating > unallocated) {
    return { error: "Nicht genuegend unverteilte Punkte." }
  }

  // Perform allocations
  const results: Array<{ jarId: string; amount: number; newAmount: number }> = []

  for (const allocation of nonZeroAllocations) {
    const jar = jars.find((j) => j.id === allocation.jarId)
    if (!jar) continue

    const newAmount = (jar.current_amount ?? 0) + allocation.amount

    // Update jar current_amount
    const { error: updateError } = await supabase
      .from("savings_jars")
      .update({
        current_amount: newAmount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", allocation.jarId)

    if (updateError) continue

    // Create transaction log
    await supabase
      .from("jar_transactions")
      .insert({
        jar_id: allocation.jarId,
        amount: allocation.amount,
        source_type: "task",
        source_id: null,
      })

    results.push({
      jarId: allocation.jarId,
      amount: allocation.amount,
      newAmount,
    })
  }

  return { allocations: results }
}

// ============================================================
// getJarHistoryAction
// ============================================================

export async function getJarHistoryAction(
  jarId: string
): Promise<{ transactions: JarTransaction[] } | { error: string }> {
  if (!jarId || typeof jarId !== "string") {
    return { error: "Ungueltige Topf-ID." }
  }

  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehoerst keiner Familie an." }

  const supabase = await createClient()

  // Verify jar belongs to caller's family
  const { data: jar } = await supabase
    .from("savings_jars")
    .select("id, family_id, profile_id")
    .eq("id", jarId)
    .eq("family_id", profile.family_id)
    .single()

  if (!jar) {
    return { error: "Topf nicht gefunden." }
  }

  // Children can only see their own jar history
  if (profile.role === "child" && jar.profile_id !== profile.id) {
    return { error: "Du kannst nur deine eigene Topf-Historie sehen." }
  }

  const { data: transactions, error: txError } = await supabase
    .from("jar_transactions")
    .select("*")
    .eq("jar_id", jarId)
    .order("created_at", { ascending: false })
    .limit(100)

  if (txError) {
    return { error: "Topf-Historie konnte nicht geladen werden." }
  }

  return {
    transactions: (transactions || []).map((tx) => ({
      id: tx.id,
      jarId: tx.jar_id,
      amount: tx.amount,
      sourceType: tx.source_type as "task" | "manual" | "refund",
      sourceId: tx.source_id,
      createdAt: tx.created_at,
    })),
  }
}

// ============================================================
// getJarsSummaryForDashboardAction
// ============================================================

export type JarsSummaryChild = {
  id: string
  displayName: string
  pointsBalance: number
  totalInJars: number
  unallocatedPoints: number
  jars: Array<{
    id: string
    name: string
    jarType: JarType
    currentAmount: number
    targetAmount: number
  }>
}

// ============================================================
// reorderJarsAction
// ============================================================

export async function reorderJarsAction(
  jarIds: string[]
): Promise<{ success: true } | { error: string }> {
  if (!Array.isArray(jarIds) || jarIds.length === 0) {
    return { error: "Keine Toepfe zum Sortieren." }
  }
  if (jarIds.some((id) => typeof id !== "string" || !id)) {
    return { error: "Ungueltige Topf-IDs." }
  }

  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehoerst keiner Familie an." }
  if (!["adult", "admin"].includes(profile.role ?? "")) {
    return { error: "Nur Erwachsene und Admins duerfen Toepfe umsortieren." }
  }

  const supabase = await createClient()

  const { error: rpcError } = await supabase.rpc("reorder_jars", {
    p_jar_ids: jarIds,
  })

  if (rpcError) {
    return { error: "Toepfe konnten nicht umsortiert werden." }
  }

  return { success: true }
}

// ============================================================
// getJarsSummaryForDashboardAction
// ============================================================

export async function getJarsSummaryForDashboardAction(): Promise<
  { children: JarsSummaryChild[] } | { error: string }
> {
  const profile = await getCurrentProfile()
  if (!profile) return { error: "Nicht angemeldet." }
  if (!profile.family_id) return { error: "Du gehoerst keiner Familie an." }

  const supabase = await createClient()

  // Fetch all children in the family
  const { data: children, error: childError } = await supabase
    .from("profiles")
    .select("id, display_name, points_balance, role")
    .eq("family_id", profile.family_id)
    .eq("role", "child")
    .order("display_name")

  if (childError) {
    return { error: "Kinder konnten nicht geladen werden." }
  }

  if (!children || children.length === 0) {
    return { children: [] }
  }

  // Fetch all jars for all children in the family
  const childIds = children.map((c) => c.id)
  const { data: allJars, error: jarsError } = await supabase
    .from("savings_jars")
    .select("id, profile_id, name, jar_type, current_amount, target_amount, sort_order")
    .in("profile_id", childIds)
    .eq("family_id", profile.family_id)
    .order("sort_order", { ascending: true })

  if (jarsError) {
    return { error: "Toepfe konnten nicht geladen werden." }
  }

  // Group jars by child
  const jarsByChild = new Map<string, typeof allJars>()
  for (const jar of allJars || []) {
    const existing = jarsByChild.get(jar.profile_id) || []
    existing.push(jar)
    jarsByChild.set(jar.profile_id, existing)
  }

  return {
    children: children.map((c) => {
      const childJars = jarsByChild.get(c.id) || []
      const totalInJars = childJars.reduce((sum, j) => sum + (j.current_amount ?? 0), 0)
      return {
        id: c.id,
        displayName: c.display_name || "Kind",
        pointsBalance: c.points_balance ?? 0,
        totalInJars,
        unallocatedPoints: Math.max(0, (c.points_balance ?? 0) - totalInJars),
        jars: childJars.map((j) => ({
          id: j.id,
          name: j.name,
          jarType: j.jar_type as JarType,
          currentAmount: j.current_amount ?? 0,
          targetAmount: j.target_amount ?? 0,
        })),
      }
    }),
  }
}
