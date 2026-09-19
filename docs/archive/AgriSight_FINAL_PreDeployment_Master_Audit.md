# AgriSight — FINAL PRE-DEPLOYMENT MASTER AUDIT
## SIH26180 | Fast • Crisp • Reliable • Accurate • Mobile-First

## Mission

Do not add new features until the existing AgriSight application is stable, fast, accurate, responsive, and demo-ready.

**Inspect the entire existing codebase first. Find root causes. Fix them. Test them. Do not rebuild from scratch, fake results, or hide errors with UI changes.**

---

# 1. PERFORMANCE FIRST — FIX THE SLOW LOADING

The application currently takes too long to load.

Do NOT simply add a spinner. Find the actual bottleneck.

Audit the complete startup chain:

```text
Browser
→ JS download
→ JS parse/execution
→ App shell
→ Authentication
→ Database requests
→ API requests
→ Images
→ Charts/maps
→ AI initialization
→ Final render
```

Measure each stage and fix the slowest ones.

### Target experience

```text
App shell: immediate
Usable UI: ideally < 2–3 seconds on a normal connection
Cached navigation: near-instant
Small database actions: ideally < 500 ms
AI actions: immediate feedback + progress + result
```

AI cannot always be instant, but the UI must never freeze or remain blank.

---

# 2. APP SHELL MUST RENDER FIRST

Do not block the entire application waiting for every API.

Bad:

```text
Auth → fields → crops → alerts → scans → AI → render
```

Good:

```text
Render shell immediately
→ Load critical data
→ Load secondary data progressively
```

Render immediately:

- Header
- Sidebar/navigation
- Page structure
- Skeletons
- Main content layout

Then populate data.

---

# 3. REMOVE BLOCKING INITIALIZATION

Audit:

- giant `useEffect`
- sequential `await`s
- unnecessary authentication waits
- AI initialization during startup
- weather initialization before rendering
- map initialization before it is visible
- image loading before text
- unrelated database calls blocking page rendering

Only block on genuinely critical data.

---

# 4. PARALLELIZE INDEPENDENT REQUESTS

Find sequential calls such as:

```javascript
const fields = await getFields();
const crops = await getCrops();
const alerts = await getAlerts();
const scans = await getScans();
```

If independent, fetch concurrently:

```javascript
const [fields, crops, alerts, scans] = await Promise.all([
  getFields(),
  getCrops(),
  getAlerts(),
  getScans()
]);
```

Use the existing architecture appropriately.

---

# 5. STOP DUPLICATE REQUESTS

Inspect the browser Network tab.

Find repeated identical requests.

Audit:

- duplicate `useEffect`
- React Strict Mode issues
- repeated hooks
- remounting
- state loops
- unnecessary polling
- duplicate providers
- repeated auth calls

A request should not repeat unless there is a real reason.

---

# 6. FIX REACT EFFECT LOOPS

Audit every important `useEffect`.

Find:

- unstable dependencies
- state → effect → state loops
- functions recreated every render
- fetch loops
- unnecessary cleanup/reinitialization

Do not merely disable lint warnings. Fix the architecture.

---

# 7. CACHING

Cache appropriate data:

- User/session
- Fields
- Crops
- Recent scans
- Alerts
- Analysis history
- Static agricultural metadata

Do not refetch unchanged data every time a component mounts.

Invalidate cache when data actually changes.

---

# 8. LAZY LOAD HEAVY FEATURES

Lazy-load where appropriate:

- Scan page
- AI Assistant
- Analytics
- Heatmap/maps
- Large charts
- Analysis history
- Large image galleries

Do not lazy-load the basic application shell.

---

# 9. BUNDLE AUDIT

Find:

- unused dependencies
- duplicate icon libraries
- heavy libraries
- unused imports
- server-only SDKs bundled into frontend
- unnecessary AI packages
- large assets

Remove what is unnecessary.

Never put AI/API secret keys in frontend code.

Correct architecture:

```text
Frontend
→ AgriSight backend
→ AI provider
```

---

# 10. IMAGE PERFORMANCE

Optimize all images:

- thumbnails
- compression
- WebP/AVIF where appropriate
- lazy loading
- responsive sizes
- fixed dimensions
- CDN/storage optimization

Do not load multi-megabyte originals when a thumbnail is enough.

Field pages should load:

```text
Content
→ Thumbnail
→ Full image only when needed
```

---

# 11. AI ASSISTANT PERFORMANCE

The AI Assistant must not block app startup.

Initialize it when used:

```text
Open Assistant
→ Initialize/request
→ Respond
```

Do not make unnecessary AI calls on every page.

Send only relevant context:

```text
Current field
Current crop
Recent scans
Relevant alerts
Relevant weather
User language
```

Do not send the entire database/history.

---

# 12. AI ASSISTANT UX

On request:

```text
User message
→ Immediate "Thinking..."
→ Request
→ Streaming if supported
→ Final response
```

Never freeze the application.

---

# 13. CAMERA — COMPLETE AUDIT

Camera must:

```text
Open Scan
→ Turn On Camera
→ Permission
→ getUserMedia
→ Live Preview
→ Capture
→ Preview
→ Analyze
```

Audit:

- `navigator.mediaDevices`
- permissions
- `getUserMedia`
- video ref
- `srcObject`
- `video.play()`
- stream lifecycle
- cleanup
- React effects

Handle:

- denied permission
- no camera
- camera busy
- unsupported browser
- insecure context
- invalid constraints

Always provide:

```text
Upload Image
```

as fallback.

---

# 14. CAMERA CAPTURE

Before capture verify:

```text
videoWidth > 0
videoHeight > 0
```

Flow:

```text
Video
→ Canvas
→ Blob
→ File
→ Preview
→ Analyze
```

Never submit:

- null Blob
- empty Blob
- zero-byte file
- invalid MIME type
- empty canvas

Stop camera tracks when leaving scanner, but do not accidentally stop them because of a React rerender.

---

# 15. SCAN — COMPLETE PIPELINE

Required:

```text
Camera/Upload
→ Image validation
→ Agricultural validation
→ Crop identification
→ Disease analysis
→ Structured result
→ Save
→ Field health
→ Heatmap
```

Every stage must have a real status.

Example:

```text
Uploading image...
Validating image...
Analyzing crop...
Saving analysis...
```

Never show a blank screen.

---

# 16. CRITICAL VISION SAFETY/ACCURACY FIX

A non-crop image must NEVER become:

```text
Tomato
Healthy
95%
```

Implement:

```text
IMAGE
↓
QUALITY CHECK
↓
IS AGRICULTURAL?
↓
YES                 NO
↓                   ↓
CROP ID           REJECT
↓
CONFIDENCE
↓
DISEASE
```

Reject:

- people
- selfies
- animals
- cars
- laptops
- phones
- rooms
- buildings
- documents
- screenshots
- random objects
- unrelated scenes

Return:

```text
⚠️ Invalid Crop Image

This image does not appear to contain a crop
or plant suitable for agricultural analysis.

[ Retake Photo ]
[ Upload Another ]
```

---

# 17. NEVER DEFAULT TO TOMATO

Search the entire codebase for:

```text
Tomato
tomato
Healthy Plant
defaultCrop
fallbackCrop
defaultDiagnosis
fallbackResult
mockDiagnosis
95%
98%
```

Remove fallback logic such as:

```javascript
result?.crop || "Tomato"
result?.diagnosis || "Healthy Plant"
result?.confidence || 95
```

Use explicit null/uncertain states.

**Tomato must never be a default result.**

---

# 18. NEVER DEFAULT TO HEALTHY

Do not turn:

- AI failure
- missing diagnosis
- non-crop
- low confidence
- uncertain image

into:

```text
Healthy Plant
```

A healthy result must be evidence-based.

---

# 19. NEVER FABRICATE CONFIDENCE

Confidence must come from the actual model or a documented calculation.

If unavailable:

```text
Confidence unavailable
```

Do not invent `95%`.

---

# 20. STRUCTURED VISION RESPONSE

Require a structured response.

Example:

```json
{
  "image_validation": {
    "is_agricultural": true,
    "image_type": "leaf",
    "quality": "good",
    "confidence": 0.94
  },
  "crop_identification": {
    "detected": true,
    "crop": "tomato",
    "confidence": 0.91
  }
}
```

For a person:

```json
{
  "image_validation": {
    "is_agricultural": false,
    "image_type": "human",
    "quality": "good",
    "confidence": 0.98
  },
  "crop_identification": {
    "detected": false,
    "crop": null,
    "confidence": 0
  },
  "diagnosis": null
}
```

Backend must enforce the result.

---

# 21. GEMINI VISION PROMPT REQUIREMENTS

The vision prompt must explicitly state:

```text
You are an agricultural crop-image validation and diagnosis system.

FIRST determine whether the uploaded image actually contains
a plant, crop, leaf, stem, fruit, or agricultural field.

Do NOT assume every image contains a crop.

If the image contains a person, face, room, building, vehicle,
phone, laptop, food, animal, document, screenshot, random object,
or another unrelated subject, classify it as NON_CROP.

If the image is ambiguous or insufficient for crop identification,
classify it as UNCERTAIN.

NEVER guess a crop name.
NEVER default to tomato.
NEVER default to healthy.
NEVER generate disease diagnosis for a non-crop image.
NEVER fabricate confidence.

Only perform crop-specific disease analysis after agricultural
validation and sufficiently confident crop identification.

Return structured JSON matching the required schema.
```

Do not rely only on the prompt; enforce it in backend code.

---

# 22. CROP CONFIDENCE GATE

Use a configurable threshold, e.g.:

```text
crop_confidence_threshold = 0.70
```

If below threshold:

```text
UNCERTAIN_CROP
```

Ask for a clearer image.

Do not guess.

---

# 23. PREVIOUS SCAN CONTAMINATION

When a new scan begins, reset:

```text
crop
diagnosis
confidence
severity
health
recommendation
```

Audit:

- React state
- React Query
- Zustand/Redux
- localStorage
- sessionStorage
- URL state
- cached responses

Test:

```text
Tomato scan
→ New person image
→ NON_CROP
→ crop = null
→ diagnosis = null
```

No stale tomato result.

---

# 24. DATABASE INTEGRITY

Invalid scans must not create crop diagnoses.

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

# 25. VOICE INPUT

Fix the entire voice lifecycle.

Required:

```text
IDLE
→ REQUESTING_PERMISSION
→ READY
→ LISTENING
→ TRANSCRIBING
→ AI
→ SPEAKING
→ IDLE
```

Audit:

- `SpeechRecognition`
- `webkitSpeechRecognition`
- microphone permissions
- `onstart`
- `onresult`
- `onerror`
- `onend`
- timers
- React effects
- cleanup

Fix the bug where listening starts and immediately stops.

---

# 26. MULTILINGUAL VOICE

Support where available:

```text
en-IN
bn-IN
hi-IN
```

Expected:

```text
Bengali voice
→ Bengali transcript
→ Bengali AI response
→ Bengali TTS
```

```text
Hindi voice
→ Hindi transcript
→ Hindi AI response
→ Hindi TTS
```

```text
English voice
→ English transcript
→ English AI response
→ English TTS
```

Centralize language configuration.

---

# 27. VOICE OUTPUT

Support:

```text
▶ Listen
⏸ Pause
⏹ Stop
↻ Replay
```

Handle browser autoplay restrictions correctly.

Never silently fail.

---

# 28. FIELD CREATION

Verify:

```text
Add Field
→ Validation
→ API
→ Database
→ Response
→ Immediate UI update
```

No refresh should be required.

Never show success if database insertion failed.

---

# 29. FIELD IMAGES

Trace:

```text
Upload
→ Storage
→ Database
→ URL/Signed URL
→ Frontend
→ Image
```

Fix:

- bucket
- path
- MIME type
- storage permissions
- signed URLs
- RLS
- relationships

Use thumbnails and lazy loading.

---

# 30. REAL HEATMAP

The heatmap must use real field/scan data.

Never generate random:

- hotspots
- health scores
- colors
- disease locations

Flow:

```text
Field
→ Scans
→ Diagnoses
→ Risk
→ Spatial data
→ Health calculation
→ Heatmap
```

If there is no data:

```text
No spatial health data yet.

Scan your crop to begin building
your field health map.
```

Rejected scans must never update the heatmap.

Lazy-load heavy map libraries.

---

# 31. MOBILE UI/UX

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

- sidebar
- hamburger/drawer
- bottom navigation if used
- text overlap
- horizontal scrolling
- camera
- scan
- AI assistant
- heatmap
- images
- charts
- modals
- keyboard interaction

No clipped content.

No horizontal overflow.

---

# 32. SIDEBAR

Desktop navigation:

```text
Home
My Crops
Fields
Scan Leaf
AI Assistant
Alerts
Analysis History
```

Mobile should use an appropriate drawer/navigation pattern.

Do not simply shrink the desktop sidebar.

Normal navigation should not cause full-page reloads.

---

# 33. AI ASSISTANT ON MOBILE

The floating assistant must not cover:

- buttons
- camera
- heatmap
- navigation
- important content

Use a compact mobile panel/bottom sheet where appropriate.

---

# 34. LOADING STATES

Every async operation must provide immediate feedback:

```text
Loading field...
Loading scans...
Loading health data...
Turning on camera...
Uploading image...
Validating image...
Analyzing crop...
Saving analysis...
Processing voice...
Transcribing...
Generating response...
Speaking...
```

Use skeletons for page content.

Avoid generic full-screen spinners for every operation.

---

# 35. ERROR STATES

Never expose:

- stack traces
- raw SQL
- internal API errors
- API keys
- `undefined`
- `null`

Use clear messages:

```text
Something went wrong.

[ Try Again ]
```

with useful context.

---

# 36. NETWORK/DATABASE OPTIMIZATION

Audit:

- N+1 queries
- unnecessary joins
- entire-table fetches
- missing indexes
- repeated auth queries
- oversized payloads
- unpaginated history

Use:

- selected columns
- pagination
- appropriate indexes
- caching
- efficient filters

For Supabase, verify RLS and Storage policies without disabling security.

---

# 37. POLLING / MEMORY LEAKS

Audit:

```text
setInterval
setTimeout
polling
refetchInterval
```

Remove unnecessary polling.

Clean up:

- event listeners
- timers
- media streams
- speech recognition
- speech synthesis
- subscriptions
- observers
- WebSockets

---

# 38. CONSOLE CLEANUP

Final browser console must have:

```text
NO uncaught errors
NO unhandled promise rejections
NO repeated warnings
NO failed API calls
NO debug spam
```

---

# 39. NETWORK CLEANUP

Inspect Network tab.

Every failed request must be understood.

Find:

- duplicate requests
- slow requests
- unnecessary requests
- oversized images
- repeated auth
- repeated AI calls
- slow database queries

---

# 40. PRODUCTION BUILD

Run the actual production build:

```text
npm run build
```

or the project's equivalent.

Then run the production server and test it.

Fix:

- build errors
- missing assets
- routing failures
- environment issues
- production-only runtime bugs

Do not consider development mode sufficient.

---

# 41. SECURITY

Verify:

- no AI API key in frontend
- no Supabase service-role key in frontend
- authentication works
- RLS works
- Storage permissions are correct
- CORS is correct
- sensitive backend errors are hidden
- user data is scoped correctly

---

# 42. ERROR BOUNDARIES

Protect major sections:

- Dashboard
- Fields
- Scan
- AI Assistant
- Analytics

One component failure must not crash the whole app.

---

# 43. EMPTY STATES

Create proper states:

```text
No fields yet
[ Add Field ]
```

```text
No scans yet
[ Scan Crop ]
```

```text
No alerts
You're all caught up.
```

```text
No health map data
Scan your crop to begin.
```

---

# 44. UI POLISH

Make the existing design crisp, not heavier.

Standardize:

- typography
- spacing
- border radius
- button sizes
- icons
- cards
- status colors
- shadows

Remove:

- debug content
- duplicate buttons
- duplicate cards
- unnecessary popups
- excessive animations
- excessive shadows
- awkward blank areas
- inconsistent styles
- broken icons

Animations must never delay functionality.

---

# 45. NO FAKE DATA

Production mode must not contain fake:

- crop names
- diagnoses
- health scores
- confidence
- heatmap hotspots
- scan results
- voice transcripts
- field images

If demo data exists, isolate it behind:

```text
DEMO_MODE=true
```

Production must use real data.

---

# 46. COMPLETE TEST MATRIX

## Camera

- [ ] Permission granted
- [ ] Permission denied
- [ ] Camera active
- [ ] Preview
- [ ] Capture
- [ ] Retake
- [ ] Upload fallback
- [ ] Mobile
- [ ] Desktop
- [ ] Cleanup

## Scan

- [ ] JPEG
- [ ] PNG
- [ ] Valid crop
- [ ] Person
- [ ] Laptop
- [ ] Animal
- [ ] Random object
- [ ] Blurry image
- [ ] Dark image
- [ ] AI result
- [ ] Save result
- [ ] Field update
- [ ] Heatmap update

## Voice

- [ ] English
- [ ] Bengali
- [ ] Hindi
- [ ] Permission
- [ ] Listening
- [ ] Transcript
- [ ] AI response
- [ ] TTS
- [ ] Stop
- [ ] Replay
- [ ] Mobile

## Fields

- [ ] Add field
- [ ] Save
- [ ] Immediate display
- [ ] Image
- [ ] Health
- [ ] Scan association

## UI

- [ ] 320px
- [ ] 360px
- [ ] 375px
- [ ] 390px
- [ ] 414px
- [ ] Tablet
- [ ] 1280px
- [ ] 1440px
- [ ] 1920px
- [ ] No overlap
- [ ] No horizontal scroll

---

# 47. FINAL DEMO JOURNEY

Perform this exact end-to-end test:

```text
LOGIN
↓
DASHBOARD
↓
FIELDS
↓
OPEN FIELD
↓
FIELD IMAGE
↓
HEALTH SUMMARY
↓
SPATIAL HEALTH MAP
↓
SCAN LEAF
↓
CAMERA
↓
CAPTURE
↓
VALIDATE
↓
AI ANALYSIS
↓
RESULT
↓
SAVE TO FIELD
↓
HEALTH UPDATE
↓
HEATMAP UPDATE
↓
AI ASSISTANT
↓
VOICE INPUT
↓
BENGALI / HINDI / ENGLISH
↓
VOICE OUTPUT
↓
ALERTS
↓
ANALYSIS HISTORY
```

Every step must work.

---

# 48. PERFORMANCE ACCEPTANCE TEST

Measure before and after:

```text
Initial render
First meaningful render
Time to interactive
Dashboard data
Field page
Scan page
AI Assistant open
```

For slow AI/network operations, the requirement is:

```text
CLICK
↓
IMMEDIATE FEEDBACK
↓
CLEAR PROGRESS
↓
RESULT
```

Never:

```text
CLICK
↓
BLANK SCREEN
↓
LONG WAIT
↓
ERROR
```

---

# 49. FINAL ROOT-CAUSE REPORT

After fixing, provide:

## Performance Problems Found
Every actual bottleneck.

## Root Causes
For every problem:

```text
Problem
→ Root cause
→ Fix
→ Result
```

## Functional Bugs Fixed

- Camera
- Voice
- Scan
- Image
- AI
- Fields
- Heatmap
- Mobile
- Navigation

## Performance Improvements

- caching
- request deduplication
- parallel requests
- lazy loading
- code splitting
- image optimization
- database optimization
- AI optimization

## Security Improvements

- secret protection
- authentication
- RLS
- storage
- API validation

## Testing

List actual tests performed.

## Remaining Limitations

Only genuine limitations. Do not claim something works if it was not tested.

---

# 50. DEFINITION OF DONE

The app is **SIH26180 DEMO READY** only when:

### Performance

- [ ] Fast app shell
- [ ] No long blank screen
- [ ] No unnecessary blocking
- [ ] No duplicate requests
- [ ] Heavy features lazy-loaded
- [ ] Images optimized
- [ ] History paginated
- [ ] Production build works

### Camera

- [ ] Permission
- [ ] Live preview
- [ ] Capture
- [ ] Retake
- [ ] Upload fallback
- [ ] Mobile
- [ ] Cleanup

### Scan

- [ ] Upload
- [ ] Validation
- [ ] Non-crop rejection
- [ ] Crop identification
- [ ] Disease analysis
- [ ] No default tomato
- [ ] No default healthy
- [ ] No fake confidence
- [ ] Correct save

### Voice

- [ ] Microphone
- [ ] Listening
- [ ] English
- [ ] Bengali
- [ ] Hindi
- [ ] Transcript
- [ ] AI
- [ ] TTS
- [ ] Stop
- [ ] Replay
- [ ] Mobile

### Fields

- [ ] Add field
- [ ] Immediate display
- [ ] Image
- [ ] Health
- [ ] Scan association

### Heatmap

- [ ] Real data
- [ ] Correct rendering
- [ ] No fake hotspots
- [ ] Invalid scans excluded
- [ ] Mobile
- [ ] Empty state

### UI/UX

- [ ] Desktop
- [ ] Tablet
- [ ] Mobile
- [ ] No text overlap
- [ ] No horizontal overflow
- [ ] Sidebar
- [ ] AI assistant doesn't obstruct
- [ ] Loading states
- [ ] Error states
- [ ] Empty states

### Security

- [ ] No frontend secrets
- [ ] Authentication
- [ ] RLS
- [ ] Storage permissions
- [ ] Safe errors

### Production

- [ ] Build succeeds
- [ ] Production server works
- [ ] Routes work after refresh
- [ ] Console clean
- [ ] Network clean
- [ ] No critical runtime errors

---

# FINAL COMMAND TO THE CODING AGENT

**DO NOT STOP AFTER FIXING ONE BUG.**

Perform a complete engineering audit of the existing AgriSight application.

Priority:

```text
1. SPEED
2. RELIABILITY
3. ACCURACY
4. MOBILE UX
5. CAMERA
6. VOICE
7. SCAN
8. FIELD DATA
9. HEATMAP
10. AI ASSISTANT
11. SECURITY
12. PRODUCTION BUILD
```

Fix root causes, not symptoms.

Do not replace real functionality with mock functionality.

Do not hide errors.

Do not use fake results.

Do not add unnecessary dependencies.

Do not make the UI heavier just to make it look impressive.

**Make AgriSight fast, crisp, reliable, accurate, responsive, and SIH-demo ready.**

The final interaction should feel like:

```text
CLICK
↓
IMMEDIATE RESPONSE
↓
SMOOTH TRANSITION
↓
CLEAR PROGRESS
↓
REAL RESULT
```

Only after all audits and tests pass should the application be considered:

> **AGRISIGHT — SIH26180 DEMO READY**

Perform one final end-to-end pass after all fixes. Check every major page, every critical feature, every responsive breakpoint, browser console, network requests, production build, and the complete farmer journey.

**Everything should be crisp. Everything should be intentional. Everything should either work correctly or clearly communicate why it cannot.**
