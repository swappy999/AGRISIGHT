# AgriSight — Mobile Production Deployment Master Plan

## Goal

Move the existing AgriSight project from a laptop-dependent development setup to a production Android application that works on the already-installed phone **without USB** and without the laptop running.

### Current phase

**Deploy the existing frontend + backend + authentication + database + storage + mobile app.**

### Explicitly postponed

- Edge AI
- ESP32 / sensors
- Pump / relay / hardware integration

Those will be added later without redesigning the core app.

---

## 1. Final Runtime Architecture

Development may currently be:

```text
Android phone
     |
   USB/ADB
     |
   Laptop
   ├── Next.js
   └── FastAPI
```

This is NOT the final setup.

Production should be:

```text
                 ANDROID PHONE
                 AgriSight App
                       |
                     HTTPS
                       |
          +------------+-------------+
          |                          |
          v                          v
   Deployed Frontend            FastAPI Backend
   / static app assets          Render / Railway
                                     |
                          +----------+----------+
                          |                     |
                          v                     v
                    Supabase Auth          PostgreSQL
                                               |
                                               v
                                         Supabase Storage
```

The laptop must not be required at runtime.

---

# 2. Recommended Deployment Stack

Keep the existing technology stack.

### Frontend

- Next.js
- Existing App Router
- Existing Capacitor Android project
- Vercel for web deployment where appropriate
- Static export if the current Capacitor architecture uses `out/`

### Backend

- Existing FastAPI
- Uvicorn
- Render or Railway

Example:

```text
https://api-agrisight.<production-domain>
```

Never use:

```text
http://localhost:8000
http://127.0.0.1:8000
http://192.168.x.x:8000
```

### Auth / Database / Storage

Use the existing Supabase project:

- Supabase Auth
- PostgreSQL
- Supabase Storage
- Row Level Security

Do not introduce another database/auth provider unless the existing implementation truly requires it.

---

# 3. First: Audit the Existing Repository

Before rewriting anything, inspect the entire project.

Inspect:

```text
package.json
next.config.*
capacitor.config.*
.env*
src/
app/
components/
lib/
services/
hooks/
public/
android/
backend/
server/
api/
supabase/
```

Also inspect:

- authentication
- Supabase client
- FastAPI routes
- database models
- API clients
- environment variables
- image upload
- camera integration
- Capacitor configuration
- static export
- dynamic routes
- fields
- crops
- scans
- history
- analytics
- assistant
- error handling

Create an inventory:

```text
WORKING
BROKEN
LOCALHOST-DEPENDENT
ENVIRONMENT-DEPENDENT
PRODUCTION-READY
MISSING
```

Do not blindly delete existing code.

---

# 4. Environment Variables

Separate development and production settings.

## Frontend

Use only client-safe variables:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_API_URL=https://api-agrisight.example
```

Never expose:

```env
SUPABASE_SERVICE_ROLE_KEY
DATABASE_PASSWORD
JWT_SIGNING_SECRET
PRIVATE_API_KEY
```

## Backend

Example:

```env
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_ANON_KEY=...
DATABASE_URL=...
CORS_ORIGINS=...
```

Keep secrets only in the deployment provider's environment-variable settings.

---

# 5. FastAPI Deployment

Deploy the existing FastAPI backend to Render or Railway.

The server must listen on the provider's port:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

Provide:

```text
GET /health
```

Example:

```json
{
  "status": "ok",
  "service": "agrisight-api"
}
```

Verify the endpoint publicly before connecting the Android app.

---

# 6. Production CORS

Configure CORS for the real production origins.

Do not blindly use:

```python
allow_origins=["*"]
```

for the authenticated production API.

Allow the deployed web origin and the required Capacitor/mobile origin according to the actual implementation.

Test:

- GET
- POST
- authenticated requests
- image upload
- logout
- error responses

from the real Android app.

---

# 7. Authentication — Complete Production Flow

The mobile application must support:

### Sign up

```text
Full Name
Username
Email
Password
Confirm Password
Language
```

Validate:

- email
- password
- unique username
- duplicate email
- required fields

### Email verification

```text
Sign Up
   ↓
Verification Email
   ↓
Verify
   ↓
Login / Authenticated Session
```

Use Supabase's real email verification flow.

### Login

Support:

```text
Email + Password
Google/Gmail
```

### Forgot password

```text
Forgot Password
      ↓
Email
      ↓
Reset Link
      ↓
New Password
      ↓
Login
```

### Google login

Configure the production OAuth redirect URLs.

Do not leave callbacks pointing at:

```text
localhost
```

or a laptop IP.

For Capacitor, use the proper native/deep-link OAuth flow supported by the actual project. Do not invent a callback URL; configure the exact callback scheme/domain used by the project.

### Session

Verify that:

- login survives app restart
- logout clears the session
- expired sessions are handled
- authenticated API requests send the correct access token

---

# 8. User Profiles and Username

Keep authentication identity in Supabase Auth.

Keep application profile information in a `profiles` table.

Recommended structure:

```text
profiles
---------
id UUID PRIMARY KEY
username TEXT UNIQUE NOT NULL
full_name TEXT
avatar_url TEXT
language TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

Never store passwords here.

The profile ID should correspond to the authenticated user's ID.

---

# 9. Database Security

Use Row Level Security.

A user must only access their own:

- profile
- fields
- crops
- scans
- history
- analytics
- alerts
- recommendations
- assistant history if stored
- private uploads

Never trust a client-provided `user_id`.

Use the authenticated session/token as the ownership source.

---

# 10. Centralize API Configuration

Create or reuse one API client.

Example:

```text
lib/api/client.ts
```

Use:

```env
NEXT_PUBLIC_API_URL
```

instead of hardcoded URLs.

Bad:

```ts
fetch("http://localhost:8000/api/...")
```

Good:

```ts
fetch(`${API_URL}/api/v1/...`)
```

Search the entire repository for:

```text
localhost
127.0.0.1
192.168.
10.
0.0.0.0
:3000
:8000
:8080
```

Review every match.

Production must have no runtime dependency on the laptop.

---

# 11. Capacitor / Android

Preserve the existing configuration if already correct:

```text
appId: com.agrisight.app
appName: AgriSight
webDir: out
```

Verify:

- Android project exists
- app ID is correct
- web directory is correct
- camera permission
- photo/gallery permission
- microphone permission only if voice is used
- location permission only if actually required
- network access
- splash screen
- status bar
- back navigation

Do not request unnecessary permissions.

---

# 12. Build Flow

If the current project uses Next.js static export:

```bash
npm install
npm run build
npx cap sync android
```

Then create the Android release build.

Dynamic routes such as:

```text
/crops/[id]
/fields/[id]
/analysis/[id]
```

must continue working with the existing static-export/client-view architecture.

Do not unnecessarily convert the application into a server-only Next.js deployment if the Android app depends on static export.

---

# 13. Mobile Scan Flow

The phone must support:

```text
Field
  ↓
Scan Leaf
  ↓
Camera OR Gallery
  ↓
Crop validation
  ↓
Analysis
  ↓
Save result
  ↓
Field History
```

Scan Leaf must exist:

- globally
- prominently inside every Field

When launched from a Field, automatically associate the scan with that Field and Crop where applicable.

No USB or laptop should be involved.

---

# 14. Field-Centric Architecture

The Field remains the source of truth.

```text
User
 └── Fields
      ├── Crops
      ├── Scans
      ├── Scan History
      ├── Analytics
      ├── Alerts
      ├── Recommendations
      └── Future Field Node
```

A Field workspace should include:

- Field Health
- Conditions
- Scan Leaf
- AI Insight
- Alerts
- Crop
- Recent Scans
- Field History
- Field Analytics
- Recommendations
- Ask AgriSight

Hardware is future functionality and must not block the current release.

---

# 15. Scan Data

Save real scan results.

Conceptual table:

```text
scans
-----
id
user_id
field_id
crop_id
image_url
analysis_type
crop_name
condition
severity
summary
confidence
created_at
```

Only save confidence when it comes from a real analysis result.

Never create fake fallback results such as:

```text
99.8% confidence
Healthy Plant
Tomato
```

when analysis fails.

---

# 16. Crop / Non-Crop Validation

The scan pipeline must distinguish:

```text
CROP
NON-CROP
UNCERTAIN
```

Reject or request retry for:

- person
- animal
- room
- car
- building
- random object
- unrelated landscape

Do not turn an invalid image into a fake crop diagnosis.

---

# 17. Current AI — For This Phase Only

Keep the current AI implementation if it is required by the existing app.

But:

- keep provider secrets on the backend
- never expose secret keys in the Android app
- handle provider failures
- provide loading/error/retry states
- never fabricate an AI answer

### Edge AI is postponed.

Later the analysis service can become:

```text
Analysis Service
      |
      +-- Current/Remote AI
      |
      +-- Future Edge AI
```

The UI should not need to change just because the inference location changes.

---

# 18. Offline Clarification

For this phase, distinguish two requirements.

### Requirement A — No USB / no laptop

**Must work.**

### Requirement B — No internet at all

A deployed cloud backend and cloud authentication cannot operate with zero network connectivity unless a separate local/offline authentication and synchronization system is implemented.

Do not falsely claim that the current cloud backend works without internet.

For this phase implement:

- network detection
- useful offline screen
- cached non-sensitive data where appropriate
- retry behavior
- graceful API failure states

Later Edge AI/local storage can provide deeper offline functionality.

---

# 19. Production Security

Never package these into the mobile app:

```text
SUPABASE_SERVICE_ROLE_KEY
DATABASE_PASSWORD
JWT_SIGNING_SECRET
PRIVATE_AI_KEY
ADMIN_SECRET
```

Use HTTPS.

Validate backend input.

Use authentication middleware.

Use database RLS.

Never trust client ownership IDs.

---

# 20. Hardware — Later

Do not block the current mobile deployment on hardware.

Future:

```text
AgriSight App
     |
 Field Node API
     |
   ESP32
  /  |   soil DHT22 pH
```

Possible future endpoints:

```text
POST /api/v1/iot/sensor-data
GET  /api/v1/iot/latest/{field_id}
GET  /api/v1/iot/history/{field_id}
```

These can remain future-ready without requiring hardware now.

---

# 21. Edge AI — Later

Do not implement Edge AI in this deployment.

Keep the software abstraction clean so that later:

```text
Camera
  ↓
Edge AI
  ↓
Sensor Fusion
  ↓
Decision Engine
```

can replace or augment the current analysis provider.

---

# 22. Release Build

Create a signed:

```text
APK
```

for direct testing and/or:

```text
AAB
```

for Play Store deployment.

Before release verify:

```text
No localhost
No laptop IP
No development API
No hardcoded secrets
No broken OAuth
No broken camera
No broken deep links
No missing assets
No debug-only dependencies
```

---

# 23. Critical Final Test

This is the most important test.

### Step 1

Build and install the release APK.

### Step 2

Disconnect USB.

### Step 3

Close Android Studio.

### Step 4

Shut down the laptop completely.

### Step 5

Open AgriSight on the phone.

### Step 6

Test:

```text
Sign up
Email verification
Login
Google login
Forgot password
Profile
Username
Create Field
Add Crop
Open Field
Scan Leaf
Camera
Gallery
Analysis
Save scan
Scan History
Field History
Analytics
Alerts
Assistant
Logout
Login again
Close app
Reopen app
```

### Step 7

Verify that all persistent data is still present.

If something fails, identify whether the root cause is:

```text
Frontend
Backend
Auth
Database
Storage
OAuth
Capacitor
Android
Network
Environment
```

Fix the root cause.

Do not add fake data as a workaround.

---

# 24. Production Deliverables

At completion, provide:

```text
1. Android release APK/AAB
2. Production frontend URL
3. Production FastAPI URL
4. Supabase project configured
5. Auth providers configured
6. Google OAuth configured
7. Email verification configured
8. Password reset configured
9. Database/RLS verified
10. Storage policies verified
11. /health endpoint
12. Production environment-variable checklist
13. Deployment README
14. Final QA report
```

Never include secret values in documentation.

---

# 25. Antigravity / Coding Agent Execution Order

Use this exact sequence.

## STEP 1 — Inspect

Understand the entire existing repository before editing.

## STEP 2 — Inventory

Record:

```text
Frontend
Backend
Auth
Supabase
Storage
API endpoints
Environment variables
Capacitor
Localhost references
Broken flows
```

## STEP 3 — Fix configuration

Centralize:

- API URL
- Supabase configuration
- auth redirects
- environment variables
- error handling

## STEP 4 — Deploy FastAPI

Deploy the existing backend.

Verify:

```text
GET /health
```

Then verify authenticated APIs.

## STEP 5 — Configure Supabase

Verify:

- Auth
- Google OAuth
- email verification
- password reset
- redirect URLs
- profiles
- RLS
- storage

## STEP 6 — Configure frontend

Replace development URLs with production configuration.

## STEP 7 — Build Android

Build the production web assets.

Sync Capacitor.

Fix all Android build errors.

## STEP 8 — Real-phone test

Install the release build.

## STEP 9 — USB independence test

Disconnect USB and shut down the laptop.

Test every major feature.

## STEP 10 — Fix failures

Fix root causes.

Never hide failures with mock/default data.

## STEP 11 — Regression test

Repeat authentication, fields, crops, scans, history, analytics, profile, logout, restart.

## STEP 12 — Final report

Report:

```text
FRONTEND STATUS
BACKEND STATUS
AUTH STATUS
DATABASE STATUS
STORAGE STATUS
ANDROID STATUS
USB INDEPENDENCE STATUS
KNOWN LIMITATIONS
NEXT PHASE: HARDWARE + EDGE AI
```

Do not claim a feature is complete unless it has actually been tested.

---

# 26. Definition of Done

AgriSight is successfully transferred when this works:

```text
             LAPTOP
                X
                |
       NOT REQUIRED AT RUNTIME
                |
        +-------v--------+
        |  ANDROID APP   |
        |    AgriSight   |
        +-------+--------+
                |
              HTTPS
                |
        +-------v--------+
        | FASTAPI BACKEND|
        +-------+--------+
                |
        +-------v--------+
        |    SUPABASE    |
        | Auth + DB +    |
        | Storage        |
        +----------------+
```

The installed application must work after:

- USB is disconnected
- Android Studio is closed
- the laptop is powered off

The current release does not require:

- ESP32
- sensors
- pump
- Edge AI

Those are the next development phases.

---

# 27. Final Product Roadmap

### Phase 1 — NOW

**Production Mobile + Backend**

```text
Next.js
FastAPI
Supabase
Capacitor
Android
Authentication
Fields
Crops
Scans
History
Analytics
```

### Phase 2 — HARDWARE

```text
ESP32
Soil Moisture
DHT22
pH
Flow Sensor
Relay/Pump
Field Node
```

### Phase 3 — EDGE AI

```text
Qualcomm Edge Platform
Vision AI
Local Speech
Sensor Fusion
Offline Decision Engine
Local Agricultural Knowledge
```

Final product direction:

> **AgriSight — Field Intelligence for Smarter, Safer Farming**
