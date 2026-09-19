# AgriSight — UPDATED MASTER UI/UX + EXISTING INTELLIGENCE + MOBILE PHASE PLAN

## Core instruction

This is an existing AgriSight application. Do not rebuild it from scratch.

Preserve and improve the capabilities already present or already designed, especially:

- Crop disease detection
- Pest detection
- IPM-based management
- Nutrition guidance
- Water/irrigation guidance
- Crop health
- Crop management
- Risk assessment
- Scan comparison
- Action recommendations
- Efficient resource-use guidance
- Weather-based recommendations
- AI agricultural assistant
- Multilingual/voice support
- Field intelligence
- Spatial field health
- Analysis/history

The goal is NOT to remove functionality.

The goal is:

> **Keep the intelligence, simplify the experience.**

---

# 1. PRODUCT PRINCIPLE

AgriSight should feel:

- Simple
- Crisp
- Farmer-friendly
- Lively
- Fast
- Trustworthy
- Mobile-first

The farmer should see the most important answer first and choose deeper information when needed.

Use:

```text
SHORT SUMMARY
↓
ACTION BUTTONS
↓
DETAIL PAGE / BOTTOM SHEET
```

Do not dump every result onto one screen.

---

# 2. EXISTING INTELLIGENCE MUST REMAIN

The following are NOT optional future features. If they already exist in the application or product design, keep them integrated:

## Crop Disease Detection
Scan → Disease

## Pest Detection
Scan → Pest

## IPM-Based Management
Scan → IPM / Prevention

## Nutrition Guidance
Scan → Nutrition

## Water / Irrigation Guidance
Scan → Water

## Crop Health
Scan / Fields → Health

## Crop Management
Crops

## Risk Assessment
Fields / Alerts

## Scan Comparison
Scan → Compare

## Action Recommendations
Summary + relevant detail pages

## Efficient Resource Use
Recommendations should help avoid unnecessary:

- Water
- Fertilizer
- Pesticide usage
- Repeated field inspection
- Labour in unaffected areas

Do not claim precise resource savings unless measured.

## Weather-Based Guidance
Weather → risk/recommendation pipeline

## AI Assistant
Global AgriSight Assistant

## Multilingual / Voice
English + Bengali + Hindi where supported

## Field Intelligence
Fields

## Spatial Health
Fields → Spatial Health / Heatmap

## Analysis History
Analysis

---

# 3. SCAN RESULT — NEW COMPACT FORMAT

When a scan completes, show a short overview.

Example:

```text
🌿 Tomato

⚠ Possible Early Blight
Risk: Medium

Needs attention today.

[ Disease ]
[ Pest ]
[ Nutrition ]
[ Water ]
[ IPM ]
[ Compare ]
```

Do not show every explanation, chart, recommendation, symptom, confidence value, and history on the same screen.

Only show buttons for information that actually exists.

---

# 4. DISEASE DETAIL

```text
DISEASE

Possible Early Blight
Risk: Medium

Why:
• Brown lesions visible
• Yellowing around affected area

What to do:
• Inspect nearby leaves
• Remove severely affected leaves
• Follow appropriate IPM guidance

[ Ask AgriSight ]
[ Back ]
```

Keep it concise.

---

# 5. PEST DETAIL

```text
PEST

Aphid activity detected

Risk: Medium

What to do:
• Inspect nearby plants
• Check new growth
• Monitor spread

[ IPM Guidance ]
[ Compare ]
[ Back ]
```

Do not make unsupported claims.

---

# 6. IPM — MUST REMAIN A FIRST-CLASS FEATURE

IPM means Integrated Pest Management.

Do not remove or hide it merely because the UI is being simplified.

Place it behind:

```text
[ IPM ]
```

or:

```text
[ Prevention / IPM ]
```

Example:

```text
INTEGRATED PEST MANAGEMENT

Priority:
Monitor + Contain

Actions:
1. Inspect nearby plants
2. Remove severely affected material
3. Improve airflow where appropriate
4. Monitor disease/pest progression
5. Prefer appropriate non-chemical controls where practical
6. Use approved control measures only when necessary

[ Why these actions? ]
[ Ask AgriSight ]
[ Back ]
```

The system should use IPM as a decision layer connecting:

```text
Disease
+
Pest
+
Crop Stage
+
Weather
+
Field Context
↓
IPM Recommendation
```

Do not automatically recommend pesticides merely because a disease/pest was detected.

---

# 7. NUTRITION DETAIL

```text
NUTRITION

Possible nutrient issue:
Nitrogen

What to do:
• Check crop symptoms
• Confirm with soil testing where appropriate
• Follow crop-specific guidance

[ Compare ]
[ Back ]
```

Do not present image-only nutrient screening as definitive.

---

# 8. WATER DETAIL

```text
WATER

Water-stress risk:
Medium

Guidance:
Irrigation may be needed.

Best window:
Early morning

Why:
Low rainfall probability
High temperature
```

If there are no real IoT sensors yet, never display invented soil-moisture values.

Clearly distinguish:

```text
Estimated water-stress risk
```

from:

```text
Measured soil moisture
```

---

# 9. EFFICIENT RESOURCE USE

AgriSight should encourage responsible use of resources.

Connect recommendations to:

```text
Water efficiency
Fertilizer efficiency
IPM / targeted pest control
Targeted inspection
Avoid unnecessary treatments
```

Example:

```text
RESOURCE TIP

Avoid unnecessary irrigation today.
Rain probability is high.

[ View Reason ]
```

Do not promise exact litres, kilograms, money, or percentage savings unless the system actually calculates and supports those figures.

---

# 10. COMPARE FEATURE

Keep the Compare capability.

The scan overview should include:

```text
[ Compare ]
```

Allow selecting previous scans from the same field/crop.

Example:

```text
COMPARE

Current Scan
Aug 27
Risk: Medium

Previous Scan
Aug 24
Risk: High

Disease Risk
↓ Reduced

Health
76 → 84

Status:
Improving
```

Use:

```text
↑ Increased
↓ Reduced
→ No major change
```

Show only meaningful differences.

---

# 11. AI ASSISTANT — CRISP MODE

The assistant must NOT show a giant explanation by default.

Default format:

```text
🌿 Possible early blight.

Risk: Medium

Today:
• Inspect nearby leaves
• Remove badly affected leaves
• Monitor tomorrow

[ More Details ]
```

The AI should answer:

```text
What's happening?
↓
Risk
↓
What should I do?
```

Keep the default response around 2–5 short lines plus 1–3 actions.

Long explanations only appear after:

```text
[ More Details ]
```

or an explicit request.

---

# 12. AI ASSISTANT — CONTEXT

The assistant should use relevant existing context:

```text
User
Field
Crop
Crop Stage
Recent Scans
Disease
Pest
Nutrition
Water Risk
Weather
Alerts
Recommendations
```

Do not ask for information the application already knows.

Do not send unnecessary entire-database context.

---

# 13. AI ACTION BUTTONS

Where useful, show:

```text
[ Why? ]
[ What should I do? ]
[ Prevention / IPM ]
[ Compare ]
```

For navigation requests:

```text
"Show my high-risk fields."
→ Open Fields filtered by high risk

"Show today's alerts."
→ Open Alerts

"Scan this crop."
→ Open Scan
```

Never execute destructive actions without confirmation.

---

# 14. HOME / DASHBOARD

Keep Home minimal.

Home contains only:

```text
Greeting
↓
Weather
↓
Scan Crop
↓
Important Alerts
↓
Ask AgriSight
```

Optional:

```text
Small real Farm Health summary
```

Do NOT bring back:

- Full Field View
- Full field list
- Full heatmap
- Detailed analytics
- Full scan history
- Large crop tables
- Huge recommendation panels

Those belong in the sidebar/pages.

---

# 15. SIDEBAR INFORMATION ARCHITECTURE

Use:

```text
HOME
CROPS
FIELDS
SCAN
ALERTS
ANALYSIS
AI ASSISTANT
SETTINGS
```

## Crops
- Crop management
- Crop stage
- Nutrition
- Crop history

## Fields
- Field details
- Field image
- Health
- Risks
- Spatial health
- Heatmap
- Field scans
- Recommendations

## Scan
- Camera
- Upload
- Diagnosis
- Pest
- Nutrition
- Water
- IPM
- Compare

## Alerts
- Current alerts
- Historical alerts
- Actions

## Analysis
- History
- Trends
- Comparisons
- Charts
- Detailed analytics

---

# 16. FIELD DETAIL

Keep detailed intelligence in Fields.

Recommended structure:

```text
Field Header
↓
Crop + Stage
↓
Health Summary
↓
Spatial Health
↓
Current Risks
↓
Recent Scans
↓
Recommendations
```

Use tabs/accordions if necessary.

---

# 17. SPATIAL HEALTH / HEATMAP

Keep the heatmap as a detailed field feature.

Show a compact preview first:

```text
Spatial Health
[ Map ]
[ View Full Map ]
```

Use actual:

- field data
- scan locations
- disease/pest observations
- risk information

Never use random hotspots.

Invalid/non-crop scans must never update the heatmap.

---

# 18. ANALYSIS

Advanced information belongs here:

- Scan history
- Disease trends
- Pest trends
- Nutrition observations
- Risk trends
- Health history
- Comparisons
- Charts

Do not put all of this on Home or the first scan screen.

---

# 19. ALERTS

Alerts should be action-oriented.

Example:

```text
⚠ Disease risk increasing

Field 02
Tomato

What to do:
Inspect nearby leaves today.

[ View ]
```

Home shows only the most important/current alerts.

---

# 20. MOBILE UX

The application is ultimately becoming a mobile application.

Make every screen mobile-first.

Test:

```text
320px
360px
375px
390px
414px
768px
```

No:

- horizontal scrolling
- overlapping text
- clipped buttons
- tiny controls
- hidden scan/camera controls
- AI assistant covering content

Use large touch targets.

---

# 21. MOBILE NAVIGATION

Use a simple bottom navigation or drawer.

Recommended primary destinations:

```text
Home
Fields
Scan
Alerts
AI
```

Do not put every advanced page into the bottom navigation.

---

# 22. SIMPLE / LIVELY DESIGN

"Lively" should mean useful interaction, not visual clutter.

Use:

- subtle transitions
- active button states
- gentle scan progress
- friendly icons
- clean status indicators

Avoid:

- excessive animations
- particle effects
- giant animated backgrounds
- excessive gradients
- heavy glassmorphism
- visual noise

---

# 23. CARD RULE

One card = one idea.

Good:

```text
Disease Risk
Medium
```

Good:

```text
Weather
28°C
```

Bad:

```text
One giant card containing:
weather + disease + nutrition + water +
IPM + history + charts + recommendations
```

---

# 24. PROGRESSIVE DISCLOSURE

Default:

```text
Disease Risk: Medium

[ Why? ]
```

Expanded:

```text
Humidity high
Previous symptoms detected
Crop is flowering
```

This keeps the interface clean while preserving intelligence.

---

# 25. PERFORMANCE

The simplified experience should also be faster.

Home should fetch only:

```text
User
Weather
Important Alerts
Small Health Summary
```

Do not fetch on Home:

- complete fields
- full scan history
- full heatmap
- full analytics
- large image galleries

Use:

- caching
- request deduplication
- parallel requests where appropriate
- lazy loading
- optimized images

Do not block the app shell on secondary data.

---

# 26. LOADING

Always provide immediate feedback.

Examples:

```text
Loading weather...
Loading alerts...
Analyzing crop...
Generating recommendation...
```

Never show a long blank screen.

For AI/scan operations:

```text
User action
→ immediate state
→ progress
→ result
```

---

# 27. ERROR STATES

Do not show technical errors to farmers.

Bad:

```text
ERR_SUPABASE_POSTGREST_422
```

Good:

```text
Couldn't save this field.

[ Try Again ]
```

A failure in one module must not crash the whole application.

---

# 28. NO FAKE DATA

Do not invent:

- crop names
- disease diagnoses
- confidence
- health scores
- weather
- heatmap values
- resource savings
- sensor data
- scan results

If demo data is required:

```text
DEMO_MODE=true
```

Keep it isolated.

---

# 29. IMPLEMENTATION MUST BE PHASE-WISE

Do NOT implement everything together.

## PHASE 1 — Scan Information Architecture

Implement ONLY:

- compact scan summary
- Disease button
- Pest button
- Nutrition button
- Water button
- IPM button
- Compare button
- separate detail screens
- progressive disclosure

Also preserve the existing scan accuracy rules.

Test:
- real crop
- disease
- pest if supported
- nutrition
- water
- IPM
- compare
- non-crop
- mobile
- desktop

Then:

```text
REPORT
→ STOP
→ WAIT FOR APPROVAL
```

---

## PHASE 2 — AI Assistant Compression

Implement ONLY:

- concise answers
- action-first format
- More Details
- compact suggestions
- compact voice controls
- preserve multilingual/voice functionality

Test:
- English
- Bengali
- Hindi
- text
- voice
- mobile
- desktop

Then STOP and wait.

---

## PHASE 3 — Preserve/Expose Existing Intelligence

Make sure the existing capabilities are visible through the new clean UX:

- IPM
- Disease
- Pest
- Nutrition
- Water
- Crop Health
- Crop Management
- Resource Efficiency
- Risk
- Weather
- Recommendations
- Compare

Do not create duplicates if the functionality already exists.

Then STOP.

---

## PHASE 4 — Fields Organization

Only reorganize:

- field detail
- image
- health
- spatial map
- scans
- risks
- recommendations

Then STOP.

---

## PHASE 5 — Navigation

Simplify:

- Desktop sidebar
- Mobile navigation
- Page hierarchy

Then STOP.

---

## PHASE 6 — Mobile UI

Polish:

- touch targets
- typography
- spacing
- cards
- bottom sheets
- camera UI
- voice UI
- keyboard behavior
- safe areas

Then STOP.

---

## PHASE 7 — Performance

Only then optimize:

- duplicate request removal
- caching
- lazy loading
- image optimization
- Home data minimization
- heavy feature lazy loading
- bundle cleanup
- unnecessary animation removal

Measure before/after.

Then STOP.

---

## PHASE 8 — FINAL QA

Test every major function:

```text
Home
Crops
Fields
Scan
Disease
Pest
Nutrition
Water
IPM
Compare
Alerts
Analysis
AI Assistant
Voice
Camera
```

Test mobile and desktop.

Check:

- Console
- Network
- Loading
- Error states
- Empty states
- Navigation
- Real data

Then STOP.

---

## PHASE 9 — CAPACITOR / MOBILE APP

Only after the web experience and core functionality are explicitly approved.

Then migrate using the official Capacitor workflow for an existing web app.

Typical setup:

```bash
npm install @capacitor/core
npm install -D @capacitor/cli
npx cap init
npm install @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios
npm run build
npx cap sync
```

Ensure `webDir` matches the project's actual build output.

Then:

```bash
npx cap open android
```

Test on the physical Android phone.

Do not start Edge AI or IoT yet.

---

## PHASE 10 — ANDROID RELEASE

After physical-device testing:

- App name
- Package ID
- App icon
- Splash
- Permissions
- Release configuration
- Signed AAB
- Internal testing

Only publish after real-device testing passes.

---

## PHASE 11 — EDGE AI + IOT — LAST

Do not build these now.

They come after the complete software/mobile foundation.

Future:

```text
Edge AI
→ On-device crop/plant inference
→ Offline intelligence
```

and:

```text
IoT
→ Soil moisture
→ Temperature
→ Humidity
→ Light
→ Rain
→ Sensor fusion
```

---

# FINAL UX PRINCIPLE

The farmer should never be forced to read everything at once.

Use:

```text
SCAN
↓
SHORT GIST
↓
BUTTONS
↓
CHOOSE WHAT YOU WANT
↓
DETAIL
↓
ACTION
```

Example:

```text
🌿 Tomato
⚠ Possible Early Blight
Risk: Medium

[ Disease ]
[ Pest ]
[ Nutrition ]
[ Water ]
[ IPM ]
[ Compare ]
```

This preserves the full intelligence of AgriSight without overwhelming the farmer.

---

# NON-NEGOTIABLE RULES

- Preserve existing IPM-based functionality.
- Preserve efficient/resource-aware recommendations.
- Preserve disease, pest, nutrition, water, health, risk, weather and crop-management intelligence.
- Do not duplicate already-working functionality unnecessarily.
- Do not dump all results onto one screen.
- Keep AI replies short by default.
- Keep Home minimal.
- Put detailed information in dedicated pages.
- Do not fake results.
- Do not guess crops/diseases.
- Do not fabricate confidence.
- Do not fabricate resource savings.
- Work one phase at a time.
- Test after every phase.
- Report after every phase.
- STOP after every phase.
- Wait for explicit approval before the next phase.
- Edge AI and IoT are the LAST phase.

---

# FINAL TARGET

AgriSight should feel like:

> **A simple farmer's tool powered by a sophisticated agricultural intelligence system.**

The interface is simple.

The intelligence underneath is not.

```text
SIMPLE UI
+
DISEASE
+
PEST
+
IPM
+
NUTRITION
+
WATER
+
WEATHER
+
RISK
+
CROP MANAGEMENT
+
RESOURCE EFFICIENCY
+
COMPARE
+
AI ASSISTANT
+
MULTILINGUAL VOICE
+
FIELD INTELLIGENCE
↓
AGRISIGHT
```

**Build one phase. Test it. Report it. Stop. Wait for approval.**
