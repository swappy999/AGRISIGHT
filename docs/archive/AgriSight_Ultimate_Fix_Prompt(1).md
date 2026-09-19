# AgriSight — Ultimate Fix & UI/UX Master Prompt

## Mission

You are working on the existing **AgriSight** application.

Do **not** rebuild the project from scratch and do **not** replace working functionality unnecessarily.

Your immediate goal is to completely audit, debug, stabilize, and polish the existing application before adding new SIH26180 features.

> **Priority: Make the existing AgriSight product stable, clean, responsive, multilingual, voice-enabled, and fully functional first.**

---

## 1. Full Project Audit

Before changing code, inspect:

- Frontend architecture and routes
- Backend and API routes
- Authentication
- Database and Supabase configuration
- RLS policies
- AI integration
- Voice/STT/TTS implementation
- Multilingual implementation
- Image upload and scan pipeline
- Field creation/update/delete
- Field images
- Heatmap/map implementation
- Dashboard
- Sidebar/navigation
- Mobile responsiveness
- State management
- Loading/error handling
- Environment variables
- Console errors
- Network/API failures

Identify root causes before patching.

---

## 2. Preserve Existing Functionality

Do not break working features.

Before changing a feature:

1. Understand its implementation.
2. Identify dependencies.
3. Identify shared components.
4. Identify API contracts.
5. Identify database relationships.
6. Identify environment variables.

Do not arbitrarily change API response formats, schemas, authentication, or working routes unless necessary. If a contract must change, update every dependent component.

---

# 3. AI Assistant — Complete Repair

The current AgriSight AI Assistant is unreliable. It produces unnecessary content/UI, has inconsistent behavior, and has broken voice and multilingual functionality.

Turn it into a focused:

## AgriSight Agricultural Copilot

It must:

- Stay focused on agriculture and farm operations.
- Use available farmer/field/crop context.
- Avoid irrelevant generic chatbot behavior.
- Avoid unnecessary popups and UI.
- Give concise, practical, actionable responses.
- Never expose debug/test content.

Relevant context can include:

- User
- Farm
- Field
- Crop
- Growth stage
- Soil data
- Weather
- Recent scans
- Diagnoses
- Alerts
- Farm history

If the user asks something unrelated, politely redirect toward agricultural assistance.

---

# 4. Remove Unnecessary UI

Audit all AI assistant components and remove:

- Duplicate assistant windows
- Random popups
- Duplicate messages
- Unnecessary tooltips
- Irrelevant suggestion cards
- Repeated notifications
- Debug text
- Test content
- Broken loaders
- Duplicate voice controls
- Floating elements that cover content

There should be **one coherent AI assistant experience**.

---

# 5. Global AI Assistant

Create/reuse a global reusable component:

`<AgriAssistant />`

It should be accessible from:

- Dashboard
- Fields
- Scan
- Crop pages
- Alerts
- Analytics
- Profile
- Mobile navigation

Desktop:

- Persistent access
- Expandable assistant
- Clean chat interface
- Voice controls
- Language selector
- Conversation history

Mobile:

- Floating AI button
- Bottom-sheet or full-screen assistant
- Proper keyboard handling
- Safe-area support
- Accessible microphone button
- No overlap with navigation or content

---

# 6. Context-Aware AI

If the farmer is viewing:

- Field: Field A
- Crop: Tomato
- Soil moisture: 28%

and asks:

> "Should I water my crop?"

The AI should use the existing context instead of asking for information already available.

Use a structured context object:

```text
user
field
crop
growth_stage
soil_data
weather
recent_scans
recent_alerts
farm_history
```

Send only relevant context to the AI.

---

# 7. AI Response Quality

Stop unnecessary verbose responses.

Default style:

- Concise
- Farmer-friendly
- Practical
- Action-oriented
- Structured
- Localized

Preferred structure:

```text
🌱 Possible Water Stress

Your soil moisture is low.

Current:
• Soil moisture: 28%
• Temperature: 34°C
• Rain probability: 8%

Recommendation:
Irrigation is recommended within the next 3 hours.

Risk: HIGH
```

Prioritize:

1. Diagnosis
2. Evidence
3. Risk
4. Recommended action

---

# 8. Multilingual AI

Fix the entire multilingual pipeline.

Initially support:

- English
- Bengali
- Hindi

Language must work for:

- Text input
- Voice input
- AI response
- Voice output

---

# 9. Automatic Language Detection

If the user speaks Bengali:

```text
Bengali speech
→ Bengali transcription
→ AI Bengali response
→ Bengali TTS
```

Hindi:

```text
Hindi speech
→ Hindi transcription
→ AI Hindi response
→ Hindi TTS
```

English:

```text
English speech
→ English transcription
→ AI English response
→ English TTS
```

Also retain a manual language selector.

Create one centralized language configuration:

```text
English → en-IN
Bengali → bn-IN
Hindi → hi-IN
```

Do not hard-code language mappings across multiple components.

---

# 10. Voice Input — Fix Completely

Current problem:

The microphone starts and stops immediately.

Investigate the real cause:

- Browser permissions
- MediaRecorder
- Web Speech API
- SpeechRecognition
- MIME types
- Audio stream lifecycle
- Component unmounting
- State reset
- Permission handling
- Mobile browser support
- HTTPS requirements
- Microphone cleanup
- Timeout logic
- API errors

Do not simply add another microphone button.

Use a reliable state machine:

```text
IDLE
→ REQUEST_PERMISSION
→ READY
→ LISTENING
→ PROCESSING
→ TRANSCRIBED
→ SEND_TO_AI
→ RECEIVE_RESPONSE
→ SPEAKING
→ IDLE
```

Failure:

```text
ERROR
→ Clear user-friendly message
→ Retry
```

Never silently stop.

---

# 11. Voice Output — Fix Completely

Current problem:

AI response is generated but voice output does not play.

Audit:

- Speech synthesis
- Audio permissions
- Autoplay restrictions
- User interaction requirements
- Language codes
- Bengali voice availability
- Hindi voice availability
- Browser compatibility
- Audio cleanup
- Duplicate playback
- Speech cancellation
- Async state handling

Create/reuse:

`<VoiceOutput />`

Controls:

- Play
- Pause
- Stop
- Replay

Show speaking state clearly:

```text
🔊 Speaking...
```

and:

```text
▶ Listen
```

---

# 12. Shared Voice + AI Pipeline

Do not create separate AI logic for voice and text.

Use:

```text
TEXT INPUT ─┐
            ↓
        AI PIPELINE
            ↓
TEXT OUTPUT
            ↓
VOICE OUTPUT
```

Voice should be an input/output layer around the same AI pipeline.

---

# 13. Scan — Complete Repair

Audit:

- Camera
- File upload
- Image preview
- Image compression
- Image validation
- API upload
- AI inference
- Response parsing
- Result rendering
- Loading
- Errors
- Retry
- Mobile camera behavior
- Save-to-field flow

Required flow:

```text
OPEN SCANNER
→ Camera / Upload
→ Capture Image
→ Preview
→ Confirm
→ Uploading
→ AI Analysis
→ Diagnosis
→ Severity
→ Confidence
→ Recommended Action
→ Save Scan
```

Do not automatically submit accidental images.

---

# 14. Scan UX

Use a clear mobile-friendly scanner:

```text
┌──────────────────────────────┐
│       Scan Your Crop         │
│                              │
│        ┌───────────┐         │
│        │           │         │
│        │  CAMERA   │         │
│        │   AREA    │         │
│        │           │         │
│        └───────────┘         │
│                              │
│   [ Take Photo ]             │
│   [ Upload Image ]           │
└──────────────────────────────┘
```

After capture:

```text
Image Preview

[ Retake ] [ Analyze ]
```

During analysis, show real processing stages only.

---

# 15. Scan Results

Use a structured result:

```text
🌿 CROP DIAGNOSIS

Disease:
Early Blight

Confidence:
91%

Severity:
Moderate

Risk:
HIGH

Symptoms:
• Brown lesions
• Yellowing leaves

Recommended Action:
• Remove severely affected leaves
• Improve airflow
• Follow approved IPM guidance
```

Provide:

- Scan Again
- Save to Field

---

# 16. Fix All Text Overlap

Perform a complete responsive typography audit.

Fix:

- Overlapping words
- Clipped text
- Buttons covering text
- Cards overflowing
- Long headings
- Fixed-width components
- Long AI responses
- Chart overflow
- Badge overlap
- Sidebar collision
- Mobile navbar collision

Use proper:

- Flex/grid behavior
- `min-width: 0`
- Text wrapping
- Responsive spacing
- Max-width containers
- Overflow handling

Never solve overflow by simply hiding important content.

---

# 17. Mobile-First Responsive Design

Test at:

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

Requirements:

- No horizontal scrolling
- No clipped content
- No overlap
- No desktop-only assumptions
- Proper cards
- Proper charts
- Proper maps
- Proper scan camera
- Proper AI assistant
- Proper keyboard behavior

---

# 18. Sidebar / Navigation

Current issue: sidebar does not appear correctly.

Desktop:

```text
┌─────────────┬───────────────────────┐
│ AgriSight   │                       │
│             │       Content         │
│ Dashboard   │                       │
│ Fields      │                       │
│ Scan        │                       │
│ Crops       │                       │
│ Analytics   │                       │
│ Alerts      │                       │
│ AI Assistant│                       │
│ Settings    │                       │
└─────────────┴───────────────────────┘
```

Mobile:

- Hamburger menu
- Slide-in navigation
- Bottom navigation where appropriate

Do not merely shrink the desktop sidebar.

---

# 19. Global Design System

Redesign the UI consistently.

AgriSight should feel:

- Professional
- Agricultural
- Modern
- Trustworthy
- Calm
- Premium
- Technology-driven
- Accessible

Avoid:

- Excessive gradients
- Excessive glassmorphism
- Random animations
- Generic AI dashboard appearance
- Excessive neon
- Clutter
- Oversized cards

Visual identity:

> Nature + Intelligence + Precision Agriculture

Use:

- Agricultural greens
- Neutral backgrounds
- Subtle earth tones
- Clean cards
- Strong typography
- Restrained shadows
- Meaningful icons

Animations should improve understanding, not distract.

---

# 20. Dashboard Redesign

The dashboard should answer:

> **What is happening to my farm?**

Top:

```text
Good Morning, Farmer 🌱

Farm Health
82%
```

Then:

- Crop Health
- Water Status
- Disease Risk
- Pest Risk
- Weather Risk

Then:

- Action Required
- Recent Scans
- Farm Health Map
- Ask AgriSight

Prioritize actionable information.

---

# 21. Field Management — Fix Existing Bug

Current issue:

User adds a field but receives an error afterward.

Debug the entire chain:

```text
Field Form
→ Validation
→ Frontend Payload
→ API Request
→ Backend Validation
→ Database Insert
→ Response
→ Frontend State Update
→ Field Card
```

Check:

- Field ID
- User ID
- Farm ID
- Crop
- Location
- Coordinates
- Database constraints
- Required fields
- Authentication
- Supabase RLS
- API response
- JSON structure

After successful creation:

```text
Field created successfully
```

and show it immediately without requiring refresh.

---

# 22. Field Creation UX

Use:

```text
Add New Field

Field Name
[________________]

Crop
[ Select Crop ]

Area
[____] acres/hectares

Location
[ Use Current Location ]

Crop Stage
[ Select ]

Planting Date
[ Select ]

[ Cancel ] [ Add Field ]
```

Show clear validation instead of raw API errors.

---

# 23. Field Images

Audit:

- Image URL generation
- Storage bucket
- Upload
- Permissions
- Public/private URLs
- Image loading
- Fallback
- Broken-image handling
- Responsive sizing

If no image exists:

```text
🌱
No field image yet

[ Add Image ]
```

Never show broken image icons.

---

# 24. Farm Heatmap — Fix Completely

Current issue: heatmap does not appear.

Investigate:

- Map component
- Coordinates
- Field boundaries
- Data source
- API response
- Map layers
- Loading
- Empty state
- Mobile rendering
- Provider/token configuration

If the existing map provider is blocking development, implement a working fallback visualization.

Heatmap colors/levels:

```text
Green   = Healthy
Yellow  = Moderate Risk
Orange  = High Risk
Red     = Critical
```

Use real field/scan/risk data.

Do not use fake production data.

If demo data is necessary, isolate it behind:

`DEMO_MODE`

---

# 25. Field Health View

Each field should provide:

- Crop
- Health Score
- Disease Risk
- Pest Risk
- Water Stress
- Weather Risk
- Recent Scans
- Sensor Data
- Heatmap
- AI Recommendations

This becomes the central field intelligence screen.

---

# 26. Error Handling

Never expose raw:

- Stack traces
- API errors
- Database errors
- JSON parsing errors
- `undefined`
- `null`
- Technical error codes

to farmers.

Instead:

```text
Something went wrong.

We couldn't save your field.

[ Try Again ]
```

Log detailed errors for developers.

---

# 27. Loading States

Every asynchronous operation needs a clear state:

- Saving field...
- Analyzing image...
- Loading farm...
- Starting microphone...
- Processing voice...
- Generating recommendation...
- Loading heatmap...
- Syncing data...

Never freeze the UI or leave users guessing.

---

# 28. Empty States

Create useful empty states for:

- Fields
- Scans
- Alerts
- Analytics
- AI history
- Images
- Heatmap

Example:

```text
No Fields Added Yet 🌱

Create your first field to start
monitoring crop health.

[ Add Field ]
```

---

# 29. Performance

Optimize:

- Unnecessary re-renders
- Image sizes
- API calls
- AI calls
- Charts
- Maps
- Voice components
- Dashboard loading

Prevent AI API calls caused by accidental component re-renders.

Use proper caching/state management.

---

# 30. Security

Never expose API keys in frontend code.

Check:

- Environment variables
- API authentication
- Supabase RLS
- Upload permissions
- User-specific field access
- AI API keys
- Storage access

Users must only access authorized farm data.

---

# 31. Database Consistency

Expected logical model:

```text
User
 ↓
Farm
 ↓
Field
 ↓
Crop
 ↓
Scan
 ↓
Diagnosis
 ↓
Recommendation
```

Future-ready:

```text
Field
 ↓
Sensors
 ↓
Sensor Readings
 ↓
Risk Events
 ↓
Alerts
```

Reuse existing tables where possible instead of creating duplicates.

---

# 32. Structured AI Responses

Create one reliable backend AI service.

Concept:

```text
Frontend
 ↓
FastAPI
 ↓
AI Service
 ├── Vision Model
 ├── Agricultural Knowledge
 ├── Gemini
 └── Risk Engine
 ↓
Structured Response
 ↓
Frontend
```

Return structured JSON.

Do not make the frontend parse arbitrary natural-language AI responses to determine disease, severity, or confidence.

Suggested response structure:

```text
{
  diagnosis,
  confidence,
  severity,
  risk_level,
  symptoms,
  possible_causes,
  recommended_actions,
  prevention,
  follow_up,
  language
}
```

Adapt this to the existing backend rather than blindly replacing the current API.

---

# 33. AI Safety

If confidence is low:

```text
The image is unclear and I cannot confidently identify the problem.

Please capture another image in good lighting.
```

For nutrient/fertilizer/pesticide recommendations, clearly distinguish:

- AI suggestion
- Agricultural guidance
- Professional confirmation

Do not invent pesticide dosages.

---

# 34. Demo Mode

If a service is unavailable during development, use a clearly separated:

`DEMO_MODE`

Never mix mock data into production logic.

Possible demo-only mocks:

- Sensor data
- Heatmap data
- Weather
- Scan results

---

# 35. Testing

Test every major flow.

## Authentication

- Login
- Logout
- Session persistence

## AI

- Text question
- English
- Bengali
- Hindi
- Context-aware questions

## Voice

- Microphone permission
- English input
- Bengali input
- Hindi input
- AI voice response
- Stop
- Replay

## Scan

- Camera
- Upload
- Preview
- Analysis
- Result
- Save

## Fields

- Add
- Edit
- Delete
- View
- Image
- Location

## Heatmap

- Load
- Render
- Mobile
- Desktop
- Empty state

## Responsive

- 320px
- 375px
- 390px
- 414px
- Tablet
- Desktop

---

# 36. No Fake Success

Never display success if the underlying operation failed.

Do not show:

- "Field added successfully" when database insert failed
- "AI analysis completed" when AI failed
- Fake heatmaps when real data is unavailable
- Fake voice recognition

UI state must always reflect actual system state.

---

# 37. Current Product Completion Target

Before implementing new SIH26180 features, the following must work:

- AI assistant
- Clean AI responses
- Voice input
- Voice output
- Bengali
- Hindi
- English
- Crop scan
- Field creation
- Field images
- Heatmap
- Sidebar
- Mobile UI
- Desktop UI
- No text overlap
- Proper errors
- Proper loading states
- No unnecessary popups
- Correct navigation

---

# 38. SIH26180 Future Architecture

Only after Phase 1 is stable, prepare extension points for:

## Edge AI

- Lightweight vision models
- ONNX/TFLite
- Quantized inference

## IoT

- ESP32
- Soil moisture
- Temperature
- Humidity
- Light
- Rain

## Predictive Risk

- Disease risk
- Pest risk
- Water stress
- Climate risk

## Farm Intelligence

- Health map
- Field analytics
- Regional hotspots

## Offline

- Local inference
- SQLite
- Sync queue

## Digital Twin

- Farm simulation
- What-if scenarios

Do not implement all of these before the existing system is stable.

---

# 39. Final Farmer Journey

The complete journey should work:

```text
LOGIN
 ↓
DASHBOARD
 ↓
ADD FIELD
 ↓
FIELD CREATED
 ↓
SELECT CROP
 ↓
SCAN CROP
 ↓
CAPTURE IMAGE
 ↓
AI ANALYSIS
 ↓
DIAGNOSIS
 ↓
RISK SCORE
 ↓
RECOMMENDATION
 ↓
SAVE RESULT TO FIELD
 ↓
FIELD HEALTH UPDATED
 ↓
HEATMAP UPDATED
 ↓
FARMER ASKS AI ASSISTANT
 ↓
VOICE / TEXT
 ↓
BENGALI / HINDI / ENGLISH
 ↓
AI ANSWER
 ↓
VOICE RESPONSE
```

Every step must actually work.

---

# 40. Execution Rules

Do not merely tell me what is wrong.

**Actually fix the project.**

For every bug:

1. Find the root cause.
2. Fix backend if required.
3. Fix frontend if required.
4. Fix state management if required.
5. Fix database/API integration if required.
6. Test the complete flow.
7. Test mobile.
8. Test desktop.
9. Check console errors.
10. Check network errors.
11. Verify the final UX.

Do not claim something is fixed unless it has actually been verified.

---

# 41. Final Report After Implementation

After completing the work, provide:

## Fixed
Every issue actually fixed.

## Changed
Major architecture/UI changes.

## Tested
Flows that were actually tested.

## Remaining
Only genuinely unresolved issues.

## Next SIH Phase
Features ready to implement next:

- Edge AI
- IoT
- Offline inference
- Smart irrigation
- Pest detection
- Nutrient deficiency
- Climate risk
- Predictive analytics
- Farm health map
- Officer dashboard
- Regional intelligence
- Digital Twin

---

# FINAL OBJECTIVE

AgriSight must stop feeling like a partially working AI college project.

It should feel like a real agricultural technology product:

> **Reliable. Simple. Mobile-first. Multilingual. Voice-enabled. Context-aware. Data-driven. Offline-ready.**

First make the current product **actually work**.

Then evolve it into the complete **SIH26180 Edge-AI Smart Farming Assistant**.
