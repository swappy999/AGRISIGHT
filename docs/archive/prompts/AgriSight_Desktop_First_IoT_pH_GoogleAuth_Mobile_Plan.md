# AgriSight — Desktop-First Implementation Plan
## IoT + Soil pH + Google Authentication + Android

> **Execution rule:** INSPECT → PLAN → IMPLEMENT → TEST → REPORT → STOP → WAIT FOR APPROVAL.
> Work desktop/web first. Only after desktop is fully verified, begin Android.

## 1. Existing Project Context

AgriSight currently uses:
- Next.js App Router frontend with static export to `out/`
- FastAPI backend
- Supabase
- Gemini AI
- Capacitor Android
- Camera, geolocation, network, preferences, splash-screen and status-bar plugins
- English/Hindi/Bengali voice support
- Existing crop, field and analysis routes
- Existing API client and `getFastApiUrl()` logic
- Capacitor app ID: `com.agrisight.app`
- `webDir`: `out`
- Android target/compile SDK: 36
- Minimum Android SDK: 24

UI must remain compact, professional, farmer-friendly and mobile responsive.

Never expose:
- `GEMINI_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- Google OAuth client secrets
- private device credentials

Never use fake crop/disease/confidence defaults.

---

# 2. Target Architecture

```text
Desktop / Android
       |
    Next.js
       |
 Supabase Auth
       |
   Google OAuth
       |
   FastAPI API
    /       \
Supabase   Gemini
    |
IoT readings
    |
   Wi-Fi
    |
   ESP32
  /  |  \
Moisture DHT22 pH
```

Optional later:

```text
ESP32 → safe relay/MOSFET → low-voltage pump
```

Gemini recommends; Gemini must NOT directly control a pump.

---

# 3. Hardware Scope

Required:
1. ESP32 DevKit V1
2. Capacitive soil-moisture sensor
3. DHT22 / AM2302
4. Soil pH sensor/module suitable for soil measurement
5. Breadboard
6. Jumper wires
7. USB cable
8. Small real plant/pot
9. USB power source

Optional:
- 5V relay or suitable MOSFET driver
- low-voltage DC mini pump
- water container/tubing
- water-flow sensor

Do not let pump control block the presentation.

pH is a prototype sensor reading and must be described as requiring calibration. Do not claim laboratory accuracy.

---

# 4. PHASE 1 — PROJECT AUDIT

Before editing anything, inspect:

```text
package.json
next.config.*
capacitor.config.*
.env*
src/
app/
components/
lib/
utils/
backend/
FastAPI routes
Supabase migrations/schema
existing auth
existing API client
Gemini integration
field/crop/analysis models
Capacitor/native code
```

Determine:
- current auth implementation
- current Supabase clients
- current middleware/proxy
- current session handling
- existing user/profile table
- existing field ownership model
- existing IoT endpoints/tables
- existing Gemini endpoints
- existing mobile routing
- environment variables
- what can be reused

Do NOT implement yet.

Report:
1. Existing architecture
2. Reusable code
3. Missing pieces
4. Conflicts
5. Exact files that should change
6. Recommended phase order

Then STOP.

---

# 5. PHASE 2 — DESKTOP GOOGLE AUTH

Use Supabase Auth + Google OAuth with the current Next.js SSR/cookie-based pattern.

Flow:

```text
/login
  ↓
Continue with Google
  ↓
Google
  ↓
Supabase Auth
  ↓
/auth/callback
  ↓
Exchange authorization code
  ↓
Create session
  ↓
Load profile
  ↓
/dashboard
```

Required states:
- loading
- redirecting
- cancelled
- OAuth error
- callback error
- session expired
- signed out

Reuse existing Supabase utilities where possible.

Required behavior:
- unauthenticated user visiting private route → `/login`
- authenticated user visiting `/login` → `/dashboard`
- refresh retains session
- logout destroys session
- no redirect loops
- direct private URLs remain protected

## Google Cloud configuration

Create a Web application OAuth client.

Configure:
- Authorized JavaScript origins
- Authorized redirect URI

The callback URI must be the one supplied by the Supabase Auth Google provider configuration.

Use separate development and production redirect configuration.

## Supabase configuration

Enable:
`Authentication → Providers → Google`

Configure:
- Google Client ID
- Google Client Secret
- Site URL
- allowed redirect URLs

Do not put the client secret in frontend code.

## Login UI

Keep it minimal:

```text
AgriSight
Smart farming intelligence

[ Continue with Google ]
```

Do not add unnecessary authentication methods unless they already exist.

---

# 6. PHASE 3 — USER PROFILE

After Google authentication:

```text
auth.users
   ↓
profiles
   ↓
AgriSight dashboard
```

Recommended profile fields:

```text
id
full_name
avatar_url
preferred_language
created_at
updated_at
```

Use the Supabase authenticated user ID as the key.

Enable RLS so users can only access their own profile.

Do not store Google provider tokens in the profile table.

---

# 7. PHASE 4 — IOT DATABASE

Create/reuse:

```text
iot_sensor_readings

id
device_id
field_id
soil_moisture
temperature
humidity
soil_ph
created_at
```

Optional only if useful:

```text
battery_level
signal_strength
sensor_status
firmware_version
```

Add indexes for:
- field_id
- device_id
- created_at

Use RLS for user/field authorization.

Users must not see sensor data for fields they do not own/have access to.

---

# 8. PHASE 5 — FASTAPI IOT API

Create/reuse:

```text
POST /api/iot/sensor-data
GET  /api/iot/latest/{field_id}
GET  /api/iot/history/{field_id}
```

Do not duplicate existing equivalent endpoints.

Payload:

```json
{
  "device_id": "AGRISIGHT_NODE_01",
  "field_id": "FIELD_01",
  "soil_moisture": 31.5,
  "temperature": 29.4,
  "humidity": 67,
  "soil_ph": 6.4
}
```

Validate:
- moisture: 0–100
- humidity: 0–100
- pH: approximately 0–14
- temperature: sensible configurable range

Missing sensor values should be safely represented as `null`; do not invent readings.

---

# 9. PHASE 6 — DEVICE SECURITY

Never put the Supabase service-role key in ESP32 firmware.

Use:

```text
ESP32
 ↓
FastAPI
 ↓
validation/device authentication
 ↓
Supabase
```

For the emergency prototype, a restricted device token/API key may be used only if it is stored securely and validated server-side.

Requirements:
- no device secrets in Git
- no device secrets in frontend
- device identification
- request validation
- ability to revoke a device
- safe logging

Document what is prototype-grade versus production-grade.

---

# 10. PHASE 7 — DESKTOP IOT UI

Add a compact sensor card to the Field page.

Example:

```text
FIELD 01

Soil Moisture     31.5%
Temperature       29.4°C
Humidity          67%
Soil pH           6.4

● Sensor online
Updated 8 sec ago

[ View Details ] [ AI Advice ]
```

States:
- Online
- Offline
- No data
- Sensor error
- Stale data

Do not call stale data “live”.

Do not create a huge IoT dashboard.

---

# 11. PHASE 8 — SENSOR HISTORY

Provide a compact history view for:
- moisture
- temperature
- humidity
- pH

Ranges:
- 24 hours
- 7 days
- 30 days

Use simple charts only where useful.

If history does not exist, show a clear empty state.

---

# 12. PHASE 9 — GEMINI SENSOR RECOMMENDATION

Reuse the existing Gemini service.

Create/reuse something like:

```text
POST /api/ai/field-recommendation
```

Input:

```json
{
  "crop": "Rice",
  "soil_moisture": 31.5,
  "temperature": 29.4,
  "humidity": 67,
  "soil_ph": 6.4,
  "weather": {},
  "field_context": {}
}
```

Return structured, concise advice:

```json
{
  "summary": "Moisture is moderately low.",
  "irrigation": "Consider irrigation based on crop stage and soil type.",
  "soil_ph": "pH is within a generally acceptable range for many crops.",
  "risk": "Low",
  "actions": [
    "Check soil moisture again before irrigation.",
    "Monitor crop symptoms."
  ]
}
```

Never let Gemini directly execute pump/relay commands.

---

# 13. PHASE 10 — OPTIONAL IRRIGATION

Only after sensors/API/UI work.

Architecture:

```text
Sensor
 ↓
FastAPI
 ↓
deterministic irrigation rule
 ↓
relay/MOSFET
 ↓
pump
```

Use a configurable prototype threshold.

Never connect a pump directly to an ESP32 GPIO.

Use appropriate driver circuitry and low-voltage power.

---

# 14. PHASE 11 — ESP32 FIRMWARE

Responsibilities:
1. Wi-Fi connection
2. Moisture reading
3. DHT22 reading
4. pH reading
5. Validation
6. JSON creation
7. POST to FastAPI
8. Retry handling
9. Serial diagnostics
10. Continue safely if server is unavailable

Flow:

```text
BOOT
 ↓
Initialize sensors
 ↓
Connect Wi-Fi
 ↓
Read sensors
 ↓
Validate
 ↓
POST JSON
 ↓
Wait
 ↓
Repeat
```

For local desktop testing:

```text
Do NOT use:
http://localhost:8000
```

From ESP32, `localhost` refers to the ESP32.

Use the desktop's LAN IP, e.g.:

```text
http://192.168.x.x:8000
```

For production use a reachable HTTPS endpoint.

---

# 15. PHASE 12 — DESKTOP END-TO-END TEST

Verify:

```text
Real sensors
 ↓
ESP32
 ↓
Wi-Fi
 ↓
FastAPI
 ↓
Supabase
 ↓
Next.js
 ↓
Field sensor card
 ↓
Gemini recommendation
```

Test:
- normal reading
- changing moisture
- changing temperature
- changing humidity
- changing pH
- missing pH
- invalid pH
- Wi-Fi interruption
- backend unavailable
- stale readings
- multiple devices
- multiple fields
- unauthorized field access

Do not move to Android until this passes.

---

# 16. PHASE 13 — DESKTOP AUTH TEST

Test:
- new Google user
- existing Google user
- refresh
- direct private URL
- logout
- browser restart
- OAuth cancellation
- callback error
- invalid redirect
- no redirect loop
- mobile-sized browser

---

# 17. PHASE 14 — CAPACITOR ANDROID PRE-FLIGHT

Only after desktop approval.

Verify:

```bash
npm run build
npx cap sync
npx cap open android
```

Check:
- web assets
- Android build
- API URL
- permissions
- splash
- status bar
- back button
- no localhost assumptions

---

# 18. PHASE 15 — ANDROID GOOGLE AUTH

Do not assume desktop WebView redirects will work automatically.

Use an explicit native/mobile OAuth callback strategy.

Conceptual flow:

```text
Android AgriSight
 ↓
Google/Supabase OAuth
 ↓
external browser/auth session
 ↓
OAuth callback
 ↓
AgriSight deep link
 ↓
Supabase session
 ↓
Dashboard
```

A conceptual URI might be:

```text
com.agrisight.app://auth/callback
```

but DO NOT blindly implement this exact URI. Determine the redirect supported by the chosen current Supabase + Capacitor integration.

Configure:
- Android intent/deep link
- Supabase allowed redirect URL
- Google OAuth configuration
- cold-start callback
- already-open app callback
- cancellation
- logout
- session restoration

Before installing another auth plugin, inspect existing Capacitor plugins and reuse the current architecture where possible.

---

# 19. PHASE 16 — ANDROID IOT

Android consumes the same backend:

```text
ESP32
 ↓
FastAPI
 ↓
Supabase
 ↓
Android AgriSight
```

Do not add direct Bluetooth communication unless there is a clear need.

Backend remains the source of truth.

---

# 20. PHASE 17 — ANDROID SENSOR UI

Reuse the desktop sensor component responsively:

```text
Field 01

Moisture      31.5%
Temp          29.4°C
Humidity      67%
pH            6.4

● Online
Updated 8 sec ago

[ AI Advice ]
```

Requirements:
- no horizontal scrolling
- no overlapping text
- comfortable touch targets
- compact layout
- clear stale/offline state

---

# 21. PHASE 18 — OFFLINE / LOW CONNECTIVITY

Reuse existing network handling.

Offline:

```text
● Offline
Last synced: 2 min ago
```

Cached readings must be labelled:

```text
Last known readings
```

Never present stale data as live.

When connectivity returns, refresh from backend.

---

# 22. PHASE 19 — REGRESSION CHECK

Do not break existing:
- crop scanning
- crop/non-crop validation
- Gemini analysis
- camera
- voice
- English/Hindi/Bengali
- AI assistant
- field pages
- analysis pages
- mobile back button
- network status

Run:
- frontend tests
- backend pytest
- TypeScript check
- lint
- production build
- Capacitor sync
- Android build

---

# 23. SECURITY FINAL CHECK

Verify:
- no secrets in frontend
- no secrets in APK source
- no secrets in Git
- Supabase RLS enabled
- private routes protected
- FastAPI validates requests
- device authentication enforced
- OAuth redirects allow-listed
- no open redirects
- no credentials logged
- service-role key is server-only
- Google client secret is server-only

---

# 24. SIH DEMO FLOW

```text
1. Google login
      ↓
2. AgriSight dashboard
      ↓
3. Select field
      ↓
4. Show ESP32 sensor readings
      ↓
5. Show moisture + temperature + humidity + pH
      ↓
6. Scan crop
      ↓
7. Gemini analyzes crop
      ↓
8. Combine crop + sensor context
      ↓
9. Show concise AI recommendation
      ↓
10. Optional irrigation recommendation
```

Presentation statement:

> AgriSight combines visual crop intelligence with real-time field sensing. The ESP32 collects soil moisture, environmental conditions and soil pH, while the AI layer combines this context with crop observations to provide actionable recommendations.

Do not claim Edge AI is already implemented if it is not.

Say:

> The current prototype uses Gemini for AI inference. The next phase is to move critical vision inference to the edge for low-connectivity deployment.

---

# 25. ANTIGRAVITY WORK PROTOCOL

For every phase, output:

```text
PHASE:
STATUS:

INSPECTED:
- ...

CHANGED:
- ...

TESTED:
- ...

RESULT:
- ...

ISSUES:
- ...

NEXT:
- ...

STOP.
WAIT FOR APPROVAL.
```

Do not automatically continue to the next phase.

---

# 26. START NOW

Start ONLY with:

## PHASE 1 — PROJECT AUDIT

Inspect the existing AgriSight desktop/web project.

Produce:
1. Current authentication architecture
2. Current Supabase architecture
3. Current FastAPI architecture
4. Current field/crop models
5. Current Gemini integration
6. Current Capacitor architecture
7. Current API client
8. Current environment variables
9. Current database schema/migrations
10. Exact implementation order

**Do not implement anything yet.**

Then:

**STOP and wait for approval.**

---

## Official references

Supabase Next.js Auth:
https://supabase.com/docs/guides/auth/quickstarts/nextjs

Supabase Google OAuth:
https://supabase.com/docs/guides/auth/social-login/auth-google

Supabase `signInWithOAuth`:
https://supabase.com/docs/reference/javascript/auth-signinwithoauth

Supabase social login:
https://supabase.com/docs/guides/auth/social-login
