/**
 * Server-side error codes returned to client components.
 * Each code maps to an i18n key under the "errors" namespace.
 *
 * Usage in server actions:
 *   return { error: E.AUTH_NOT_LOGGED_IN }
 *
 * Usage in client components:
 *   const te = useTranslations("errors")
 *   toast({ description: te(result.error) })
 */
export const E = {
  // ── Auth ────────────────────────────────────────────────
  AUTH_NOT_LOGGED_IN: "auth.notLoggedIn",
  AUTH_NO_FAMILY: "auth.noFamily",
  AUTH_INVALID_INPUT: "auth.invalidInput",
  AUTH_RATE_LIMITED: "auth.rateLimited",
  AUTH_RATE_LIMITED_SHORT: "auth.rateLimitedShort",
  AUTH_UNKNOWN: "auth.unknown",
  AUTH_LOGIN_FAILED: "auth.loginFailed",
  AUTH_LOGIN_RATE_LIMITED: "auth.loginRateLimited",
  AUTH_REGISTER_RATE_LIMITED: "auth.registerRateLimited",
  AUTH_EMAIL_EXISTS: "auth.emailExists",
  AUTH_EMAIL_RATE_LIMITED: "auth.emailRateLimited",
  AUTH_REGISTER_FAILED: "auth.registerFailed",
  AUTH_INVALID_EMAIL: "auth.invalidEmail",
  AUTH_GENERIC_ERROR: "auth.genericError",
  AUTH_EMAIL_SEND_FAILED: "auth.emailSendFailed",

  // ── Permissions ────────────────────────────────────────
  PERM_DENIED: "perm.denied",
  PERM_ADMIN_ONLY: "perm.adminOnly",
  PERM_ADULT_REQUIRED: "perm.adultRequired",
  PERM_DELETE_DENIED: "perm.deleteDenied",
  PERM_OTHER_FAMILY_MEMBER: "perm.otherFamilyMember",
  PERM_OWN_HISTORY_ONLY: "perm.ownHistoryOnly",
  PERM_OWN_JARS_ONLY: "perm.ownJarsOnly",
  PERM_ACCESS_DENIED: "perm.accessDenied",

  // ── Validation ─────────────────────────────────────────
  VAL_INVALID: "val.invalid",
  VAL_INVALID_ID: "val.invalidId",
  VAL_INVALID_FILTER: "val.invalidFilter",
  VAL_INVALID_EMAIL: "val.invalidEmail",
  VAL_INVALID_CODE: "val.invalidCode",
  VAL_INVALID_LANGUAGE: "val.invalidLanguage",
  VAL_INVALID_WEEK: "val.invalidWeek",
  VAL_FILE_TOO_LARGE: "val.fileTooLarge",
  VAL_FILE_INVALID_TYPE: "val.fileInvalidType",
  VAL_NO_FILE: "val.noFile",
  VAL_NO_CHANGES: "val.noChanges",
  VAL_QUOTE_TOO_LONG: "val.quoteTooLong",

  // ── Rate Limiting ──────────────────────────────────────
  RATE_LIMITED: "rate.limited",
  RATE_LIMITED_SHORT: "rate.limitedShort",
  RATE_SYNC_LIMITED: "rate.syncLimited",
  RATE_UPLOAD_LIMITED: "rate.uploadLimited",
  RATE_INVITE_LIMITED: "rate.inviteLimited",
  RATE_JOIN_LIMITED: "rate.joinLimited",

  // ── Family ─────────────────────────────────────────────
  FAMILY_NOT_FOUND: "family.notFound",
  FAMILY_ALREADY_MEMBER: "family.alreadyMember",
  FAMILY_CREATE_FAILED: "family.createFailed",
  FAMILY_INVITE_INVALID: "family.inviteInvalid",
  FAMILY_INVITE_EMAIL_FAILED: "family.inviteEmailFailed",
  FAMILY_INVITE_SAVE_FAILED: "family.inviteSaveFailed",
  FAMILY_CODE_DEACTIVATE_FAILED: "family.codeDeactivateFailed",
  FAMILY_CODE_CREATE_FAILED: "family.codeCreateFailed",
  FAMILY_NAME_UPDATE_FAILED: "family.nameUpdateFailed",
  FAMILY_ROLE_LAST_ADMIN: "family.roleLastAdmin",
  FAMILY_ROLE_UPDATE_FAILED: "family.roleUpdateFailed",
  FAMILY_REMOVE_SELF: "family.removeSelf",
  FAMILY_MEMBER_NOT_FOUND: "family.memberNotFound",
  FAMILY_MEMBER_LAST_ADMIN: "family.memberLastAdmin",
  FAMILY_MEMBER_REMOVE_FAILED: "family.memberRemoveFailed",
  FAMILY_LEAVE_FAILED: "family.leaveFailed",
  FAMILY_LANGUAGE_FAILED: "family.languageFailed",
  FAMILY_NO_FAMILY: "family.noFamily",
  FAMILY_QUOTE_ADMIN_ONLY: "family.quoteAdminOnly",
  FAMILY_QUOTE_SAVE_FAILED: "family.quoteSaveFailed",

  // ── Calendar ───────────────────────────────────────────
  CAL_LOAD_FAILED: "calendar.loadFailed",
  CAL_CREATE_FAILED: "calendar.createFailed",
  CAL_NOT_FOUND: "calendar.notFound",
  CAL_UPDATE_FAILED: "calendar.updateFailed",
  CAL_EXCEPTION_FAILED: "calendar.exceptionFailed",
  CAL_SERIES_UPDATE_FAILED: "calendar.seriesUpdateFailed",
  CAL_SERIES_CREATE_FAILED: "calendar.seriesCreateFailed",
  CAL_DELETE_FAILED: "calendar.deleteFailed",
  CAL_SERIES_DELETE_FAILED: "calendar.seriesDeleteFailed",

  // ── Calendar Integrations ──────────────────────────────
  CAL_INT_LOAD_FAILED: "calInt.loadFailed",
  CAL_INT_SAVE_FAILED: "calInt.saveFailed",
  CAL_INT_NOT_FOUND: "calInt.notFound",
  CAL_INT_CALENDARS_FAILED: "calInt.calendarsFailed",
  CAL_INT_CALENDARS_UPDATE_FAILED: "calInt.calendarsUpdateFailed",
  CAL_INT_SYNC_INTERVAL_FAILED: "calInt.syncIntervalFailed",
  CAL_INT_DISCONNECT_FAILED: "calInt.disconnectFailed",
  CAL_INT_NO_CALENDARS: "calInt.noCalendars",
  CAL_INT_EVENTS_SAVE_FAILED: "calInt.eventsSaveFailed",
  CAL_INT_SYNC_FAILED: "calInt.syncFailed",
  CAL_INT_EXTERNAL_LOAD_FAILED: "calInt.externalLoadFailed",

  // ── Tasks ──────────────────────────────────────────────
  TASK_LOAD_FAILED: "tasks.loadFailed",
  TASK_CREATE_FAILED: "tasks.createFailed",
  TASK_NOT_FOUND: "tasks.notFound",
  TASK_UPDATE_FAILED: "tasks.updateFailed",
  TASK_DELETE_FAILED: "tasks.deleteFailed",
  TASK_SERIES_UPDATE_FAILED: "tasks.seriesUpdateFailed",
  TASK_SERIES_CREATE_FAILED: "tasks.seriesCreateFailed",
  TASK_SERIES_DELETE_FAILED: "tasks.seriesDeleteFailed",
  TASK_EXCEPTION_FAILED: "tasks.exceptionFailed",
  TASK_COMPLETE_FAILED: "tasks.completeFailed",
  TASK_ONLY_ASSIGNEE: "tasks.onlyAssignee",
  TASK_NOT_YOUR_FAMILY: "tasks.notYourFamily",
  TASK_CHALLENGE_FAILED: "tasks.challengeFailed",

  // ── Shopping ───────────────────────────────────────────
  SHOP_LISTS_LOAD_FAILED: "shopping.listsLoadFailed",
  SHOP_LIST_NOT_FOUND: "shopping.listNotFound",
  SHOP_ITEMS_LOAD_FAILED: "shopping.itemsLoadFailed",
  SHOP_LIST_CREATE_FAILED: "shopping.listCreateFailed",
  SHOP_LIST_NAME_FAILED: "shopping.listNameFailed",
  SHOP_LIST_DELETE_FAILED: "shopping.listDeleteFailed",
  SHOP_ITEM_ADD_FAILED: "shopping.itemAddFailed",
  SHOP_ITEM_UPDATE_FAILED: "shopping.itemUpdateFailed",
  SHOP_ITEM_DELETE_FAILED: "shopping.itemDeleteFailed",
  SHOP_CHECKED_DELETE_FAILED: "shopping.checkedDeleteFailed",
  SHOP_SUGGESTIONS_FAILED: "shopping.suggestionsFailed",

  // ── Chat ───────────────────────────────────────────────
  CHAT_CHANNELS_LOAD_FAILED: "chat.channelsLoadFailed",
  CHAT_MESSAGES_LOAD_FAILED: "chat.messagesLoadFailed",
  CHAT_SEND_FAILED: "chat.sendFailed",
  CHAT_SELF_MESSAGE: "chat.selfMessage",
  CHAT_USER_NOT_FOUND: "chat.userNotFound",
  CHAT_CHANNEL_CREATE_FAILED: "chat.channelCreateFailed",
  CHAT_MEMBERS_ADD_FAILED: "chat.membersAddFailed",
  CHAT_READ_STATUS_FAILED: "chat.readStatusFailed",
  CHAT_FAMILY_NOT_FOUND: "chat.familyNotFound",
  CHAT_MESSAGE_NOT_FOUND: "chat.messageNotFound",
  CHAT_MESSAGE_DELETE_FAILED: "chat.messageDeleteFailed",
  CHAT_OWN_MESSAGES_ONLY: "chat.ownMessagesOnly",
  CHAT_MESSAGE_EDIT_FAILED: "chat.messageEditFailed",
  CHAT_DELETE_ADMIN_ONLY: "chat.deleteAdminOnly",
  CHAT_CHANNEL_NOT_FOUND: "chat.channelNotFound",
  CHAT_FAMILY_CHAT_UNDELETABLE: "chat.familyChatUndeletable",
  CHAT_DELETE_FAILED: "chat.deleteFailed",
  CHAT_UPLOAD_FAILED: "chat.uploadFailed",
  CHAT_IMAGE_NOT_FOUND: "chat.imageNotFound",
  CHAT_IMAGE_DELETE_FAILED: "chat.imageDeleteFailed",
  CHAT_MESSAGE_UPDATE_FAILED: "chat.messageUpdateFailed",
  CHAT_URL_FAILED: "chat.urlFailed",
  CHAT_RATE_LIMITED: "chat.rateLimited",

  // ── Recipes ────────────────────────────────────────────
  RECIPE_LOAD_FAILED: "recipes.loadFailed",
  RECIPE_CREATE_FAILED: "recipes.createFailed",
  RECIPE_NOT_FOUND: "recipes.notFound",
  RECIPE_UPDATE_FAILED: "recipes.updateFailed",
  RECIPE_DELETE_FAILED: "recipes.deleteFailed",
  RECIPE_INGREDIENTS_UPDATE_FAILED: "recipes.ingredientsUpdateFailed",
  RECIPE_INGREDIENTS_SAVE_FAILED: "recipes.ingredientsSaveFailed",
  RECIPE_PLAN_LOAD_FAILED: "recipes.planLoadFailed",
  RECIPE_ENTRY_UPDATE_FAILED: "recipes.entryUpdateFailed",
  RECIPE_ENTRY_CREATE_FAILED: "recipes.entryCreateFailed",
  RECIPE_ENTRY_DELETE_FAILED: "recipes.entryDeleteFailed",
  RECIPE_NO_INGREDIENTS: "recipes.noIngredients",
  RECIPE_TO_LIST_FAILED: "recipes.toListFailed",
  RECIPE_IMAGE_UPLOAD_FAILED: "recipes.imageUploadFailed",

  // ── Rewards ────────────────────────────────────────────
  REWARD_OVERVIEW_FAILED: "rewards.overviewFailed",
  REWARD_HISTORY_FAILED: "rewards.historyFailed",
  REWARD_PROFILE_NOT_FOUND: "rewards.profileNotFound",
  REWARD_MANUAL_FAILED: "rewards.manualFailed",
  REWARD_ZERO_AMOUNT: "rewards.zeroAmount",
  REWARD_LEADERBOARD_FAILED: "rewards.leaderboardFailed",
  REWARD_LOAD_FAILED: "rewards.loadFailed",
  REWARD_CREATE_FAILED: "rewards.createFailed",
  REWARD_NOT_FOUND: "rewards.notFound",
  REWARD_UPDATE_FAILED: "rewards.updateFailed",
  REWARD_INSUFFICIENT_POINTS: "rewards.insufficientPoints",
  REWARD_UNAVAILABLE: "rewards.unavailable",
  REWARD_REDEEM_FAILED: "rewards.redeemFailed",
  REWARD_BADGES_FAILED: "rewards.badgesFailed",
  REWARD_POINTS_EXCEEDED: "rewards.pointsExceeded",
  REWARD_POINTS_FAILED: "rewards.pointsFailed",

  // ── Goals ──────────────────────────────────────────────
  GOAL_LOAD_FAILED: "goals.loadFailed",
  GOAL_CONTRIBUTIONS_FAILED: "goals.contributionsFailed",
  GOAL_PAST_LOAD_FAILED: "goals.pastLoadFailed",
  GOAL_ACTIVE_EXISTS: "goals.activeExists",
  GOAL_CREATE_FAILED: "goals.createFailed",
  GOAL_NOT_ACTIVE: "goals.notActive",
  GOAL_NO_POINTS: "goals.noPoints",
  GOAL_NOT_FOUND: "goals.notFound",
  GOAL_CONTRIBUTE_FAILED: "goals.contributeFailed",
  GOAL_ALREADY_COMPLETED: "goals.alreadyCompleted",
  GOAL_COMPLETE_FAILED: "goals.completeFailed",

  // ── Jars (Töpfe) ──────────────────────────────────────
  JAR_LOAD_FAILED: "jars.loadFailed",
  JAR_CREATE_FAILED: "jars.createFailed",
  JAR_CHILD_NOT_FOUND: "jars.childNotFound",
  JAR_NOT_FOUND: "jars.notFound",
  JAR_UPDATE_FAILED: "jars.updateFailed",
  JAR_DELETE_FAILED: "jars.deleteFailed",
  JAR_NO_POINTS: "jars.noPoints",
  JAR_HISTORY_FAILED: "jars.historyFailed",
  JAR_SORT_EMPTY: "jars.sortEmpty",
  JAR_SORT_INVALID: "jars.sortInvalid",
  JAR_SORT_FAILED: "jars.sortFailed",
  JAR_CHILDREN_FAILED: "jars.childrenFailed",
  JAR_ALL_LOAD_FAILED: "jars.allLoadFailed",

  // ── Rituals ────────────────────────────────────────────
  RITUAL_LOAD_FAILED: "rituals.loadFailed",
  RITUAL_CREATE_FAILED: "rituals.createFailed",
  RITUAL_NOT_FOUND: "rituals.notFound",
  RITUAL_UPDATE_FAILED: "rituals.updateFailed",
  RITUAL_DELETE_FAILED: "rituals.deleteFailed",
  RITUAL_SESSION_LOAD_FAILED: "rituals.sessionLoadFailed",
  RITUAL_SESSION_START_FAILED: "rituals.sessionStartFailed",
  RITUAL_SESSION_UPDATE_FAILED: "rituals.sessionUpdateFailed",
  RITUAL_SESSION_END_FAILED: "rituals.sessionEndFailed",

  // ── Timer ──────────────────────────────────────────────
  TIMER_LOAD_FAILED: "timer.loadFailed",
  TIMER_CREATE_FAILED: "timer.createFailed",
  TIMER_NOT_FOUND: "timer.notFound",
  TIMER_UPDATE_FAILED: "timer.updateFailed",
  TIMER_DELETE_FAILED: "timer.deleteFailed",

  // ── Moments ────────────────────────────────────────────
  MOMENT_LOAD_FAILED: "moments.loadFailed",
  MOMENT_LATEST_FAILED: "moments.latestFailed",
  MOMENT_CREATE_FAILED: "moments.createFailed",
  MOMENT_PHOTO_FAILED: "moments.photoFailed",
  MOMENT_NOT_FOUND: "moments.notFound",
  MOMENT_DELETE_FAILED: "moments.deleteFailed",
  MOMENT_REACTION_FAILED: "moments.reactionFailed",

  // ── Notifications ──────────────────────────────────────
  NOTIF_LOAD_FAILED: "notifications.loadFailed",
  NOTIF_UPDATE_FAILED: "notifications.updateFailed",
  NOTIF_BULK_UPDATE_FAILED: "notifications.bulkUpdateFailed",
  NOTIF_SETTINGS_LOAD_FAILED: "notifications.settingsLoadFailed",
  NOTIF_SETTINGS_SAVE_FAILED: "notifications.settingsSaveFailed",

  // ── Assistant ──────────────────────────────────────────
  ASST_KEY_ENCRYPT_FAILED: "assistant.keyEncryptFailed",
  ASST_KEY_SAVE_FAILED: "assistant.keySaveFailed",
  ASST_KEY_DELETE_FAILED: "assistant.keyDeleteFailed",
} as const

export type ErrorCode = (typeof E)[keyof typeof E]
