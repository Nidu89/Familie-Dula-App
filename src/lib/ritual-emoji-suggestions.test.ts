import { describe, it, expect } from "vitest"
import { getSuggestedEmoji, DEFAULT_EMOJI } from "./ritual-emoji-suggestions"

describe("getSuggestedEmoji", () => {
  // ---- Happy path: keyword matching ----

  it("returns tooth emoji for 'Zähne putzen'", () => {
    expect(getSuggestedEmoji("Zähne putzen")).toBe("🦷")
  })

  it("returns sleep emoji for 'Schlafen gehen'", () => {
    expect(getSuggestedEmoji("Schlafen gehen")).toBe("😴")
  })

  it("returns cooking emoji for 'Frühstücken'", () => {
    expect(getSuggestedEmoji("Frühstücken")).toBe("🍳")
  })

  it("returns meal emoji for 'Abendessen'", () => {
    expect(getSuggestedEmoji("Abendessen")).toBe("🍝")
  })

  it("returns shirt emoji for 'Anziehen'", () => {
    expect(getSuggestedEmoji("Anziehen")).toBe("👕")
  })

  it("returns backpack emoji for 'Schulranzen packen'", () => {
    expect(getSuggestedEmoji("Schulranzen packen")).toBe("🎒")
  })

  it("returns books emoji for 'Buch lesen'", () => {
    expect(getSuggestedEmoji("Buch lesen")).toBe("📚")
  })

  it("returns pencil emoji for 'Hausaufgaben'", () => {
    expect(getSuggestedEmoji("Hausaufgaben")).toBe("✏️")
  })

  it("returns shower emoji for 'Duschen'", () => {
    expect(getSuggestedEmoji("Duschen")).toBe("🚿")
  })

  it("returns running emoji for 'Sport machen'", () => {
    expect(getSuggestedEmoji("Sport machen")).toBe("🏃")
  })

  it("returns music emoji for 'Musik üben'", () => {
    expect(getSuggestedEmoji("Musik üben")).toBe("🎵")
  })

  it("returns game emoji for 'Spielen'", () => {
    expect(getSuggestedEmoji("Spielen")).toBe("🎮")
  })

  it("returns bed emoji for 'Zimmer aufräumen' (aufräumen matches tidy before zimmer matches sweep)", () => {
    // "aufräumen" matches the tidy/bed category first due to keyword order
    expect(getSuggestedEmoji("Zimmer aufräumen")).toBe("🛏️")
  })

  it("returns broom emoji for 'Zimmer sauber machen'", () => {
    expect(getSuggestedEmoji("Zimmer sauber machen")).toBe("🧹")
  })

  it("returns water emoji for 'Wasser trinken'", () => {
    expect(getSuggestedEmoji("Wasser trinken")).toBe("💧")
  })

  it("returns meditation emoji for 'Meditation'", () => {
    expect(getSuggestedEmoji("Meditation")).toBe("🧘")
  })

  it("returns paw emoji for 'Hund füttern'", () => {
    expect(getSuggestedEmoji("Hund füttern")).toBe("🐾")
  })

  // ---- Case insensitivity ----

  it("matches case-insensitively", () => {
    expect(getSuggestedEmoji("ZÄHNE PUTZEN")).toBe("🦷")
    expect(getSuggestedEmoji("schlafen")).toBe("😴")
    expect(getSuggestedEmoji("Spielen")).toBe("🎮")
  })

  // ---- English keywords ----

  it("matches English keywords", () => {
    expect(getSuggestedEmoji("Brush teeth")).toBe("🦷")
    expect(getSuggestedEmoji("Breakfast")).toBe("🍳")
    expect(getSuggestedEmoji("Homework")).toBe("✏️")
    expect(getSuggestedEmoji("Shower")).toBe("🚿")
  })

  // ---- Fallback to default ----

  it("returns default emoji for unknown titles", () => {
    expect(getSuggestedEmoji("Irgendwas anderes")).toBe(DEFAULT_EMOJI)
    expect(getSuggestedEmoji("xyz")).toBe(DEFAULT_EMOJI)
  })

  // ---- Edge cases ----

  it("returns default emoji for empty string", () => {
    expect(getSuggestedEmoji("")).toBe(DEFAULT_EMOJI)
  })

  it("returns default emoji for whitespace-only string", () => {
    expect(getSuggestedEmoji("   ")).toBe(DEFAULT_EMOJI)
  })

  it("handles substring matching (keyword within longer text)", () => {
    // "bett" matches sleep (😴) before "aufstehen" matches tidy (🛏️) due to map order
    expect(getSuggestedEmoji("Heute früh aufstehen und Bett machen")).toBe("😴")
  })

  it("matches first keyword in map order", () => {
    // "aufstehen" is in tidy category
    expect(getSuggestedEmoji("Aufstehen")).toBe("🛏️")
  })

  // ---- DEFAULT_EMOJI value ----

  it("DEFAULT_EMOJI is the star emoji", () => {
    expect(DEFAULT_EMOJI).toBe("⭐")
  })
})
