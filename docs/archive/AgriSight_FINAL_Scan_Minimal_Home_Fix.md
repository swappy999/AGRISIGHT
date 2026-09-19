# AgriSight — FINAL Scan + Minimal Home + Performance Fix

## Mission
Inspect the existing AgriSight codebase first. Do not rebuild from scratch or fake results. Fix root causes, test everything, and make the application SIH26180-demo ready.

Priorities:
1. Make Scan AI reliable and accurate.
2. Reject non-crop images.
3. Never default to Tomato, Healthy, or fake confidence.
4. Make Home minimal, crisp, and fast.
5. Move detailed information into sidebar pages.
6. Fix mobile UX and performance.

---

# 1. SCAN — COMPLETE PIPELINE

Trace the real flow:

```text
Camera / Upload
→ Blob/File
→ Frontend request
→ Backend endpoint
→ Image validation
→ Image preprocessing
→ Vision AI
→ Structured response
→ Parser
→ Database
→ Field
→ Result UI
```

Inspect browser console, Network tab, backend logs, Gemini/API errors, image MIME/type/size, API configuration, response parsing, and database saves.

Do not hide failures with a generic success state.

---

# 2. TWO-STAGE VISION VALIDATION

Never send every image directly to disease diagnosis.

```text
IMAGE
 ↓
QUALITY CHECK
 ↓
AGRICULTURAL CHECK
 ↓
CROP IDENTIFICATION
 ↓
CROP CONFIDENCE
 ↓
DISEASE ANALYSIS
 ↓
RESULT
```

Valid types can include:

```text
LEAF
PLANT
STEM
FRUIT
CROP_FIELD
AGRICULTURAL_CONTEXT
```

Reject:

```text
PERSON
FACE/SELFIE
ANIMAL
VEHICLE
LAPTOP
PHONE
ROOM
BUILDING
DOCUMENT
SCREENSHOT
RANDOM OBJECT
UNRELATED SCENE
UNKNOWN
```

For non-crop:

```text
⚠️ Invalid Crop Image

This image does not appear to contain a crop
or plant suitable for agricultural analysis.

[ Retake ]
[ Upload Another ]
```

Do not run disease analysis.

---

# 3. CROP IDENTIFICATION

Only after agricultural validation:

```text
Crop detected?
→ Identify crop
→ Obtain legitimate confidence
```

If confidence is insufficient:

```text
⚠️ Unable to Identify Crop

Please capture a clearer image of the
leaf, plant, stem, or fruit.
```

Never guess.

Never default to Tomato.

---

# 4. DISEASE ANALYSIS

Run only if:

```text
is_agricultural = true
AND crop_detected = true
AND crop_confidence >= configured threshold
AND image_quality = acceptable
```

Analyze:

```text
Visible symptoms
→ Possible disease
→ Legitimate confidence
→ Severity
→ Risk
→ Recommendation
```

If evidence is insufficient:

```text
⚠️ Diagnosis Uncertain

There is not enough visual evidence to
confidently identify a disease.

[ Retake Photo ]
```

Do not invent a disease.

---

# 5. NEVER DEFAULT

Search the whole project for:

```text
Tomato
tomato
Healthy Plant
Healthy
95%
98%
defaultCrop
fallbackCrop
defaultDiagnosis
fallbackResult
mockDiagnosis
```

Remove patterns such as:

```javascript
result?.crop || "Tomato"
result?.diagnosis || "Healthy Plant"
result?.confidence || 95
```

Use explicit `null`, `UNKNOWN`, or `UNCERTAIN` states.

A healthy result must be evidence-based.

Confidence must come from the model or a documented calculation.

---

# 6. STRUCTURED AI RESPONSE

Require structured output, for example:

```json
{
  "validation": {
    "is_agricultural": true,
    "image_type": "leaf",
    "quality": "good"
  },
  "crop": {
    "detected": true,
    "name": "tomato",
    "confidence": 0.91
  },
  "diagnosis": {
    "disease_detected": true,
    "disease": "Early Blight",
    "confidence": 0.88,
    "severity": "moderate"
  },
  "recommendations": []
}
```

For non-crop:

```json
{
  "validation": {
    "is_agricultural": false,
    "image_type": "human",
    "quality": "good"
  },
  "crop": {
    "detected": false,
    "name": null,
    "confidence": 0
  },
  "diagnosis": null
}
```

Backend must enforce this structure.

---

# 7. GEMINI VISION INSTRUCTION

Update the existing vision prompt with this logic:

```text
You are an agricultural crop-image validation and diagnosis system.

FIRST determine whether the uploaded image actually contains
a plant, crop, leaf, stem, fruit, or agricultural field.

Do not assume every image is agricultural.

If the image contains people, faces, animals, vehicles,
buildings, rooms, phones, laptops, documents, screenshots,
food, random objects, or unrelated scenes, classify it as NON_CROP.

If the image is ambiguous or insufficient for crop identification,
classify it as UNCERTAIN.

Never guess the crop.
Never default to tomato.
Never default to healthy.
Never fabricate confidence.
Never diagnose disease from a non-crop image.

Only perform disease analysis after agricultural validation
and sufficiently confident crop identification.

Return structured JSON.
```

Also enforce these rules in backend code. Do not rely on prompting alone.

---

# 8. PREVENT STALE RESULTS

When a new scan starts, clear:

```text
crop
diagnosis
confidence
severity
health
recommendation
```

Audit React state, React Query, Zustand/Redux, localStorage, sessionStorage, URL state, and caches.

Test:

```text
Tomato scan
→ New person image
→ NON_CROP
→ crop = null
→ diagnosis = null
```

No previous result may leak into a new scan.

---

# 9. DATABASE PROTECTION

Rejected scans must not create diagnoses or modify farm intelligence.

For rejected images:

```text
scan_status = rejected
image_type = non_crop
crop = null
diagnosis = null
```

Do not update:

- field health
- disease risk
- crop history
- disease events
- heatmap

unless the scan is valid.

---

# 10. SCAN UI

Keep the scanner simple.

### Initial

```text
Scan Crop

Take a clear photo of a leaf,
plant, stem, or fruit.

[ Turn On Camera ]
[ Upload Image ]
```

### Camera

```text
LIVE CAMERA

[ Capture ]

Camera Active ●
```

### Preview

```text
Crop Preview

[ image ]

[ Retake ]   [ Analyze ]
```

### Processing

```text
Uploading image...
Validating crop...
Analyzing symptoms...
Generating diagnosis...
```

### Result

Only render actual structured result data.

---

# 11. HOME PAGE — MINIMAL REDESIGN

The current Home page contains unnecessary content such as Field View and detailed field information.

Remove unnecessary field-management content from Home.

Home should be a **minimal quick command center**, not a full analytics dashboard.

It should answer only:

```text
How is the farm doing now?
What needs attention?
What is the weather?
Can I scan something?
Can I quickly ask AgriSight?
```

---

# 12. KEEP ONLY IMPORTANT HOME CONTENT

Keep:

- Greeting
- Weather
- Quick Scan
- Important/current alerts
- Compact AI Assistant
- Optional tiny real health summary

Remove from Home:

- Full Field View
- Full field list
- Field boundaries
- Detailed field map
- Detailed heatmap
- Full scan history
- Large analytics
- Detailed crop tables
- Large charts
- Extensive recommendations
- Duplicate statistics
- Large management cards

Move these into their dedicated sidebar pages.

---

# 13. RECOMMENDED HOME STRUCTURE

```text
Good morning, Farmer
Here's what needs your attention.

[ Weather ]
28°C • Partly Cloudy
Humidity • Rain • Wind

[ Scan Your Crop ]
Detect crop health & disease
[ Scan Now ]

[ Important Alerts ]
2 issues need attention
[ View Alerts ]

[ Ask AgriSight ]
Quick agricultural assistance
[ Ask AI ]
```

Keep the layout compact.

The Scan action should be one of the strongest actions on Home.

---

# 14. INFORMATION ARCHITECTURE

Use the sidebar for detailed information:

```text
HOME

CROPS
 └─ Crop management

FIELDS
 ├─ All Fields
 ├─ Field Details
 └─ Spatial Health

SCAN
 ├─ Camera
 ├─ Upload
 └─ Diagnosis

ALERTS
 └─ All Alerts

ANALYSIS
 ├─ Scan History
 ├─ Disease Trends
 └─ Analytics

AI ASSISTANT

SETTINGS
```

Home is the command center. Other pages contain detail.

---

# 15. FIELD INFORMATION BELONGS IN FIELDS

Move:

- Field View
- Field list
- Field map
- Field boundaries
- Field health
- Spatial health
- Field-specific scans
- Field analytics

to the Fields section.

Home may show only a tiny, real health summary if useful.

---

# 16. ALERTS ON HOME

Show only important/current alerts:

```text
⚠ 2 Alerts

Early disease risk detected
Field 02

Water stress increasing
Field 04

[ View All ]
```

Do not load the entire alert history on Home.

---

# 17. WEATHER ON HOME

Keep weather, but keep it compact:

```text
28°C
Partly Cloudy

Humidity 72%
Rain 20%
Wind 11 km/h
```

Weather must not become a huge dashboard.

---

# 18. AI ASSISTANT

Keep the existing assistant beside the application.

Make it:

- compact
- fast
- non-intrusive
- mobile responsive
- dismissible/minimizable

It must not cover:

- Scan buttons
- navigation
- alerts
- important content
- camera controls

On mobile use a compact floating button/bottom sheet.

---

# 19. HOME PERFORMANCE

Home must NOT fetch:

- full field data
- complete scan history
- full analytics
- full heatmap
- large field galleries
- advanced charts

unless Home actually displays them.

Home should request only:

```text
user
weather
important alerts
minimal health summary
```

Everything else loads when the user opens its dedicated page.

This is mandatory to address the current slow loading.

---

# 20. APP PERFORMANCE

Audit and fix:

- sequential API calls
- duplicate API calls
- giant `useEffect`
- effect loops
- unnecessary auth requests
- unnecessary polling
- full-table database queries
- N+1 queries
- oversized images
- heavy libraries
- unnecessary AI initialization
- large startup bundles

Parallelize independent requests where appropriate:

```javascript
Promise.all([...])
```

Cache appropriate data.

Lazy-load:

- Scan
- AI Assistant
- Heatmap/maps
- Analytics
- large charts
- history

Do not block the app shell on secondary data.

---

# 21. LOADING UX

Home should render its shell immediately.

Use skeletons for:

- weather
- alerts
- small health summary

The Scan card and navigation should be usable immediately.

If weather fails:

```text
Weather unavailable
```

but the rest of Home must remain functional.

If alerts fail, Scan must still work.

Every feature should fail independently.

---

# 22. MOBILE

Test:

```text
320px
360px
375px
390px
414px
768px
1024px
1280px
1440px
```

Fix:

- sidebar/drawer
- text overlap
- horizontal overflow
- scan
- camera
- AI assistant
- heatmap
- images
- charts
- modals
- keyboard behavior

No clipping or overlapping content.

---

# 23. PERFORMANCE / NETWORK AUDIT

Inspect browser Network tab and identify:

- duplicate requests
- slow requests
- unnecessary requests
- oversized images
- repeated auth
- repeated AI requests

Inspect Console for:

```text
No uncaught errors
No unhandled promise rejections
No repeated warnings
No debug spam
```

Run the actual production build and test the production server.

---

# 24. SECURITY

Verify:

- Gemini/API keys remain server-side
- Supabase service-role key remains server-side
- Authentication works
- RLS works
- Storage permissions work
- Secrets are not logged

---

# 25. COMPLETE TEST MATRIX

## Non-crop

- [ ] Person
- [ ] Selfie
- [ ] Laptop
- [ ] Phone
- [ ] Animal
- [ ] Car
- [ ] Room
- [ ] Random object
- [ ] Screenshot

Expected:

```text
NON_CROP
```

Never Tomato/Healthy/95%.

## Crop

- [ ] Real tomato leaf
- [ ] Real rice leaf
- [ ] Other supported crops
- [ ] Healthy plant
- [ ] Diseased plant
- [ ] Blurry plant
- [ ] Dark plant

Expected:

```text
Valid crop
→ confidence
→ disease/health only when evidence is sufficient
```

## Field

- [ ] Add field
- [ ] Save
- [ ] Immediate display
- [ ] Field image
- [ ] Health
- [ ] Scan association
- [ ] Spatial health

## Home

- [ ] Minimal
- [ ] Fast
- [ ] Weather
- [ ] Scan
- [ ] Alerts
- [ ] AI
- [ ] No Field View
- [ ] No huge analytics
- [ ] No unnecessary cards

## Mobile

- [ ] 320px
- [ ] 360px
- [ ] 375px
- [ ] 390px
- [ ] 414px
- [ ] Tablet
- [ ] Desktop

---

# 26. FINAL USER JOURNEYS

### Home

```text
Open App
→ Fast Home
→ Weather
→ Important Alerts
→ Scan Crop
→ Ask AI
```

### Scan

```text
Scan
→ Camera/Upload
→ Validate
→ Crop Identification
→ Disease Analysis
→ Result
→ Save
```

### Fields

```text
Sidebar
→ Fields
→ Select Field
→ Field Image
→ Health
→ Spatial Map
→ Scans
```

### Analysis

```text
Sidebar
→ Analysis
→ History
→ Disease Trends
→ Detailed Analytics
```

---

# 27. DEFINITION OF DONE

## Scan

- [ ] Camera works
- [ ] Upload works
- [ ] Image validation works
- [ ] Non-crop rejection works
- [ ] Crop identification works
- [ ] Confidence is real
- [ ] Disease analysis works
- [ ] Healthy result is evidence-based
- [ ] No default Tomato
- [ ] No default Healthy
- [ ] No fake confidence
- [ ] No stale results
- [ ] Result saves correctly
- [ ] Only valid scans update field intelligence

## Home

- [ ] Minimal
- [ ] Crisp
- [ ] Fast
- [ ] Weather
- [ ] Scan AI
- [ ] Important alerts
- [ ] Compact AI Assistant
- [ ] No Field View
- [ ] No full field management
- [ ] No giant analytics
- [ ] No excessive cards
- [ ] Mobile optimized

## Sidebar

- [ ] Crops
- [ ] Fields
- [ ] Scan
- [ ] Alerts
- [ ] Analysis
- [ ] AI Assistant
- [ ] Settings
- [ ] Mobile drawer

## Performance

- [ ] Home fetches only Home data
- [ ] Duplicate requests removed
- [ ] Independent requests parallelized
- [ ] Heavy features lazy-loaded
- [ ] Images optimized
- [ ] Caching used appropriately
- [ ] No blocking initialization
- [ ] No long blank screen
- [ ] Production build works

## UX

- [ ] No text overlap
- [ ] No horizontal scroll
- [ ] No broken buttons
- [ ] Clear loading states
- [ ] Clear errors
- [ ] Clear empty states
- [ ] Desktop works
- [ ] Mobile works

---

# FINAL COMMAND

**Do a complete audit before declaring AgriSight finished.**

Do not merely redesign Home.
Do not merely change the Scan UI.
Do not fake successful diagnosis.
Do not hide Gemini/API errors.
Do not add unnecessary information to Home.

Priority:

```text
1. MAKE SCAN ACTUALLY WORK
2. MAKE VISION RESULTS ACCURATE
3. REJECT NON-CROP IMAGES
4. NEVER GUESS TOMATO/HEALTHY
5. MAKE HOME MINIMAL
6. MOVE DETAIL TO SIDEBAR PAGES
7. REDUCE HOME DATA FETCHING
8. IMPROVE LOADING SPEED
9. FIX MOBILE UX
10. RUN COMPLETE PRODUCTION TEST
```

The final Home page should feel like a **farmer's quick command center**, not an analytics warehouse.

The final Scan page should feel like a **reliable agricultural diagnostic tool**, not a generic image classifier.

The final AgriSight experience should be:

```text
OPEN
↓
FAST
↓
CLEAR
↓
SCAN
↓
ACCURATE
↓
ACTIONABLE
```

Only after the complete test suite passes should the application be considered ready for the SIH26180 demonstration.
