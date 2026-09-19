# AgriSight — Capacitor Android Deployment Master Prompt

## Goal

Convert the existing AgriSight web application into a real installable Android app using Capacitor, while keeping the existing frontend, FastAPI backend, Supabase/database, Gemini/AI, weather, camera, voice, fields, scan, IPM, nutrition, water guidance, alerts and analysis working.

**Do not rebuild the product. Do not rewrite it into React Native. Do not use fake data.**

Work **one phase at a time**:

```text
Inspect
→ Implement
→ Build
→ Test
→ Fix
→ Report
→ STOP
→ Wait for explicit approval
```

Do not start the next phase automatically.

---

# PHASE 0 — DISCOVER THE EXISTING PROJECT

Inspect before installing anything.

Determine:

- frontend framework
- React/Vite/Next/etc.
- package manager
- Node version
- build command
- actual build output directory
- backend framework
- backend start command
- API base URL
- authentication
- Supabase
- Gemini/AI
- weather API
- camera implementation
- microphone/voice implementation
- image/storage handling
- routes
- environment variables

Run safe checks:

```bash
node -v
npm -v
```

Inspect `package.json`.

Do not assume the build directory is `dist`.

Do not print secret values.

### Phase 0 report

```text
Frontend:
Framework:
Build command:
Build output:
Backend:
API base URL:
Auth:
Database:
AI:
Current mobile risks:
```

Then STOP.

---

# PHASE 1 — PRODUCTION WEB BUILD

Before Capacitor, make sure the current web app builds.

Run the project's actual build command, for example:

```bash
npm run build
```

Fix:

- TypeScript errors
- build errors
- missing imports
- missing assets
- route errors
- production-only runtime issues

Verify:

- Home
- Fields
- Scan
- Camera
- Upload
- AI
- Voice
- Alerts
- Analysis

Then report and STOP.

---

# PHASE 2 — INSTALL CAPACITOR

Only after Phase 1 approval.

Use the official Capacitor workflow for an existing web application:

```bash
npm install @capacitor/core @capacitor/cli
npx cap init
```

Capacitor supports adding a native runtime to an existing modern JavaScript application. citeturn776548search0turn776548search1

Configure:

```text
App name: AgriSight
App ID: com.agrisight.app
```

Use a stable reverse-domain app ID.

Do not casually change it later.

---

# PHASE 3 — CAPACITOR CONFIG

Set the real web build directory:

```text
webDir = <actual build output>
```

Examples could be:

```text
dist
build
out
www
```

Do not guess.

Verify `index.html` exists inside that directory.

Concept:

```ts
const config: CapacitorConfig = {
  appId: 'com.agrisight.app',
  appName: 'AgriSight',
  webDir: '<REAL_BUILD_OUTPUT>'
};
```

Do not add unnecessary configuration.

Then STOP.

---

# PHASE 4 — ADD ANDROID

Install Android support:

```bash
npm install @capacitor/android
```

Then:

```bash
npx cap add android
```

This follows the official Capacitor Android setup. citeturn776548search0

Verify:

```text
android/
```

exists.

Do not modify unrelated backend logic.

Then STOP.

---

# PHASE 5 — BUILD + SYNC

Run:

```bash
npm run build
npx cap sync
```

Verify the latest frontend is copied/synced into the Android project.

For future frontend changes, use:

```bash
npm run build
npx cap sync
```

Then STOP.

---

# PHASE 6 — ANDROID STUDIO

Open the native Android project:

```bash
npx cap open android
```

Capacitor uses Android Studio for the Android native project. citeturn776548search0

Verify:

- Android Studio
- Android SDK
- appropriate build tools
- emulator or physical Android phone

Prefer a real Android phone because AgriSight uses:

- camera
- microphone
- touch
- mobile navigation
- real network conditions

Then STOP.

---

# PHASE 7 — APP IDENTITY

Configure:

- App name: AgriSight
- Package ID: `com.agrisight.app`
- App icon
- Adaptive Android icon
- Splash screen
- App label
- status/navigation bar appearance

Remove default Capacitor branding.

Then STOP.

---

# PHASE 8 — BACKEND CONNECTIVITY

This is critical.

Do not rely on:

```text
http://localhost:8000
```

from the production Android app.

Correct architecture:

```text
AgriSight Android
      ↓ HTTPS
Production FastAPI
      ↓
Supabase
+
Gemini/AI
+
Weather
```

Audit the frontend API base URL.

Separate:

```text
development
production
```

configuration.

Do not hard-code secrets.

Then STOP.

---

# PHASE 9 — DEVELOPMENT BACKEND ACCESS

If the backend is still running on the developer's computer:

- use an appropriate LAN address or secure development tunnel
- phone and computer must be reachable
- remember phone `localhost` is not the developer computer
- check firewall/network permissions

This is for development only.

Do not ship a development tunnel in the release build.

Then STOP.

---

# PHASE 10 — DEPLOY FASTAPI

Deploy FastAPI to a reachable HTTPS environment.

Provide a health endpoint such as the project's existing equivalent.

Verify from the phone:

```text
Backend reachable
Auth works
Supabase works
Gemini works
Weather works
Scan works
Fields work
Alerts work
AI works
```

Do not continue until Android can reliably reach the backend.

Then STOP.

---

# PHASE 11 — ANDROID NETWORK SECURITY

Production API traffic must use HTTPS.

Do not weaken Android network security.

Only allow cleartext/local networking for controlled development if genuinely necessary.

Do not ship development-only network exceptions.

Then STOP.

---

# PHASE 12 — CAMERA

Make the existing Scan camera work reliably inside Android.

Audit whether the browser implementation works reliably in the native WebView.

If needed, use Capacitor's Camera plugin/native APIs. Capacitor officially exposes Camera functionality through native plugins. citeturn776548search0

Required:

```text
Scan
→ Turn On Camera
→ Android camera permission
→ Live preview
→ Capture
→ Preview
→ Analyze
```

Test:

- permission grant
- permission denial
- capture
- retake
- upload fallback
- front/rear camera where supported
- app background/foreground
- leaving scanner

Do not break the web version.

Then STOP.

---

# PHASE 13 — MICROPHONE + VOICE

Audit the existing voice implementation.

Use the current browser implementation if reliable inside Android.

Otherwise introduce a native-capable approach where necessary.

Verify:

```text
Microphone
→ Speech recognition
→ Transcript
→ AgriSight AI
→ Response
→ TTS
→ Speaker
```

Test:

- English
- Bengali
- Hindi

Verify that listening does not stop immediately.

Then STOP.

---

# PHASE 14 — PERMISSIONS

Request permissions only when needed.

Potential permissions:

```text
Camera
Microphone
Photos/files
Location
Notifications
```

Examples:

```text
Tap Scan
→ request camera permission
```

```text
Tap Voice
→ request microphone permission
```

Do not ask for every permission on first launch.

Then STOP.

---

# PHASE 15 — MOBILE NAVIGATION

Use a mobile-app navigation pattern.

Recommended:

```text
Home
Fields
Scan
Alerts
AI
```

Keep advanced functionality inside these sections.

Test:

- tab navigation
- drawer if used
- Android Back
- modal closing
- assistant closing
- scanner closing
- field navigation

Then STOP.

---

# PHASE 16 — ANDROID BACK BUTTON

Implement intentional behavior:

```text
AI open
→ Back
→ Close AI
```

```text
Scanner open
→ Back
→ Exit scanner
```

```text
Field details
→ Back
→ Fields
```

Do not immediately exit the app while a deeper navigation layer is open.

Then STOP.

---

# PHASE 17 — MOBILE SAFE AREAS

Verify:

- status bar
- navigation bar
- screen cutouts
- bottom navigation
- keyboard
- camera controls
- AI button

No important content may be hidden behind system UI.

Then STOP.

---

# PHASE 18 — POOR NETWORK / OFFLINE FOUNDATION

The app must fail gracefully when connectivity is poor.

Show:

```text
📶 Connection unavailable

Some features may be temporarily unavailable.
```

Do not crash.

Keep useful cached data where the current architecture supports it.

Do not implement full Edge AI yet.

Do not implement IoT yet.

Then STOP.

---

# PHASE 19 — ERROR CONTRACT

Never show raw backend/API errors to farmers.

Bad:

```text
500 INTERNAL SERVER ERROR
```

Good:

```text
Couldn't analyze the crop.

[ Try Again ]
```

Backend logs must still preserve the actual technical cause.

Then STOP.

---

# PHASE 20 — SECURITY

Verify:

- no Gemini API key in frontend
- no Supabase service-role key in frontend
- no private secrets in Android assets
- production API uses HTTPS
- auth tokens are handled safely
- user data is scoped correctly

An APK must never contain server secrets.

Then STOP.

---

# PHASE 21 — SESSION / AUTH

Test:

```text
Login
→ Close app
→ Reopen
→ Session restored
```

Test token expiry and safe refresh/re-authentication.

Do not store sensitive credentials unnecessarily in plain storage.

Then STOP.

---

# PHASE 22 — SCAN END-TO-END ON PHYSICAL PHONE

Test:

```text
Open Scan
→ Camera
→ Capture
→ Preview
→ Upload
→ Image validation
→ Crop identification
→ Disease/Pest analysis
→ Result
→ Save
→ Field update
```

Also test:

```text
Person image
→ NON_CROP
```

Never:

```text
Person
→ Tomato
→ Healthy
→ 95%
```

Then STOP.

---

# PHASE 23 — FIELD END-TO-END ON PHONE

Test:

```text
Fields
→ Add Field
→ Save
→ Field appears immediately
→ Open Field
→ Image
→ Health
→ Spatial Health
→ Scans
→ Recommendations
```

No refresh should be required after a successful creation.

Then STOP.

---

# PHASE 24 — AI ASSISTANT ON PHONE

Test:

- text
- English
- Bengali
- Hindi
- voice
- TTS
- context-aware questions
- compact UI

Keep default replies short:

```text
What's happening?
Risk:
What to do:
```

Do not reintroduce information overload.

Then STOP.

---

# PHASE 25 — PERFORMANCE ON ANDROID

Measure:

- cold start
- Home render
- navigation
- field loading
- image loading
- scan
- AI assistant

Remove:

- duplicate requests
- unnecessary Home calls
- oversized images
- unnecessary startup initialization

Use progressive loading.

Then STOP.

---

# PHASE 26 — REAL DEVICE TEST MATRIX

## Home
- [ ] Fast launch
- [ ] Weather
- [ ] Alerts
- [ ] Scan
- [ ] AI

## Scan
- [ ] Camera permission
- [ ] Camera preview
- [ ] Capture
- [ ] Retake
- [ ] Upload
- [ ] AI analysis
- [ ] Save

## Voice
- [ ] Microphone permission
- [ ] English
- [ ] Bengali
- [ ] Hindi
- [ ] Transcript
- [ ] TTS

## Fields
- [ ] Add
- [ ] View
- [ ] Images
- [ ] Health
- [ ] Spatial map
- [ ] Scan association

## Navigation
- [ ] Bottom nav/drawer
- [ ] Android Back
- [ ] Deep navigation
- [ ] App restart

Then STOP.

---

# PHASE 27 — DEBUG APK

Build a debug APK and install it on the physical phone.

Use Android Studio/ADB logs to diagnose:

- WebView errors
- plugin errors
- permissions
- camera
- microphone
- API connectivity
- routing
- asset loading

Do not use mocked API success as proof of completion.

Then STOP.

---

# PHASE 28 — RELEASE BUILD

After debug testing passes:

Create a signed production Android release.

For Play Store distribution, prepare a signed Android App Bundle (AAB).

Protect the signing key.

Never commit signing credentials to Git.

Then STOP.

---

# PHASE 29 — PRODUCTION BACKEND QA

The release app must use:

```text
Android
↓ HTTPS
Production FastAPI
↓
Supabase + Gemini + Weather
```

No:

- localhost
- development tunnel
- development credentials
- development API keys

Then STOP.

---

# PHASE 30 — FINAL APP QA

Test:

### Authentication
- [ ] Login
- [ ] Logout
- [ ] Session restore

### Navigation
- [ ] Home
- [ ] Fields
- [ ] Scan
- [ ] Alerts
- [ ] AI
- [ ] Back button

### Camera
- [ ] Permission
- [ ] Preview
- [ ] Capture
- [ ] Retake
- [ ] Upload fallback

### Voice
- [ ] English
- [ ] Bengali
- [ ] Hindi
- [ ] Transcript
- [ ] TTS

### AI
- [ ] Context
- [ ] Concise responses
- [ ] No hallucinated farm data

### Agriculture
- [ ] Disease
- [ ] Pest
- [ ] IPM
- [ ] Nutrition
- [ ] Water
- [ ] Weather
- [ ] Risk
- [ ] Fields
- [ ] Heatmap
- [ ] Alerts
- [ ] Analysis

Then STOP.

---

# PHASE 31 — FINAL SECURITY AUDIT

Verify:

- [ ] No secrets in frontend
- [ ] No secrets in APK
- [ ] HTTPS
- [ ] Authentication
- [ ] RLS
- [ ] Storage permissions
- [ ] CORS
- [ ] API validation
- [ ] Safe errors

Then STOP.

---

# PHASE 32 — FINAL PERFORMANCE AUDIT

Verify:

```text
Launch
↓
Home
↓
Navigation
↓
Scan
↓
AI
```

Each should provide:

```text
Immediate visual feedback
→ Progressive loading
→ Result
```

Never:

```text
Tap
→ blank screen
→ unexplained delay
```

Then STOP.

---

# PHASE 33 — DEFERRED FEATURES

Do NOT implement these during the Capacitor migration:

```text
❌ Edge AI
❌ IoT sensors
❌ ESP32
❌ On-device ML
```

They remain the LAST technical phase after the Android software foundation is stable.

---

# PHASE REPORT FORMAT

At the end of EVERY phase provide:

```text
PHASE X REPORT

Implemented:
...

Files/configuration changed:
...

Commands executed:
...

Tests performed:
...

Problems found:
...

Problems fixed:
...

Remaining:
...

Ready for next phase:
YES / NO
```

Then:

> **STOP. Wait for explicit approval.**

---

# FINAL SUCCESS CONDITION

AgriSight is ready when:

```text
Existing AgriSight Web App
        ↓
Capacitor
        ↓
Android App
        ↓
Real Phone Camera
        ↓
Real Phone Microphone
        ↓
Fast Mobile UI
        ↓
HTTPS Production Backend
        ↓
FastAPI
        ↓
Supabase
        ↓
Gemini
        ↓
Weather
```

and the real Android phone can:

```text
Open AgriSight
→ Login
→ View Home
→ Scan a crop with camera
→ Upload/analyze image
→ Reject non-crop images correctly
→ Save valid results
→ View Fields
→ View images/health/spatial information
→ Receive alerts
→ Ask AI
→ Speak in English/Bengali/Hindi
→ Hear the response
```

without fake responses, localhost dependencies, exposed secrets, or critical runtime errors.

**Work phase-by-phase. Test every phase. Report every phase. Stop every phase. Wait for approval.**

**Do not start Edge AI or IoT until all Android/mobile phases are complete and explicitly approved.**
