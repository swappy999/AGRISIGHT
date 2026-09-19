# Design System Documentation: The Living Earth Editorial

## 1. Overview & Creative North Star: "The Digital Cultivator"
This design system moves away from the rigid, clinical grids often found in agricultural software. Our Creative North Star is **The Digital Cultivator**. We treat the mobile interface as a high-end editorial piece—think of a premium horticultural journal meets Apple’s clean aesthetics.

The system breaks the "template" look by using **intentional asymmetry** and **tonal depth**. We don't just display data; we "plant" it within a hierarchy of soft, organic layers. By utilizing ultra-large display type against expansive white space, we ensure that the interface feels both authoritative and incredibly accessible for users who may be operating in high-glare, outdoor environments.

---

## 2. Colors & The Organic Palette
The palette is rooted in a "Soft Green" philosophy, using deep forest tones for primary actions and airy, minty washes for surfaces.

### The "No-Line" Rule
**Strict Mandate:** Designers are prohibited from using 1px solid borders to section content. Boundaries must be defined solely through background color shifts. Use `surface-container-low` sections sitting on a `surface` background to create a distinction. If you feel the urge to draw a line, use white space instead.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers, like stacked sheets of fine, heavy-weight paper.
*   **Base:** `surface` (#f7faf5)
*   **Layout Sections:** `surface-container-low` (#eff5ef)
*   **Actionable Cards:** `surface-container-lowest` (#ffffff)
*   **Elevated Overlays:** `surface-container-highest` (#dbe5dd)

### The "Glass & Gradient" Rule
To elevate the "Apple-like" feel, use **Glassmorphism** for floating navigation bars or quick-action menus. Apply `surface` at 70% opacity with a `20px` backdrop blur. For primary CTAs, use a subtle linear gradient from `primary` (#2d6a4f) to `primary_dim` (#1f5e44) at a 145-degree angle to give the button "soul" and a tactile, convex feel.

---

## 3. Typography: Editorial Authority
We use a dual-typeface system to balance modern technicality with approachable legibility.

*   **Display & Headlines (Manrope):** This geometric sans-serif provides a professional, stable foundation. The `display-lg` (3.5rem) should be used for key data points (e.g., soil moisture percentages) to ensure they are readable at arm's length in the field.
*   **Body & Labels (Plus Jakarta Sans):** Chosen for its tall x-height and open apertures, ensuring that even at `body-sm` (0.75rem), the text does not blur under sunlight.

**Hierarchy Intent:** Use `headline-lg` for section headers, but pair them with a `label-md` in `on_surface_variant` (#58615b) set in all-caps with 5% letter spacing to create a high-end, "branded" look.

---

## 4. Elevation & Depth: Tonal Layering
We do not use shadows to create "pop"; we use them to create "atmosphere."

*   **The Layering Principle:** Depth is achieved by stacking. A `surface-container-lowest` card placed on a `surface-container-low` background creates a natural lift.
*   **Ambient Shadows:** When an element must float (e.g., a critical alert or a FAB), use an extra-diffused shadow: `offset: 0, 8px; blur: 24px; color: rgba(43, 53, 47, 0.06)`. Note the use of a tinted shadow color (`on_surface`) rather than pure black.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility in forms, use the `outline_variant` (#aab4ad) at **15% opacity**. 100% opaque borders are strictly forbidden.

---

## 5. Components

### Buttons
*   **Primary:** High-gloss gradients using `primary` to `primary_dim`. Border radius: `full`. Padding: `16px 32px`.
*   **Secondary:** `surface-container-highest` background with `on_primary_container` text. This ensures a soft, integrated look that doesn't compete with the main action.

### Severity Badges (Status Indicators)
Instead of harsh red/green boxes, use soft, pill-shaped "Organic Tags."
*   **Critical:** `tertiary_container` (#fc7777) background with `on_tertiary_container` text.
*   **Warning:** #FDE047 (Yellow-soft) background with #854D0E text.
*   **Healthy:** `primary_container` (#b1f0ce) background with `on_primary_container` text.

### Cards & Lists
*   **Requirement:** Zero divider lines. 
*   **Execution:** Group related list items inside a single `surface-container-low` wrapper with a `1.5rem` (md) corner radius. Use a `1rem` vertical gap between items to define separation.

### Large-Scale Inputs
Agriculture users may be wearing gloves or have weathered hands. 
*   **Inputs:** Minimum height of `64px`. 
*   **Radius:** `1rem`. 
*   **Active State:** Instead of a heavy border, use a `2px` "Ghost Border" of `primary` at 40% opacity and shift the background to `surface_container_lowest`.

### Contextual Weather/Field Component
A bespoke component for this system: A "Glass" card using `backdrop-filter: blur(12px)` that overlays a high-resolution satellite crop image, using `title-lg` for temperature and `body-md` for wind/humidity.

---

## 6. Do’s and Don'ts

### Do
*   **Do** use the `xl` (3rem) border radius for top-level containers to mimic the premium curves of modern hardware.
*   **Do** use `on_surface_variant` for secondary information to maintain a soft visual hierarchy.
*   **Do** prioritize "negative space." If a screen feels crowded, increase the padding rather than shrinking the text.

### Don't
*   **Don't** use pure black (#000000) for text. Always use `on_surface` (#2b352f) to keep the contrast "organic."
*   **Don't** use standard Material Design drop shadows. They are too aggressive for this "soft green" aesthetic.
*   **Don't** use icons thinner than a `2px` stroke weight. Thin icons disappear in outdoor light; keep them bold and "filled" or "heavy-duotone."