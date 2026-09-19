```markdown
# Design System Specification: The Cultivated Workspace

## 1. Overview & Creative North Star

### Creative North Star: "The Cultivated Workspace"
This design system moves away from the sterile, rigid grids of traditional data management. Instead, it treats the desktop web application as a "Cultivated Workspace"—an environment that feels as organic and intentional as a well-tended field. By blending the precision of Apple-inspired minimalism with a lush, editorial sensibility, we create a high-end experience that feels "farmer-friendly" yet sophisticated.

To break the "template" look, this system utilizes **intentional asymmetry** and **tonal depth**. Rather than containing data in boxes, we let the content breathe within expansive, ultra-rounded surfaces. High-contrast typography scales and layered translucency ensure that complex agricultural data feels light, approachable, and premium.

---

## 2. Colors & Surface Philosophy

The color strategy is rooted in the depth of `primary` (#0F5238) and `primary-container` (#2D6A4F). We use a spectrum of greens and soft neutrals to create a sense of growth and reliability.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section off the UI. 
Boundaries must be defined through:
- **Background Color Shifts:** Use a `surface-container-low` section sitting on a `surface` background.
- **Tonal Transitions:** Define areas by moving from `surface-container-lowest` (pure white/highest elevation) to `surface-container-high`.

### Surface Hierarchy & Nesting
Treat the UI as physical layers of fine paper or frosted glass.
- **Base Layer:** `surface` (#f8faf6).
- **Secondary Workspace:** `surface-container-low` (#f2f4f0).
- **Interactive Cards:** `surface-container-lowest` (#ffffff).
When nesting, always move "up" or "down" exactly one tier in the surface-container scale to maintain soft contrast.

### The "Glass & Gradient" Rule
To add "soul" to the interface, use Glassmorphism for floating elements (like sidebars or top-level navigation) using `surface-container-lowest` at 80% opacity with a `backdrop-filter: blur(20px)`. Main CTAs should utilize a subtle linear gradient from `primary` (#0F5238) to `primary-container` (#2D6A4F) to provide a tactile, premium depth.

---

## 3. Typography: Editorial Authority

We use **Manrope** for its unique balance of geometric precision and organic warmth.

- **Display (Large/Medium):** Reserved for high-level data summaries or welcome headers. Use `on-surface` with tight letter-spacing (-0.02em).
- **Headlines:** Used for primary card titles. High contrast is key; use `headline-sm` (1.5rem) to ensure a clear hierarchy against body text.
- **Body & Labels:** `body-lg` is the workhorse for data entry. Use `label-md` for metadata, ensuring it is always set in `on-surface-variant` to maintain a visual "quietness" around secondary information.

The hierarchy should feel like a high-end magazine: large, authoritative titles followed by clean, breathable body text.

---

## 4. Elevation & Depth

We achieve hierarchy through **Tonal Layering** rather than shadows.

- **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` background. This creates a "soft lift" that feels more modern than a drop shadow.
- **Ambient Shadows:** If a floating state is required (e.g., a modal or active dropdown), use an extra-diffused shadow: `box-shadow: 0 20px 40px rgba(15, 82, 56, 0.05)`. Note the use of the `primary` color in the shadow tint to keep it organic.
- **The "Ghost Border" Fallback:** For accessibility in input fields, use a "Ghost Border": the `outline-variant` token at 20% opacity. Never use 100% opaque borders.
- **Full Roundness:** In accordance with the "Full" roundness directive, all buttons, chips, and tags must use the `full` (9999px) token. Container-level cards should use `xl` (3rem) to maintain a soft, approachable silhouette.

---

## 5. Components

### Sidebar Navigation
The desktop navigation uses a multi-column approach. The primary sidebar should be `surface-container-low` with `full` rounded active states. Avoid icons in boxes; use "Ghost" icons that only gain a `primary-fixed` background when active.

### Buttons
- **Primary:** `primary` background, `on-primary` text. `full` rounded. High-gloss gradient optional.
- **Secondary:** `secondary-container` background. `on-secondary-container` text.
- **Tertiary:** No background. Bold `primary` text.

### Inputs & Fields
Inputs should not have bottom lines. Use `surface-container-highest` as a subtle background fill with `full` rounded corners and `title-sm` typography for the input text.

### Cards & Data Lists
**Strict Rule:** No divider lines. Separate list items using vertical white space (use 1.5rem spacing) or by alternating subtle background shades (`surface-container-low` vs `surface-container-lowest`).

### Agricultural Context Components
- **Growth Indicators:** Use `primary-fixed` for positive trends and `tertiary` for warnings.
- **Status Pills:** Small, `full` rounded chips using `secondary-fixed` for a "soft-state" look.

---

## 6. Do's and Don'ts

### Do:
- **Do** embrace wide gutters and generous padding (use the `xl` spacing scale).
- **Do** use `primary-container` (#2D6A4F) for large background blocks to create a "Verdant" immersive feel.
- **Do** align items asymmetrically; for example, left-aligned headers with right-aligned data cards to create visual interest.

### Don't:
- **Don't** use black (#000000). Always use `on-surface` (#191c1a) for text.
- **Don't** use square corners. Every interactive element must be `full` rounded or at minimum `xl` (3rem) for large containers.
- **Don't** use standard "Material Design" shadows. Keep depth tonal and flat unless a component is truly floating.
- **Don't** clutter. If a screen feels busy, increase the white space between sections rather than adding lines.

---

*Director's Final Note: This system is about the "feeling" of the land—intentional, expansive, and high-quality. Every pixel should feel like it was placed by hand, not generated by a framework.*```