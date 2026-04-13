// ============================================================
// PROJ-19: Kindergerechte Ritual-Schritte – Emoji Suggestions
// Pure function: keyword-based emoji mapping for ritual steps
// ============================================================

const DEFAULT_EMOJI = "\u2B50" // star

/**
 * Keyword-to-emoji mapping. Keys are lowercase substrings.
 * Order matters: more specific keywords should come first.
 */
const KEYWORD_MAP: [string[], string][] = [
  // Teeth / dental
  [["zähne", "zahn", "zaehne", "teeth", "brush teeth", "toothbrush"], "\uD83E\uDDB7"], // 🦷
  // Sleep / bed
  [["schlafen", "schlaf", "bett", "einschlafen", "gute nacht", "sleep", "bedtime", "nap"], "\uD83D\uDE34"], // 😴
  // Eating / meals
  [["frühstück", "fruehstueck", "breakfast"], "\uD83C\uDF73"], // 🍳
  [["abendessen", "dinner", "supper"], "\uD83C\uDF5D"], // 🍝
  [["mittagessen", "lunch"], "\uD83C\uDF5B"], // 🍛
  [["snack", "zwischenmahlzeit", "jause"], "\uD83C\uDF4E"], // 🍎
  [["essen", "eat", "meal", "food", "mahlzeit"], "\uD83C\uDF7D\uFE0F"], // 🍽️
  // Dressing
  [["pyjama", "schlafanzug", "pajama"], "\uD83E\uDE72"], // 🩲 (closest to sleepwear)
  [["anziehen", "kleidung", "umziehen", "dress", "clothes", "get dressed"], "\uD83D\uDC55"], // 👕
  // Tidying up / bed making
  [["aufräumen", "aufraeumen", "aufstehen", "tidy", "clean up", "make bed"], "\uD83D\uDECF\uFE0F"], // 🛏️
  // School bag / packing
  [["ranzen", "schulranzen", "tasche", "packen", "rucksack", "backpack", "school bag"], "\uD83C\uDF92"], // 🎒
  // Reading
  [["lesen", "buch", "geschichte", "vorlesen", "read", "book", "story"], "\uD83D\uDCDA"], // 📚
  // Homework
  [["hausaufgaben", "aufgaben", "lernen", "homework", "study", "school work"], "\u270F\uFE0F"], // ✏️
  // Washing / bathing
  [["waschen", "duschen", "bad", "baden", "shower", "bath", "wash"], "\uD83D\uDEBF"], // 🚿
  // Sports / exercise
  [["sport", "turnen", "bewegung", "exercise", "workout", "gym"], "\uD83C\uDFC3"], // 🏃
  // Music
  [["musik", "üben", "ueben", "instrument", "klavier", "gitarre", "music", "practice"], "\uD83C\uDFB5"], // 🎵
  // Playing
  [["spielen", "play", "game", "spiel"], "\uD83C\uDFAE"], // 🎮
  // Cleaning / sweeping
  [["zimmer", "sauber", "kehren", "staubsaugen", "broom", "sweep", "vacuum", "putzen"], "\uD83E\uDDF9"], // 🧹
  // Drinking water
  [["trinken", "wasser", "drink", "water"], "\uD83D\uDCA7"], // 💧
  // Sunscreen / outdoors
  [["sonnencreme", "eincremen", "sunscreen"], "\u2600\uFE0F"], // ☀️
  // Hands
  [["hände", "haende", "hand waschen", "hands", "handwash"], "\uD83D\uDC4B"], // 👋
  // Meditation / calm
  [["meditation", "ruhe", "entspannung", "calm", "relax", "breathe", "atmen"], "\uD83E\uDDD8"], // 🧘
  // Walking / going out
  [["spazieren", "rausgehen", "draussen", "walk", "outside", "outdoor"], "\uD83C\uDF33"], // 🌳
  // Pet care
  [["hund", "katze", "haustier", "füttern", "fuettern", "dog", "cat", "pet", "feed"], "\uD83D\uDC3E"], // 🐾
]

/**
 * Returns a suggested emoji based on the ritual step title.
 * Uses case-insensitive substring matching against a keyword map.
 * Falls back to the default emoji (star) if no keyword matches.
 */
export function getSuggestedEmoji(title: string): string {
  if (!title || title.trim().length === 0) return DEFAULT_EMOJI

  const lower = title.toLowerCase().trim()

  for (const [keywords, emoji] of KEYWORD_MAP) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return emoji
      }
    }
  }

  return DEFAULT_EMOJI
}

/**
 * Default emoji used when no keyword matches.
 */
export { DEFAULT_EMOJI }
