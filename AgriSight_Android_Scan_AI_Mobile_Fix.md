# AgriSight — Android Mobile Scan + AI Assistant Critical Fix

## Objective

The Android app is now opening on the physical device, but two critical features are not working correctly on mobile:

1. **Scan / Camera / Crop Analysis**
2. **AgriSight AI Assistant**

Do NOT add new product features.
Do NOT rewrite the application.
Do NOT use mocked success responses.

Fix the actual Android/mobile implementation and frontend/backend communication.

Final requirement:

```text
REAL ANDROID PHONE
↓
SCAN WORKS
↓
AI ASSISTANT WORKS
↓
BACKEND WORKS
↓
REAL DATA
```

---

# PHASE 1 — REPRODUCE THE MOBILE PROBLEMS

Use the physical Android device already detected:

```text
Xiaomi 23076RN4BI
```

Reproduce:

### Scan
- Open Scan
- Turn on camera
- Capture image
- Preview
- Analyze
- Record exact failure

### AI Assistant
- Open assistant
- Send text message
- Try voice if available
- Record exact failure

Inspect:

- Android Logcat
- WebView/browser console
- Network requests
- HTTP status
- runtime API URL
- request payload
- response body
- permission state
- Capacitor/plugin errors

Do not guess the root cause.

Report the exact failing stage.

Then STOP.

---

# PHASE 2 — VERIFY MOBILE BACKEND CONNECTIVITY

The Android app must NOT use production:

```text
localhost
127.0.0.1
```

Expected:

```text
Android App
↓ HTTPS
Production FastAPI
↓
Supabase / Gemini / Weather
```

Verify the runtime API URL inside the installed app.

If the production build points to localhost or a computer-local address, fix it.

Do not expose API keys.

Do not hard-code development tunnel URLs into the release build.

Then STOP.

---

# PHASE 3 — VERIFY BACKEND HEALTH FROM PHONE

From the Android app/device verify the project's health endpoint, e.g.:

```text
GET /health
```

Confirm:

- HTTP request succeeds
- HTTPS works
- authentication works
- backend is reachable

If API connectivity fails, fix that first.

Do not change scan or AI logic until the basic API connection works.

Then STOP.

---

# PHASE 4 — FIX CAMERA / SCAN ON ANDROID

Required flow:

```text
Scan
↓
Turn On Camera
↓
Android camera permission
↓
Live Preview
↓
Capture
↓
Preview
↓
Analyze
```

Audit:

- Capacitor Camera plugin
- browser getUserMedia fallback
- WebView permissions
- Android manifest
- runtime permissions
- camera lifecycle
- Activity lifecycle
- background/foreground behavior
- video element
- image URI conversion
- Blob/File creation
- Base64 conversion if used
- MIME type
- Android content URIs

Do not create a second unrelated scan architecture.

---

# PHASE 5 — ANDROID CAMERA PERMISSIONS

Request camera permission when Scan is used.

Handle:

```text
GRANTED
DENIED
PERMANENTLY_DENIED
NO_CAMERA
CAMERA_BUSY
UNSUPPORTED
```

If denied:

```text
Camera access is disabled.

Allow camera permission in Settings
to scan a crop.

[ Open Settings ]
[ Upload Image Instead ]
```

Do not crash.

Then STOP.

---

# PHASE 6 — NATIVE CAMERA PATH

If browser camera behavior is unreliable inside Android WebView, use the existing Capacitor Camera integration for mobile capture.

Architecture:

```text
Mobile Camera
↓
Normalized Image
↓
Common Scan Pipeline
```

Both camera and upload must feed the same backend/AI scan pipeline.

Do not create separate diagnosis logic for mobile and web.

Then STOP.

---

# PHASE 7 — NORMALIZE ANDROID CAMERA OUTPUT

Android may return a URI/path instead of a browser File.

Normalize into something like:

```text
ImageSource
{
  uri/path
  mimeType
  filename
  width
  height
}
```

Then convert it into the exact format expected by the existing scan API.

Do not send a raw Android URI to a backend expecting multipart file bytes.

Then STOP.

---

# PHASE 8 — VALIDATE IMAGE BEFORE ANALYSIS

Before calling Scan API verify:

```text
image exists
size > 0
valid MIME
readable
width > 0
height > 0
```

Development logging:

```text
Image type:
Image size:
Dimensions:
Source:
```

Do not log image contents or private data.

Then STOP.

---

# PHASE 9 — FIX MOBILE UPLOAD

Verify the actual request:

```text
POST <existing-scan-endpoint>
```

Check:

- multipart/form-data
- exact field name
- auth headers
- field ID if required
- crop context if required
- language
- MIME type
- image bytes

Do not manually set multipart boundaries when using `FormData`.

Do not send JSON if the backend expects a file upload.

Then STOP.

---

# PHASE 10 — VERIFY SCAN ANALYSIS PIPELINE

Required backend flow:

```text
Image
↓
Image Quality
↓
Agricultural Validation
↓
Crop Identification
↓
Disease / Pest Analysis
↓
Structured Result
↓
Database
↓
Frontend
```

Everything must work from the Android app, not just desktop browser.

Then STOP.

---

# PHASE 11 — NON-CROP SAFETY

Keep the existing critical accuracy rules.

Reject:

- person
- selfie
- animal
- vehicle
- laptop
- phone
- room
- building
- document
- screenshot
- random object

Expected:

```text
NON_CROP
```

Never:

```text
Tomato
Healthy
95%
```

Never use default fallback diagnoses to hide errors.

Then STOP.

---

# PHASE 12 — PREVENT STALE SCAN RESULTS

When a new scan begins, reset:

```text
crop
diagnosis
confidence
severity
health
recommendations
```

Audit:

- React state
- React Query/cache
- Zustand/Redux
- localStorage
- sessionStorage
- URL state

Test:

```text
Tomato scan
↓
Person image
↓
NON_CROP
↓
crop = null
↓
diagnosis = null
```

Then STOP.

---

# PHASE 13 — MOBILE SCAN RESULT UI

Use the compact result format already planned:

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

Do not return one giant result page.

Then STOP.

---

# PHASE 14 — FIX AI ASSISTANT ON ANDROID

Start with TEXT input first.

Required:

```text
Open AI Assistant
↓
Type message
↓
Send
↓
Backend request
↓
AI response
↓
Display response
```

Do not debug text and voice simultaneously.

Then STOP.

---

# PHASE 15 — AI ASSISTANT API CONNECTIVITY

Inspect the actual Android request:

```text
API URL
HTTP method
headers
authentication
request body
context
response status
response body
```

Investigate:

- wrong API base URL
- HTTPS issues
- authentication
- WebView request failures
- CORS
- backend timeout
- Gemini error
- parser error
- invalid payload

Fix the root cause.

Then STOP.

---

# PHASE 16 — AI RESPONSE

Return a stable response structure.

Example:

```json
{
  "message": "Your tomato crop may be experiencing water stress.",
  "language": "en"
}
```

Adapt to the existing API contract.

Do not create a duplicate assistant API unless genuinely necessary.

Then STOP.

---

# PHASE 17 — KEEP MOBILE AI RESPONSES CRISP

Default:

```text
🌿 Water stress may be increasing.

Risk: Medium

Today:
• Check soil condition
• Avoid unnecessary irrigation
• Recheck tomorrow

[ More Details ]
```

Do not show huge paragraphs by default.

Then STOP.

---

# PHASE 18 — AI CONTEXT

Use relevant existing context:

```text
Current field
Crop
Crop stage
Recent scans
Disease
Pest
Nutrition
Water risk
Weather
Alerts
```

Do not send the entire database.

Do not invent farm data.

Then STOP.

---

# PHASE 19 — VOICE AFTER TEXT WORKS

Only after text AI is working on the physical phone, test:

```text
Microphone
↓
Speech recognition
↓
Transcript
↓
AI
↓
Response
↓
TTS
```

Test:

- English
- Bengali
- Hindi

Identify exactly where voice fails:

```text
Permission
Recognition
Transcript
Backend
AI
TTS
Playback
```

Do not break working text AI while fixing voice.

Then STOP.

---

# PHASE 20 — MOBILE VOICE UX

Use clear states:

```text
🎤 Tap to speak
```

```text
🔴 Listening...
```

```text
📝 Understanding...
```

```text
🤖 Thinking...
```

```text
🔊 Speaking...
```

```text
⚠ Couldn't hear that
[ Try Again ]
```

Never silently stop.

Then STOP.

---

# PHASE 21 — AI MOBILE UI

Use a compact mobile panel/bottom sheet:

```text
┌────────────────────────────┐
│ Ask AgriSight          ✕   │
├────────────────────────────┤
│ Short AI response          │
│                            │
├────────────────────────────┤
│ 🎤   Type here...       ➤ │
└────────────────────────────┘
```

It must not cover:

- Scan controls
- Camera
- navigation
- important content

Then STOP.

---

# PHASE 22 — APP LIFECYCLE

Test:

```text
Scan open
→ background app
→ return
```

and:

```text
AI open
→ background app
→ return
```

Check:

- camera stream
- microphone
- pending requests
- network
- state
- navigation

Clean up media resources when leaving the feature.

Then STOP.

---

# PHASE 23 — ANDROID BACK BUTTON

Verify:

```text
AI open → Back → Close AI
Scan open → Back → Exit Scan
Field details → Back → Fields
```

Do not exit the whole app while an internal layer is open.

Then STOP.

---

# PHASE 24 — NETWORK FAILURE

Test:

- Wi-Fi
- mobile data
- slow network
- temporary disconnect
- reconnect

Expected:

```text
📶 Connection unavailable

Some features may be temporarily unavailable.

[ Retry ]
```

No crash.

No fake success.

Then STOP.

---

# PHASE 25 — REAL BACKEND

From the actual Android app verify:

```text
Android
↓ HTTPS
FastAPI
↓
Supabase
+
Gemini
+
Weather
```

Real responses only.

Then STOP.

---

# PHASE 26 — BUILD + SYNC

After fixes:

```bash
cd "C:\MY PROJECTS\AgriSightrontend"

npm run build
npx cap sync android
npx cap open android
```

Install/run on:

```text
Xiaomi 23076RN4BI
```

Then STOP.

---

# PHASE 27 — REAL DEVICE TEST MATRIX

## Scan
- [ ] Scanner opens
- [ ] Camera permission
- [ ] Live preview
- [ ] Capture
- [ ] Retake
- [ ] Upload
- [ ] JPEG
- [ ] PNG
- [ ] Real crop
- [ ] Non-crop
- [ ] Disease
- [ ] Pest if supported
- [ ] IPM
- [ ] Nutrition
- [ ] Water
- [ ] Compare
- [ ] Save to field

## AI Assistant
- [ ] Opens
- [ ] Text message
- [ ] Response
- [ ] Context
- [ ] English
- [ ] Bengali
- [ ] Hindi
- [ ] Voice
- [ ] TTS
- [ ] Mobile UI
- [ ] Back button

## Backend
- [ ] HTTPS
- [ ] Auth
- [ ] Scan API
- [ ] AI API
- [ ] Supabase
- [ ] Storage
- [ ] Weather

---

# PHASE 28 — DIAGNOSTIC LOGGING

During development:

```text
[ANDROID SCAN]
API:
Image:
Stage:
Status:
Error:
```

```text
[ANDROID AI]
API:
Language:
Status:
Error:
```

Never log:

- API keys
- tokens
- passwords
- private user data
- sensitive raw images

---

# PHASE 29 — NO FALSE COMPLETION

Do not say:

```text
Scan fixed
```

because code compiles.

Do not say:

```text
AI fixed
```

because the assistant window opens.

Actual proof:

```text
REAL PHONE
→ REAL CAMERA
→ REAL IMAGE
→ REAL BACKEND
→ REAL AI
→ REAL RESULT
```

and:

```text
REAL PHONE
→ AI ASSISTANT
→ REAL BACKEND
→ REAL RESPONSE
```

---

# PHASE 30 — FINAL REPORT

Provide:

```text
ANDROID DEVICE:
Xiaomi 23076RN4BI

SCAN
Camera:
Capture:
Upload:
Validation:
Crop Identification:
Disease:
Pest:
IPM:
Nutrition:
Water:
Compare:
Save:

AI ASSISTANT
Open:
Text:
Context:
English:
Bengali:
Hindi:
Voice:
TTS:

BACKEND
HTTPS:
Authentication:
FastAPI:
Supabase:
Gemini:
Weather:

PERFORMANCE
Launch:
Home:
Scan:
AI:

ROOT CAUSES:
...

FIXES:
...

REMAINING ISSUES:
...

APK:
...

RELEASE AAB READY:
YES / NO
```

Then STOP.

---

# FINAL PRIORITY

Do NOT add:

```text
❌ Edge AI
❌ IoT sensors
❌ ESP32
❌ On-device ML
```

First make these genuinely work on the physical Android device:

```text
1. SCAN
2. AI ASSISTANT
```

Then verify the rest of the existing application.

Final target:

```text
PHONE
↓
AGRISIGHT
↓
SCAN CROP
↓
ACCURATE RESULT
↓
DISEASE / PEST / IPM / NUTRITION / WATER
↓
ASK AGRISIGHT
↓
SHORT ANSWER
↓
VOICE IF NEEDED
```

**Fix → build → install → test on physical phone → fix again → retest until the real device passes.**

Do not claim completion without actual device verification.
