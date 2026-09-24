# AgriSight — Ultimate MVP
## Field-Centric Farm Workspace — Antigravity Master Prompt

### Core Product Principle

**ONE FIELD = ONE SOURCE OF TRUTH**

AgriSight should not make farmers manage separate modules for Field, Crop, Hardware, Sensors, Scan, History, Analytics, Alerts and Recommendations.

The farmer should think:

> **“This is my field. What am I growing, how is it doing, what did I scan, what changed, and what should I do?”**

Everything should be connected to the Field.

---

# 1. ULTIMATE MVP INFORMATION ARCHITECTURE

The primary farmer experience should be:

```text
AGRISIGHT
│
├── HOME
│
├── MY FIELDS
│    │
│    ├── Field A
│    │    ├── Crop
│    │    ├── Field Health
│    │    ├── Field Conditions
│    │    ├── SCAN LEAF ★ PRIMARY ACTION
│    │    ├── Scan Results
│    │    ├── Scan History
│    │    ├── Field History
│    │    ├── Analytics
│    │    ├── Alerts
│    │    ├── Recommendations
│    │    ├── Field Node
│    │    ├── Sensors
│    │    └── Ask AgriSight
│    │
│    └── Field B
│
├── SCAN LEAF
│    └── Global entry point
│
├── ASK AGRISIGHT
│
└── PROFILE
```

**Field is the central object.**

Hardware, crop, scan, history and analytics should not feel like unrelated applications.

---

# 2. PRIMARY NAVIGATION

Use a simple farmer-facing navigation:

```text
Home
Fields
Scan Leaf
Ask AgriSight
Profile
```

Do NOT make these separate primary navigation items:

- Hardware
- Sensors
- Crop Management
- Scan History
- Field History
- Field Analytics

Those should primarily be accessible from the relevant Field.

A lightweight global History or Analytics overview is allowed for convenience, but the detailed/canonical information remains Field-specific.

---

# 3. CREATE FIELD — COMPLETE SETUP

When the farmer selects:

```text
+ Add Field
```

use one simple guided setup.

## Step 1 — Field

```text
Create Your Field

What do you call this field?

[ North Field ]

How large is it?

[ 2.4 ] [ Acres ▼ ]

Where is it?

[ Use My Location ]
[ Select on Map ]

[ Continue ]
```

Do not use technical language such as entity/resource/device binding.

---

# 4. ADD CROP IMMEDIATELY

After creating the field:

```text
What are you growing here?

🌾 Rice
🌽 Maize
🍅 Tomato
🥔 Potato
🥬 Other

Crop variety
[ Optional ]

When did you plant it?

[ 18 August 2026 ]

[ Continue ]
```

The farmer should feel like they are simply adding a crop to their field.

Do not force the user to visit a separate Crop Management page.

Keep existing Crop database models if already implemented.

---

# 5. ATTACH FIELD HARDWARE

After adding the crop, optionally connect the physical AgriSight hardware module.

Use the term:

## FIELD NODE

Example:

```text
Connect Your Field Node

Your Field Node can monitor
soil and environmental conditions.

┌────────────────────────────────────┐
│ 📡 AGRISIGHT NODE                  │
│                                    │
│ Node ID: AGRI-001                  │
│ ● Connected                        │
│                                    │
│ Sensors detected                   │
│ ✓ Soil Moisture                    │
│ ✓ Temperature                      │
│ ✓ Humidity                         │
│ ✓ Soil pH                          │
│ ✓ Water Flow                       │
│                                    │
│ [ Attach to North Field ]          │
└────────────────────────────────────┘

[ Skip for now ]
```

Hardware must be optional.

A farmer can create and use a Field without hardware.

Hardware can be connected later from the Field page.

---

# 6. FIELD READY

After setup:

```text
Your Field is Ready

🌾 North Field
Rice
2.4 acres

● Field Node Connected

[ Open Field ]

[ Scan Leaf ]
```

Do not create a complicated onboarding flow.

---

# 7. THE FIELD WORKSPACE

This is the most important screen in the MVP.

The Field page should be a complete digital representation of the physical land.

Recommended hierarchy:

```text
FIELD HEADER
      ↓
FIELD HEALTH
      ↓
FIELD CONDITIONS
      ↓
SCAN LEAF ★
      ↓
AGRISIGHT INSIGHT
      ↓
ALERTS / ATTENTION
      ↓
CROP
      ↓
FIELD NODE / SENSORS
      ↓
RECENT SCANS
      ↓
FIELD HISTORY
      ↓
FIELD ANALYTICS
      ↓
RECOMMENDATIONS
      ↓
ASK AGRISIGHT
```

Do not force the farmer into separate screens for basic field information.

The page can scroll vertically on mobile.

---

# 8. FIELD HEADER

Example:

```text
← My Fields                         ⋯

🌾 NORTH FIELD

Rice
2.4 acres
Vegetative Stage
```

Optional:

```text
Location
Field boundary
Season
Planting date
```

Keep it compact.

---

# 9. FIELD HEALTH

Immediately show the current state:

```text
● FIELD HEALTH

GOOD
```

Possible states:

```text
GOOD
ATTENTION
CRITICAL
NO DATA
```

Do not calculate or display a health status using fake data.

If there is insufficient information:

```text
FIELD HEALTH

Waiting for enough field data
```

Use icon + text, not color alone.

---

# 10. FIELD CONDITIONS

Show important current sensor values:

```text
FIELD CONDITIONS

┌──────────────┬──────────────┐
│ Soil Moisture│ Temperature  │
│ 67%          │ 28.4°C       │
├──────────────┼──────────────┤
│ Humidity     │ Soil pH      │
│ 64%          │ 6.5          │
└──────────────┴──────────────┘
```

Optional:

```text
Water Flow
0.0 L/min
```

If unavailable:

```text
pH
Not available
```

Never fabricate readings.

---

# 11. SCAN LEAF — PRIMARY FIELD ACTION

This is a **core MVP feature**.

The Field page must have a visually dominant:

```text
┌────────────────────────────────────┐
│                                    │
│          📷 SCAN LEAF              │
│                                    │
│      Check your crop health        │
│                                    │
└────────────────────────────────────┘
```

The farmer should be able to scan directly from the Field.

When launched from a Field:

```text
Field = automatically known
Crop = automatically known
```

The farmer must NOT select the Field again.

---

# 12. GLOBAL SCAN LEAF

Keep Scan Leaf in the primary navigation too.

If launched globally:

```text
SCAN LEAF

Which field is this from?

[ North Field ]
[ South Field ]

[ Continue ]
```

Then open the camera.

If launched inside a Field:

```text
Field is already selected.
Crop is already selected.
```

This gives both:

- fast access from anywhere
- contextual scanning from the Field

---

# 13. CAMERA FLOW

Support existing functionality:

- Capacitor native camera
- browser camera fallback
- gallery upload
- camera switching where supported
- image compression
- preview
- retake
- analyze

Example:

```text
NORTH FIELD

SCAN LEAF

Take a clear photo of a leaf.

[ 📷 Take Photo ]

[ Choose From Gallery ]
```

After capture:

```text
Leaf captured

[ Retake ]
[ Analyze Leaf ]
```

---

# 14. SCAN ANALYSIS PIPELINE

Conceptually:

```text
LEAF IMAGE
    ↓
CROP / NON-CROP VALIDATION
    ↓
VISION ANALYSIS
    ↓
DISEASE / PEST / NUTRITION / STRESS
    +
FIELD CONDITIONS
    +
CROP CONTEXT
    +
FIELD HISTORY
    ↓
SENSOR / CONTEXT FUSION
    ↓
LOCAL DECISION ENGINE
    ↓
FIELD RECOMMENDATION
```

Final AgriSight positioning is offline-first / Edge-AI capable.

Do not make the final product dependent on a cloud AI API.

---

# 15. CROP / NON-CROP SAFETY

Every Scan Leaf operation must validate the image.

If the image is not a crop:

```text
This doesn't appear to be a crop image.

Please take a clear photo of a leaf
or crop area.

[ Scan Again ]
```

Never use fabricated defaults such as:

```text
Tomato
Healthy
95%
```

Never fabricate:

- crop
- disease
- confidence
- severity
- recommendation

---

# 16. SCAN RESULT

Do not show a giant AI response.

Use a clear result:

```text
CROP CHECK

Possible fungal stress

Severity
MODERATE

FIELD
North Field

CROP
Rice

WHY THIS WAS FLAGGED

• Visual symptoms detected
• Humidity is elevated
• Soil moisture is high

WHAT TO DO

Inspect affected plants and follow
the recommended prevention guidance.

[ View Recommendation ]
[ Compare With Previous Scan ]
```

Relevant detail categories can include:

```text
Disease
Pest
Nutrition
Water
Risk
Treatment & Prevention
Field Context
```

Only display categories supported by actual analysis.

---

# 17. SAVE SCAN TO FIELD

Every scan must be associated with the current Field.

Conceptually:

```text
North Field
│
├── Scan 001
├── Scan 002
├── Scan 003
└── Scan 004
```

Each scan should retain, where available:

- image/reference
- timestamp
- field
- crop
- analysis
- observation
- severity
- recommendation
- sensor context

This enables longitudinal monitoring.

---

# 18. SCAN HISTORY — INSIDE FIELD

The Field must have a dedicated Scan History section.

Example:

```text
SCAN HISTORY

[ All ] [ Healthy ] [ Attention ] [ Critical ]

Today
┌───────────────────────────────┐
│ Leaf Scan                     │
│ Possible stress               │
│ 10:42 AM                      │
│ [ View ]                      │
└───────────────────────────────┘

Yesterday
┌───────────────────────────────┐
│ Leaf Scan                     │
│ Healthy                       │
│ 04:20 PM                      │
│ [ View ]                      │
└───────────────────────────────┘
```

The farmer should be able to review how the crop has changed over time.

---

# 19. FIELD HISTORY — GENERAL FIELD TIMELINE

In addition to Scan History, create a broader:

## FIELD HISTORY

This is the chronological story of the field.

Example:

```text
FIELD HISTORY

TODAY
10:42 AM
Leaf scanned
Possible fungal stress

YESTERDAY
04:20 PM
Leaf scanned
Healthy

18 SEP
09:12 AM
Field Node connected

17 SEP
06:30 PM
Irrigation event

15 SEP
10:10 AM
Crop health check
Healthy
```

History can contain:

- scans
- sensor events
- alerts
- recommendations
- irrigation events
- hardware connection/disconnection
- field changes
- important crop events

The full canonical history remains attached to the Field.

---

# 20. GENERAL HISTORY

A lightweight global Recent Activity page is allowed.

Example:

```text
RECENT ACTIVITY

North Field
Leaf Scan — Today

South Field
Alert — Yesterday

North Field
Field Node Connected — 18 Sep
```

Clicking an item should navigate to the relevant Field.

Do NOT duplicate the entire database history globally.

The Field remains the source of truth.

---

# 21. SCAN COMPARISON

If existing Scan Comparison functionality exists, preserve it.

Allow:

```text
Previous Scan
      VS
Current Scan
```

Example:

```text
COMPARE SCANS

18 Sep              24 Sep

[ Leaf Image ]      [ Leaf Image ]

Observation

Current scan shows changes
compared with the previous scan.

[ View Detailed Comparison ]
```

This should be accessible from:

```text
Field → Scan History → Scan → Compare
```

---

# 22. FIELD ANALYTICS — REQUIRED

Analytics must exist inside the Field.

The farmer should NOT have to go:

```text
Analytics
→ Select Field
→ Select Crop
→ Select Date
```

Instead:

```text
North Field
    ↓
Analytics
```

Show:

```text
FIELD ANALYTICS

Crop Health
84%

Scans
7

Disease Observations
2

Water Usage
32 L today

Soil Moisture
67%

Current Risk
LOW
```

Use actual data only.

---

# 23. ANALYTICS TRENDS

Where sufficient data exists:

```text
7 DAY FIELD TREND

Soil Moisture
╱╲___╱╲__

Temperature
╲╱╲___╱

Crop Health
╱────╲──╱
```

Time filters:

```text
7 Days
30 Days
Season
```

If there is not enough data:

```text
Not enough data yet
```

Do not generate fake graphs.

---

# 24. ANALYTICS CATEGORIES

Keep analytics farmer-focused.

### Crop Health
- health trend
- scan activity
- recurring observations

### Water
- soil moisture trend
- irrigation events
- water flow
- measured water usage

### Disease / Pest
- observed issues
- frequency
- severity trend

### Environment
- temperature
- humidity
- pH
- risk conditions

### Field Activity
- scans
- alerts
- recommendations
- hardware activity

Do not turn the MVP into an enterprise analytics platform.

---

# 25. GLOBAL ANALYTICS OVERVIEW

A lightweight general Analytics page is allowed.

Example:

```text
FARM OVERVIEW

Fields
3

Healthy
2

Needs Attention
1

Recent Scans
7

Connected Field Nodes
2
```

Clicking a metric should take the farmer to the relevant Field.

Detailed analytics remain Field-specific.

---

# 26. AGRISIGHT FIELD INSIGHT

Place a concise intelligent summary inside the Field.

Example:

```text
🤖 AGRISIGHT INSIGHT

Your rice crop is currently showing
stable field conditions.

Soil moisture is within the configured
range.

No immediate action is required.
```

When attention is needed:

```text
🤖 AGRISIGHT INSIGHT

Your field needs attention.

Recent leaf observations combined with
current humidity indicate increased
disease-risk conditions.

[ View Recommendation ]
```

Keep this concise.

---

# 27. ALERTS

Alerts belong to the Field.

Example:

```text
⚠ ATTENTION

Soil moisture is approaching
the configured irrigation threshold.

[ View Recommendation ]
```

Another:

```text
⚠ CROP RISK

Recent scans show repeated stress
observations.

[ Review Scan History ]
```

Every alert should have a useful action.

---

# 28. RECOMMENDATIONS

Add:

```text
RECOMMENDED ACTIONS
```

Example:

```text
1. Inspect affected plants
2. Monitor moisture
3. Re-scan after the recommended interval
```

Separate:

```text
Observation
Possible cause
Recommended action
```

Do not present uncertain AI output as a guaranteed diagnosis.

---

# 29. ASK AGRISIGHT — FIELD CONTEXT

Inside every Field:

```text
Ask AgriSight about this field

🎙 Speak
```

The assistant automatically receives the current Field context.

It may use:

- crop
- crop stage
- sensor readings
- recent scans
- field history
- alerts
- recommendations

Example questions:

> “Should I water this field?”

> “What changed in my field this week?”

> “Show me my recent scans.”

> “আমার জমির অবস্থা কেমন?”

> “इस खेत में पानी देना चाहिए?”

Keep answers:

```text
ANSWER
↓
WHY
↓
ACTION
```

Preserve existing English/Hindi/Bengali voice functionality.

---

# 30. FIELD NODE

Hardware should feel like part of the Field.

Use:

```text
FIELD NODE

AgriSight Node #001

● CONNECTED

Sensors

✓ Soil Moisture
✓ Temperature
✓ Humidity
✓ pH
✓ Water Flow

Last update
2 minutes ago

[ View Sensors ]
[ Hardware Settings ]
```

Technical diagnostics can be hidden under Advanced/Hardware Settings.

---

# 31. FIELD NODE OFFLINE

If disconnected:

```text
FIELD NODE

AgriSight Node #001

○ OFFLINE

Last update
18 minutes ago

Your field can still be used.
Some live sensor readings are unavailable.

[ Troubleshoot ]
```

Do not break the Field page because the hardware is offline.

---

# 32. FIELD SENSOR VIEW

Optional detail view:

```text
FIELD SENSORS

Soil Moisture
67%
Updated 2 min ago

Temperature
28.4°C
Updated 2 min ago

Humidity
64%
Updated 2 min ago

pH
6.5
Updated 3 min ago
```

If unavailable:

```text
Not available
```

Never fake values.

---

# 33. FIELD ZONES

If multiple sensor zones are available:

```text
NORTH FIELD

ZONE 1
Moisture 67%

ZONE 2
Moisture 43%
```

Make zone information understandable without exposing raw GPIO/ADC details.

---

# 34. IRRIGATION

If pump control is implemented:

```text
Soil Moisture
      ↓
ESP32
      ↓
Deterministic safety/control rules
      ↓
Relay / MOSFET
      ↓
Pump
```

AI may recommend irrigation.

Safety/control rules govern actual actuation.

Never connect a pump directly to an ESP32 GPIO.

---

# 35. OFFLINE-FIRST ARCHITECTURE

Core operation:

```text
CAMERA + VOICE + SENSORS
          ↓
QUALCOMM EDGE AI
          ↓
VISION / SPEECH / SENSOR AI
          ↓
SENSOR + CONTEXT FUSION
          ↓
LOCAL DECISION ENGINE
          ↓
LOCAL KNOWLEDGE BASE
          ↓
FIELD RECOMMENDATION
          ↓
FARMER
```

Internet is optional for:

- synchronization
- backup
- model updates
- centralized analytics
- remote monitoring
- firmware updates

The Field must remain usable offline.

---

# 36. LOCAL FIELD DATA

Offline-capable data should include:

- field details
- crop details
- recent sensor readings
- scans
- analysis results
- scan history
- field history
- recommendations
- alerts
- language preference
- relevant settings

Use the existing local-storage architecture where possible.

Do not introduce a new database technology unnecessarily.

---

# 37. FINAL SYSTEM ARCHITECTURE

```text
                 AGRISIGHT FIELD
                       │
        ┌──────────────┼──────────────┐
        │              │              │
      CAMERA          VOICE         SENSORS
        │              │              │
        │              │       ┌──────┴────────────┐
        │              │       │ ESP32 FIELD NODE │
        │              │       └──────┬────────────┘
        │              │              │
        │              │       Moisture / Temp /
        │              │       Humidity / pH / Flow
        │              │
        └──────────────┼──────────────┘
                       ↓
              QUALCOMM EDGE AI
                       ↓
             MULTIMODAL ANALYSIS
                       ↓
                SENSOR FUSION
                       ↓
               DECISION ENGINE
                       ↓
       ┌───────────────┼────────────────┐
       ↓               ↓                ↓
    DISEASE          WATER            RISK
       ↓               ↓                ↓
    PEST            NUTRITION        CLIMATE
       └───────────────┼────────────────┘
                       ↓
                  FIELD INSIGHT
                       ↓
            RECOMMENDATION / ALERT
                       ↓
                    FARMER
```

---

# 38. FARMER-FACING TERMINOLOGY

Use:

| Technical | Farmer-facing |
|---|---|
| Field Management | My Fields |
| Crop Profile | Crop |
| IoT Device | Field Node |
| Sensor Configuration | Field Sensors |
| AI Analysis | Crop Check |
| Scan History | Scan History |
| Field History | Field History |
| Analytics | Field Analytics |
| AI Assistant | Ask AgriSight |
| Sensor Readings | Field Conditions |
| Disease Progression | Crop Health Trend |
| IPM | Treatment & Prevention |

---

# 39. MOBILE-FIRST DESIGN

Test:

```text
360 × 800
375 × 812
390 × 844
412 × 915
```

Recommended mobile Field hierarchy:

```text
┌────────────────────────────┐
│ ← North Field          ⋯   │
│                            │
│ 🌾 Rice                    │
│ 2.4 acres                  │
│                            │
│ ● FIELD HEALTH             │
│ GOOD                       │
│                            │
│ Moisture 67%               │
│ Temp 28.4°C                │
│ Humidity 64%               │
│ pH 6.5                     │
│                            │
│ ┌────────────────────────┐ │
│ │      📷 SCAN LEAF      │ │
│ └────────────────────────┘ │
│                            │
│ 🤖 Field Insight           │
│                            │
│ ⚠ Alerts                  │
│                            │
│ 📡 Field Node              │
│                            │
│ 📷 Recent Scans            │
│                            │
│ 📜 Field History           │
│                            │
│ 📊 Field Analytics         │
│                            │
│ 💡 Recommendations         │
│                            │
│ 🎙 Ask AgriSight          │
│                            │
├────────────────────────────┤
│ Home Fields Scan Ask Profile│
└────────────────────────────┘
```

No horizontal scrolling.

Large touch targets.

The Scan Leaf CTA should be immediately discoverable.

---

# 40. DESKTOP DESIGN

Desktop should use the same mental model.

Example:

```text
┌────────────┬───────────────────────────────────────────┐
│ Overview   │ NORTH FIELD                              │
│ Fields     │ Rice • 2.4 acres                         │
│ Scan Leaf  │                                           │
│ Alerts     │ Field Health     Conditions               │
│ Analytics  │                                           │
│ Ask        │ [ 📷 SCAN LEAF ]                        │
│ Profile    │                                           │
│ Settings   │ Field Insight     Field Node              │
│            │                                           │
│            │ Recent Scans       Field History          │
│            │                                           │
│            │ Field Analytics   Recommendations         │
└────────────┴───────────────────────────────────────────┘
```

Do not create a completely different desktop architecture.

---

# 41. VISUAL DESIGN

Continue the AgriSight **FIELD INTELLIGENCE** visual language.

Use:

- deep charcoal
- warm ivory
- muted botanical green
- sage
- clay
- amber
- restrained critical red
- editorial typography
- strong hierarchy
- thin borders
- minimal shadows
- real crop imagery where useful
- large readable numbers
- clear status indicators

Avoid:

- generic bright-green farming dashboards
- cartoon farmers
- excessive leaf graphics
- generic AI robot illustrations
- giant gradients
- excessive rounded cards
- excessive shadows
- too many floating buttons
- every element being a card
- overly futuristic sci-fi UI
- engineering-style IoT dashboards

Target:

**Professional + agricultural + trustworthy + modern + simple.**

---

# 42. DATA INTEGRITY

CRITICAL.

Never fabricate:

- sensor readings
- crop
- disease
- pest
- nutrition deficiency
- confidence
- severity
- analytics
- recommendations
- history
- field health

Do not use:

```text
result?.crop || "Tomato"
result?.diagnosis || "Healthy Plant"
```

If unavailable:

```text
Not available
```

or:

```text
Waiting for data
```

---

# 43. EXISTING FUNCTIONALITY MUST REMAIN

Do not remove or break:

- authentication
- signup/login
- Google authentication if configured
- profile
- crop management
- field management
- camera
- image upload
- image compression
- crop/non-crop validation
- AI analysis
- disease analysis
- pest analysis
- nutrition analysis
- water analysis
- IPM
- scan history
- scan comparison
- disease progression
- alerts
- analytics
- AI assistant
- voice input/output
- English/Hindi/Bengali support
- offline-first behavior
- Capacitor Android
- native camera
- network detection
- Android back handling
- IoT integration
- sensor integration
- irrigation control if implemented

Refactor the experience around the Field instead of deleting functionality.

---

# 44. DO NOT CREATE A SECOND APPLICATION

Modify the existing AgriSight repository.

Do NOT create:

```text
new-app/
new-dashboard/
new-field-app/
farmer-app/
agrifield/
```

Reuse the existing architecture.

---

# 45. IMPLEMENTATION WORKFLOW

Follow exactly:

```text
INSPECT
   ↓
MAP
   ↓
PLAN
   ↓
IMPLEMENT
   ↓
INTEGRATE
   ↓
POLISH
   ↓
TEST
   ↓
BUILD
   ↓
VERIFY
   ↓
REPORT
   ↓
STOP
```

## Inspect

Find existing:

- Field routes
- Crop routes
- Scan routes
- Analysis routes
- History
- Analytics
- Alerts
- Hardware
- IoT
- Sensors
- Assistant
- Voice
- Camera
- API services
- database models
- hooks
- stores
- types
- Capacitor code
- Android code

## Map

Create an internal map:

```text
Crop Profile
→ Field → Crop

Hardware
→ Field → Field Node

Sensors
→ Field → Field Conditions

Scan
→ Field → Scan Leaf

Scan History
→ Field → Scan History

Field History
→ Field → Field History

Analytics
→ Field → Field Analytics

Alerts
→ Field → Alerts

Assistant
→ Field → Ask AgriSight
```

## Implement priority

1. My Fields
2. Create Field
3. Add Crop
4. Attach Field Node
5. Field Workspace
6. Scan Leaf
7. Scan Result
8. Save Scan
9. Scan History
10. Field History
11. Field Analytics
12. Alerts
13. Recommendations
14. Ask AgriSight
15. Optional global History/Analytics overview

---

# 46. TESTING

Test all of the following:

- Create Field
- Add Crop
- Skip hardware
- Attach Field Node
- View sensor readings
- Scan Leaf from Field
- Global Scan Leaf
- Camera
- Gallery upload
- Image compression
- Crop validation
- Non-crop rejection
- Analysis
- Save scan
- Scan History
- Field History
- Scan Comparison
- Field Analytics
- General Analytics overview
- Alerts
- Recommendations
- Ask AgriSight
- Voice
- English
- Hindi
- Bengali
- Offline mode
- Online synchronization
- Authentication
- Android back button
- Capacitor
- Mobile responsiveness
- Desktop responsiveness

---

# 47. BUILD VALIDATION

Run appropriate project checks:

- TypeScript
- ESLint
- production build
- Capacitor sync
- Android build/configuration validation

Fix errors introduced by the redesign.

Do not leave broken imports, routes or assets.

---

# 48. SUCCESS CRITERIA

The MVP is complete only when:

- [ ] Field is the central entity.
- [ ] Farmer can create a Field.
- [ ] Farmer can add Crop during setup.
- [ ] Farmer can optionally attach Field Node.
- [ ] Farmer can skip hardware.
- [ ] Field shows crop context.
- [ ] Field shows health.
- [ ] Field shows current conditions.
- [ ] Field has prominent Scan Leaf CTA.
- [ ] Scan Leaf from Field automatically knows Field.
- [ ] Global Scan Leaf can select Field.
- [ ] Camera works.
- [ ] Gallery works.
- [ ] Image compression works.
- [ ] Crop/non-crop validation works.
- [ ] Analysis works.
- [ ] Scan is saved to Field.
- [ ] Scan History exists.
- [ ] Field History exists.
- [ ] Scan Comparison exists where supported.
- [ ] Field Analytics exists.
- [ ] General Analytics overview can exist as convenience.
- [ ] Alerts belong to Field.
- [ ] Recommendations belong to Field.
- [ ] Field Node belongs to Field.
- [ ] Sensors belong to Field/Field Node.
- [ ] Ask AgriSight receives Field context.
- [ ] Voice works.
- [ ] English/Hindi/Bengali remain supported.
- [ ] Offline-first functionality remains.
- [ ] Mobile works.
- [ ] Desktop works.
- [ ] Existing authentication remains.
- [ ] Existing Capacitor functionality remains.
- [ ] No fake data.
- [ ] No duplicate app.
- [ ] No unnecessary functionality removed.
- [ ] Production build succeeds.
- [ ] Capacitor sync succeeds.
- [ ] Android remains valid.

---

# 49. FINAL USER JOURNEY

The ideal farmer journey is:

```text
OPEN AGRISIGHT
      ↓
MY FIELDS
      ↓
+ ADD FIELD
      ↓
NAME + AREA + LOCATION
      ↓
ADD CROP
      ↓
OPTIONALLY CONNECT FIELD NODE
      ↓
FIELD READY
      ↓
OPEN FIELD
      ↓
┌─────────────────────────────────────┐
│             NORTH FIELD             │
│                                     │
│ 🌾 Rice                             │
│ 2.4 acres                           │
│                                     │
│ ● FIELD HEALTH: GOOD                │
│                                     │
│ Moisture 67%   Temp 28.4°C          │
│ Humidity 64%   pH 6.5               │
│                                     │
│         [ 📷 SCAN LEAF ]            │
│                                     │
│ 🤖 Field Insight                    │
│                                     │
│ ⚠ Alerts                            │
│                                     │
│ 📡 Field Node                       │
│                                     │
│ 📷 Recent Scans                     │
│                                     │
│ 📜 Field History                    │
│                                     │
│ 📊 Field Analytics                  │
│                                     │
│ 💡 Recommendations                  │
│                                     │
│ 🎙 Ask AgriSight                   │
└─────────────────────────────────────┘
      ↓
SCAN LEAF
      ↓
CAPTURE
      ↓
CROP/NON-CROP VALIDATION
      ↓
EDGE AI ANALYSIS
      +
SENSOR DATA
      +
FIELD HISTORY
      ↓
RESULT
      ↓
SAVE TO FIELD HISTORY
      ↓
UPDATE FIELD ANALYTICS
      ↓
UPDATE FIELD HEALTH / ALERTS
      ↓
RECOMMENDATION
      ↓
FARMER ACTION
      ↓
NEXT SCAN
      ↓
COMPARE / MONITOR
```

This creates the complete:

**SCAN → UNDERSTAND → ACT → MONITOR → COMPARE → IMPROVE**

loop.

---

# 50. FINAL PRODUCT PRINCIPLE

The final AgriSight MVP should feel like:

> **A farmer does not manage an app.**
>
> **They manage their fields.**
>
> AgriSight gives every field its own intelligent digital workspace.

When a farmer opens:

```text
🌾 NORTH FIELD
```

they should immediately have access to:

```text
Crop
+
Field Health
+
Field Conditions
+
SCAN LEAF
+
AI Insight
+
Field Node
+
Sensors
+
Recent Scans
+
Scan History
+
Field History
+
Analytics
+
Alerts
+
Recommendations
+
Ask AgriSight
```

Everything is connected.

Everything is contextual.

The farmer should never repeatedly select the same field and crop when working inside that Field.

---

# 51. ANTIGRAVITY EXECUTION COMMAND

Now modify the **actual existing AgriSight repository**.

Do not create mockups only.

Do not create a separate application.

Do not invent data.

Do not remove working functionality.

Do not unnecessarily replace the current architecture.

Reuse existing routes, components, services, APIs, database models and functionality wherever possible.

Follow:

```text
INSPECT
→ MAP
→ PLAN
→ IMPLEMENT
→ INTEGRATE
→ POLISH
→ TEST
→ BUILD
→ VERIFY
→ REPORT
→ STOP
```

When complete, provide a concise report containing:

1. Field-centric architecture implemented
2. Files/components changed
3. Create Field flow
4. Crop integration
5. Field Node integration
6. Scan Leaf integration
7. Scan History integration
8. Field History integration
9. Field Analytics integration
10. Global History/Analytics integration if implemented
11. Alerts/recommendations integration
12. Ask AgriSight integration
13. Mobile/desktop validation
14. Tests performed
15. Build result
16. Remaining issues

Then:

**STOP AND WAIT FOR APPROVAL.**
