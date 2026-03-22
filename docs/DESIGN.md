# Design System Strategy: The Joyful Curator

## 1. Overview & Creative North Star

The "Creative North Star" is **"The Digital Sandbox."**

Unlike traditional "kid-focused" apps that rely on chaotic, high-saturation primary colors and rigid grids, this system adopts a high-end editorial approach to family digital spaces. We move away from the "template" look by using **intentional asymmetry** and **tonal depth**. The interface should feel like a collection of smooth, river-washed stones or a stack of high-quality construction paper — tactile, premium, and welcoming.

We break the grid by allowing organic shapes to overlap containers and using a sophisticated typography scale that balances the playfulness of rounded forms with the clarity of professional editorial layouts.

---

## 2. Color Palette

| Token | Hex | HSL | Usage |
|---|---|---|---|
| `primary` | `#ffd709` | `50 100% 52%` | Sunny Yellow — main CTA, highlights |
| `on-primary` / `primary-foreground` | `#6c5a00` | `50 100% 21%` | Text on yellow, dark golden |
| `secondary` | `#006384` | `195 100% 26%` | Teal — instructional / parent-facing text |
| `on-secondary` | `#ffffff` | `0 0% 100%` | Text on teal |
| `secondary-container` | `#cce8f2` | `195 55% 87%` | Chip active states |
| `tertiary-container` | `#ffd5c2` | `18 100% 87%` | Activity Bubble, special milestones |
| `surface` | `#f3f7fb` | `210 50% 97%` | Page background |
| `surface-container-low` | `#ecf1f6` | `210 35% 94%` | Secondary content areas |
| `surface-container-lowest` | `#ffffff` | `0 0% 100%` | Interactive cards, inputs |
| `surface-container` | `#e5eaf0` | `210 25% 92%` | Mid-tier containers |
| `surface-container-high` | `#dde3e8` | `210 19% 88%` | Elevated elements |
| `on-surface` / `foreground` | `#2a2f32` | `202 9% 18%` | Primary text (never pure black) |
| `outline-variant` | `#dde3e8` | `210 19% 88%` | Ghost borders (max 15% opacity) |

### Surface Philosophy ("No-Line" Rule)
**Borders are strictly prohibited for sectioning.** Separate content using background color shifts ("islands of color"). The `outline-variant` may only be used as a "Ghost Border" at 15% opacity when a container sits on an identically-colored background.

### Surface Hierarchy
```
Base Layer:              surface (#f3f7fb)
Secondary Content Area:  surface-container-low (#ecf1f6)
Interactive Cards:       surface-container-lowest (#ffffff)
Elevated Modals:         surface-container-high (#dde3e8)
```

### Signature Gradient (Primary CTA)
Linear gradient from `#6c5a00` → `#ffd709` at 135°. Gives yellow a "sun-drenched" glow, not flat plastic.

### Glassmorphism (Floating Nav / Overlays)
`surface-container-lowest` at 70% opacity + `backdrop-blur: 20px`.

---

## 3. Typography

| Layer | Font | Use Case |
|---|---|---|
| Display & Headlines | `Plus Jakarta Sans` (`--font-display`) | Personality layer — `display-lg` (3.5rem), `headline-lg` (2rem) |
| Body & Titles | `Be Vietnam Pro` (`--font-body`) | Utility layer — excellent legibility for all ages |

**Hierarchy Note:** Pair `headline-md` section headers with a `label-md` uppercase subtitle in `secondary` color for a curated, editorial feel.

Both fonts are loaded via `next/font/google` in `layout.tsx`.

---

## 4. Border Radius Scale

| Token | Value | Use Case |
|---|---|---|
| `sm` | `0.5rem` | Minimum allowed radius for any element |
| `md` | `1rem` | Form inputs, small chips |
| `lg` | `2rem` | Standard cards (default `--radius`) |
| `xl` | `3rem` | Large hero containers |
| `full` | `9999px` | Pill buttons, inviting touch |

**Rule:** Never use sharp corners. If no scale value fits, use `sm` (0.5rem) minimum.

---

## 5. Elevation & Depth (Tonal Layering)

Traditional drop shadows are too "software-like". We use **Ambient Depth**:

- **Layering Principle:** Place `surface-container-lowest` card on `surface-container-low` background for a "soft lift" that feels natural.
- **Ambient Shadows (floating elements only):** `blur: 3rem`, `opacity: 6%`, shadow color = tinted `on-surface (#2a2f32)`.
- **Ghost Border (fallback):** `outline-variant` at 15% opacity only when container sits on same background color.
- **Organic Radii:** Standard cards `lg` (2rem), hero containers `xl` (3rem), buttons `full`.

---

## 6. Components

### Buttons
- **Primary:** `full` radius, signature gradient (`#6c5a00` → `#ffd709` at 135°), `on-surface` high-contrast text.
- **Secondary:** `surface-container-high` background, no border.
- **Tertiary:** Transparent, `title-sm` typography in `secondary` (`#006384`).

### Cards & Lists
- **Anti-Divider Rule:** No horizontal lines. Separate list items with `1rem` vertical spacing or alternating `surface-container-low` / `surface-container-lowest` tints.
- **Clickable Zone:** All interactive elements min hit target `4rem` (64px) for younger users.

### Inputs & Selection
- `surface-container-lowest` background, `lg` (2rem) corner radius.
- Focus state: 2px Ghost Border of `primary`.
- **Chips:** `secondary-container` for active, `surface-container-high` for inactive.

### Custom: "Activity Bubble"
Asymmetric organic shape using `border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%` with `tertiary-container` background. Use for special family milestones.

---

## 7. Spacing & Rhythm

**Rule:** Avoid the tight "utility app" look. Use spacing generously.

| Context | Value |
|---|---|
| Section padding (vertical between major blocks) | `5.5rem–7rem` |
| Card internal padding | `1.7rem` minimum |
| Asymmetric margins | Allowed (e.g., `2rem` left, `2.75rem` right) |

---

## 8. Do's and Don'ts

### Do
- Use asymmetrical margins for a "hand-crafted" feel.
- Overlap elements — let icons or shapes break the edge of a card container.
- Use `secondary` (`#006384`) for all instructional / parent-facing functional text.
- Use wide whitespace (`2.75rem` gap) instead of lines.

### Don't
- Don't use pure black for text — use `on-surface` (`#2a2f32`).
- Don't use sharp corners — minimum `sm` (0.5rem).
- Don't use standard Material Design dividers or 1px borders for sectioning.
- Don't use opaque borders at 100% — only Ghost Borders at max 15% opacity.
