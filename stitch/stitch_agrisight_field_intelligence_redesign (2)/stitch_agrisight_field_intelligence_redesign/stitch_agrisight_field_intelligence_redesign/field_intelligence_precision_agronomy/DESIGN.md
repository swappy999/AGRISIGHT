---
name: Field Intelligence & Precision Agronomy
colors:
  surface: '#f5fbf7'
  surface-dim: '#d5dbd8'
  surface-bright: '#f5fbf7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff5f1'
  surface-container: '#e9efeb'
  surface-container-high: '#e4eae6'
  surface-container-highest: '#dee4e0'
  on-surface: '#171d1b'
  on-surface-variant: '#414844'
  inverse-surface: '#2c322f'
  inverse-on-surface: '#ecf2ee'
  outline: '#717974'
  outline-variant: '#c1c8c3'
  surface-tint: '#426657'
  primary: '#00251a'
  on-primary: '#ffffff'
  primary-container: '#173b2e'
  on-primary-container: '#80a594'
  inverse-primary: '#a8cfbd'
  secondary: '#486551'
  on-secondary: '#ffffff'
  secondary-container: '#caebd1'
  on-secondary-container: '#4e6b57'
  tertiary: '#351804'
  on-tertiary: '#ffffff'
  tertiary-container: '#4f2c16'
  on-tertiary-container: '#c59375'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c4ebd8'
  primary-fixed-dim: '#a8cfbd'
  on-primary-fixed: '#002116'
  on-primary-fixed-variant: '#2a4d40'
  secondary-fixed: '#caebd1'
  secondary-fixed-dim: '#aeceb6'
  on-secondary-fixed: '#042111'
  on-secondary-fixed-variant: '#304d3a'
  tertiary-fixed: '#ffdbc8'
  tertiary-fixed-dim: '#f2bb9b'
  on-tertiary-fixed: '#301402'
  on-tertiary-fixed-variant: '#643e26'
  background: '#f5fbf7'
  on-background: '#171d1b'
  surface-variant: '#dee4e0'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 44px
    fontWeight: '700'
    lineHeight: 52px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.005em
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.08em
  telemetry-numeral:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.03em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system establishes an uncompromising balance between scientific precision and grounded earthiness. Designed for agronomists, commercial farm operators, and field scouts working under varying field lighting conditions, the interface avoids decorative agricultural clichés—specifically cartoonish visuals, ungrounded vibrant greens, and excessive ornamentation. Instead, it embodies a tactile, high-density editorial aesthetic reminiscent of field notebooks crossed with modern aerospace telemetry.

The visual direction merges **Minimalism** and **Tactile Precision**:
- High legibility in direct sunlight through deeply calibrated contrast ratios.
- Calibrated data density with breathing room for critical risk assessments.
- Restrained, purposeful feedback mechanisms that communicate trust, predictive reliability, and operational calm during critical harvest windows.

## Colors

The palette is anchored in mineral, soil, and muted vegetation tones that prevent visual fatigue during long field inspections:

- **Primary Canvas & Background (`#F5F2EA`)**: Warm Ivory evoking sun-bleached linen and field paper, serving as the default ambient canvas.
- **Primary Ink & Surfaces (`#101614`)**: Deep Charcoal / Near-Black for sharp typographic legibility and stable dark-mode navigation shells.
- **Deep Botanical Slate (`#173B2E`)**: Structural brand anchor, applied to app bars, navigation roots, key metrics, and confident interactive elements.
- **Muted Foliage Green (`#5F7D68`)**: Signifies optimal crop health, nominal sensor states, and system verification without fluorescent glare.
- **Pale Sage (`#A8B7A7`)**: Non-distracting structural hairline dividers, subtle badge backdrops, and muted chip states.
- **Earth Clay / Terracotta (`#A8795D`)**: Soil condition telemetry, organic matter readouts, and field section differentiation.
- **Functional Semantics**:
  - *Muted Amber / Ochre (`#C69A45`)*: Water stress, evapotranspiration warnings, and pending field validations.
  - *Restrained Crimson (`#B94A48`)*: Pests, pathogens, severe blight warnings, and critical equipment anomalies.
  - *Environmental Mist Blue (`#4A6B82`)*: Microclimate data, atmospheric moisture, and precipitation radars.

## Typography

Typography combines the structural clarity of **Plus Jakarta Sans** for headlines and numeric telemetry with the functional density of **Inter** for descriptions, multi-lingual labels, and instructions.

- **Multilingual Harmony**: Base letterforms must support full unicode scripts including Devanagari (हिन्दी) and Bengali (বাংলা). Standardize line heights to minimum `1.4x` on non-Latin scripts to ensure glyph diacritics and ligatures do not clip.
- **Numbers & Metrics (`telemetry-numeral`)**: Tabular figures (`tnum`) must be enforced globally on numerical displays to ensure live telemetry readings (e.g., soil moisture, nitrogen indexing, temperature) remain stable without visual jitter.
- **Micro-Labels (`label-sm`)**: Presented with uppercase styling and expanded tracking (`0.08em`) to act as data taxonomy indicators across sensor cards and diagnostic confidence chips.

## Layout & Spacing

The layout is built around a **mobile-first 4-column layout** transitioning into an **8-column tablet** and **12-column desktop operational command console**.

- **Mobile Viewport (360px - 599px)**:
  - 4-column layout with `margin: 1rem` (16px) and `gutter: 1rem`.
  - All critical field actions (Scan, Voice, Diagnose) remain pinned within the lower 35% of thumb reach.
  - Telemetry monitors stack in a 2x2 grid format.
- **Tablet Viewport (600px - 1023px)**:
  - 8-column layout with `margin: 1.5rem` and `gutter: 1rem`. Split-screen mode enabled: live scouting camera feed on the left, running telemetry feeds and diagnostics on the right.
- **Desktop / Field Station (1024px+)**:
  - 12-column grid maxing out at 1440px container width with `margin-desktop: 2rem` and `gutter-desktop: 1.5rem`.
  - Side navigation persistent rail; modular multi-field farm map occupying main canvas with floating telemetry modules.

## Elevation & Depth

Visual depth follows **tonal layering paired with calibrated low-contrast outlines** rather than diffuse corporate drop-shadows. This preserves crisp edge contrast under high-glare direct sunlight.

- **Ground Level (Base)**: Surface color `#F5F2EA` (Warm Ivory). Completely flat.
- **Level 1 (Card & Module Layer)**: Surface `#FFFFFF` bordered by a 1px crisp outline of `#A8B7A7` (Pale Sage at 40% opacity). Soft ambient anchor shadow: `0 1px 3px rgba(16, 22, 20, 0.04)`.
- **Level 2 (Active Diagnostics & Overlays)**: Surface `#FFFFFF` with outline `#5F7D68` (25% opacity), accompanied by a directional soft shadow: `0 4px 16px rgba(23, 59, 46, 0.08)`.
- **Level 3 (Modal Shells, Floating Scan Reticles, Popovers)**: Surface `#101614` with a 1px boundary of `#5F7D68` (30% opacity) or `#FFFFFF` (90% opacity), elevated with a high-definition focus shadow: `0 12px 32px rgba(16, 22, 20, 0.18)`.

## Shapes

The interface adopts a disciplined **Soft (`1`)** shape language. 
- Standard components (buttons, input fields, badges) use `0.25rem` (4px) base corner radii.
- Telemetry containers and diagnostic cards use `0.5rem` (8px).
- Modals, action sheets, and full scan viewfinders expand to `0.75rem` (12px).
- Circular treatment is reserved exclusively for icon actions (mic toggle, camera shutter) and status pips to maintain distinction between actionable system controllers and informative data modules.

## Components

### 1. Buttons
- **Primary Action**: Solid `#173B2E` with `#F5F2EA` text, 44px minimum touch target, `rounded: 4px`. Hover/Active shifts to `#101614`.
- **Field Urgent**: Solid `#B94A48` with `#FFFFFF` text for confirming pesticide protocols or flagging critical disease spots.
- **Subtle / Secondary**: Transparent background with a 1px border in `#A8B7A7` and `#101614` text.

### 2. Scan Viewfinder & AI Bounding Reticle
- **Camera Canvas**: Fullscreen with an inner targeting reticle defined by 4 corner brackets in `#5F7D68` with a 2px stroke.
- **Detection Target**: Animated vector bounding box dynamically tracking plant foliage with an attached diagnostic pill containing: Confidence Score (`94%`), Detected Agent (`Cercospora Leaf Spot`), and Severity Badge.
- **AI Processing Bar**: A subtle 2px scanning laser line in `#5F7D68` moving vertically across the bounds.

### 3. Progressive Diagnosis Cards
- **Card Structure**: Clean white surface (`#FFFFFF`) with 1px border in Pale Sage (`#A8B7A7`).
- **Header**: Contains the field lot ID, scan timestamp, and Risk Badge:
  - *Nominal*: `#5F7D68` background, 10% opacity, solid `#173B2E` text.
  - *Moderate Attention*: `#C69A45` background, 12% opacity, solid `#7F5E18` text.
  - *Critical Risk*: `#B94A48` background, 12% opacity, solid `#8C2D2B` text.
- **Body**: Split view showing raw leaf scan crop alongside synthesized infrared/chlorophyll heatmaps, followed by step-by-step agronomical mitigation protocols.

### 4. Voice Waveforms & Assistant Controller
- Fixed audio bar for hands-free operation when hands are soiled.
- Dynamic 5-bar responsive visualizer oscillating between `#173B2E` and `#5F7D68`.
- Prompts render in large legible text (`title-md`) with instantaneous multilingual transcript fallback.

### 5. Multilingual Language Selector
- Compact pill-switch component displaying script initials (`EN`, `हिं`, `বাং`).
- Active language pill uses `#173B2E` with `#F5F2EA` text; inactive tabs use `#A8B7A7` at 20% opacity with `#101614` text.
- Full typography line-height recalculation occurs dynamically on switch to preserve reading rhythm.

### 6. IoT Sensor Telemetry Tiles
- Modular square/rectangular grid items containing:
  - Label: `label-sm` tracking sensor name (e.g., `SOIL WATER POTENTIAL`, `CANOPY TEMP`).
  - Readout: `telemetry-numeral` (`-32 kPa`, `24.2°C`).
  - Inline Micro Sparkline: 1.5px stroke path in `#4A6B82` (Moisture) or `#A8795D` (Soil) with nominal baseline dotted line.

### 7. Unified App Shell & Bottom Navigation
- Fixed 64px mobile dock in Deep Charcoal (`#101614`) with warm off-white icons.
- Central elevated shutter button for instantaneous field scan invocation.
- Touch feedback utilizes subtle opacity transitions (`80%`) rather than bright glowing rings.