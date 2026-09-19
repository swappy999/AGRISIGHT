# AgriSight — Multilingual, Voice, Comparison & Field Intelligence Fix

## Mission

Repair the existing AgriSight application without rebuilding it.

Priority:

**Multilingual completeness → Voice → Scan Comparison → Field Linking → Field Images → Field Map → Mobile Fields Navigation → Full Regression**

Do not add unrelated features.
Do not replace working architecture.
Do not change the farmer workflow unnecessarily.

---

## 1. FULL MULTILINGUAL SUPPORT

Supported:

- English: `en`
- Hindi: `hi`
- Bengali: `bn`

When Hindi is selected, all user-facing content must be Hindi.
When Bengali is selected, all user-facing content must be Bengali.
English is only a fallback when a genuine translation is unavailable.

This applies to:

- Dashboard
- Crop pages
- Field pages
- Scan page
- AI preview
- AI diagnosis
- Severity
- Confidence
- Symptoms
- Causes
- Actions
- Forecasts
- Risk
- Weather explanations
- Assistant
- History
- Comparison
- Interventions
- Notifications
- Loading states
- Empty states
- Errors
- Toasts
- Forms
- Validation messages
- Voice UI

Do a full codebase audit for hardcoded English.

Use the existing translation system (`translations/index.ts` or equivalent). Do not create a second localization architecture.

---

## 2. DYNAMIC AI CONTENT MUST FOLLOW LANGUAGE

Frontend must explicitly send the selected language to the backend.

Example:

```json
{"language":"bn"}
```

or:

```json
{"language":"hi"}
```

or:

```json
{"language":"en"}
```

FastAPI and the Gemini service must pass that language into the AI prompt.

The AI must generate every natural-language field in that language.

For Bengali:

- diagnosis explanation
- symptoms
- causes
- actions
- cautions
- forecast
- follow-up
- rationale
- recommendations

must be Bengali.

For Hindi, the same must be Hindi.

Do not merely translate headings while Gemini returns English paragraphs.

Keep internal enums stable:

```text
severity = moderate
trend = improving
risk = high
```

Translate only at presentation.

---

## 3. SCAN PAGE

Audit `/scan`.

All UI must follow the selected language:

- Take Photo
- Upload
- Drag & Drop
- Select Crop
- Ask Question
- Voice Input
- Analyze
- Retake
- Camera errors
- Image-quality warnings
- Loading
- AI preview
- Errors
- Success

AI preview messages must also be localized.

Example Bengali:

```text
পাতা বিশ্লেষণ করা হচ্ছে...
লক্ষণ পরীক্ষা করা হচ্ছে...
ফলাফল প্রস্তুত করা হচ্ছে...
```

Example Hindi:

```text
पत्ती का विश्लेषण किया जा रहा है...
लक्षणों की जाँच की जा रही है...
परिणाम तैयार किया जा रहा है...
```

---

## 4. AI ANALYSIS PAGE

Audit `/analysis/[id]`.

The selected language must control:

- Diagnosis presentation
- Severity
- Confidence explanation
- Symptoms
- Causes
- Immediate actions
- Prevention
- Cautions
- Forecast
- Follow-up
- Evidence
- Rationale
- Retry guidance
- Audio controls

Do not allow English AI paragraphs under Hindi/Bengali headings.

---

## 5. DASHBOARD

Audit `/dashboard`.

When Hindi/Bengali is selected, dynamic summaries must also change.

Fix:

- Farm summary
- Crop health summary
- Active issues
- Priority actions
- Weather
- Risk
- Recent scans
- Notifications
- Assistant widget
- Statistics
- Empty states

Use translation templates for dynamic text, e.g.:

```text
t("dashboard.cropsNeedAttention", { count })
```

Do not hardcode English summary sentences.

---

## 6. WEATHER + RISK

Weather numbers can remain numeric:

```text
28°C
82%
12 mm
```

But interpretation must use the selected language.

Risk labels, explanations, evidence, actions, disease risk, weather risk, recurrence risk, and stress risk must all be localized.

---

## 7. CROP + FIELD INTELLIGENCE

Audit:

```text
/crops
/crops/new
/crops/[id]
/fields
/fields/[id]
```

Localize:

- Crop labels
- Variety
- Planting date
- Growth stage
- Field
- Notes
- Health
- Trend
- History
- Disease recurrence
- Interventions
- Field health
- Plant survival
- Hotspots
- Soil
- Irrigation
- Location
- GPS
- Actions
- Empty states
- Errors

User-entered crop/field names must remain unchanged.

---

# 8. VOICE INPUT — FIX PREMATURE STOPPING

The current Web Speech API voice input stops while the user is still speaking.

Inspect the existing implementation, especially:

- `onstart`
- `onresult`
- `onend`
- `onerror`
- interim results
- restart logic
- permission state
- abort state
- browser compatibility
- React state synchronization

Implement a robust lifecycle:

```text
IDLE
↓
REQUESTING_PERMISSION
↓
LISTENING
↓
PROCESSING
↓
COMPLETE
```

Errors:

```text
PERMISSION_DENIED
NO_SPEECH
NETWORK_ERROR
NOT_SUPPORTED
ABORTED
UNKNOWN_ERROR
```

Use interim results where supported.

Do not stop after the first partial result.

If recognition ends unexpectedly while the user is still speaking, safely restart where supported.

Do not create infinite restart loops.

When the user explicitly presses Stop, set an explicit stop flag and never automatically restart.

---

# 9. VOICE RECOGNITION LANGUAGE

Use Indian language codes:

```text
English → en-IN
Hindi   → hi-IN
Bengali → bn-IN
```

The selected application language controls speech recognition.

Bengali selected:

```text
recognition.lang = "bn-IN"
```

Hindi selected:

```text
recognition.lang = "hi-IN"
```

English selected:

```text
recognition.lang = "en-IN"
```

Show recognized text while the user is speaking.

Example:

```text
🎙 Listening...

আমার টমেটো গাছে...
```

Keep the voice UI simple.

---

# 10. VOICE OUTPUT

Text-to-speech must use the selected language.

Use:

```text
English → en-IN
Hindi → hi-IN
Bengali → bn-IN
```

Find the best available matching browser/device voice.

Do not silently switch to English if Hindi/Bengali voice is unavailable.

Show a localized fallback message if necessary.

---

# 11. COMPLETE VOICE LOOP

The intended flow is:

```text
BENGALI SELECTED
↓
bn-IN SPEECH RECOGNITION
↓
BENGALI TEXT
↓
AI REQUEST language=bn
↓
BENGALI AI RESPONSE
↓
bn-IN TEXT-TO-SPEECH
↓
BENGALI AUDIO
```

Hindi:

```text
hi-IN → hi → hi-IN
```

English:

```text
en-IN → en → en-IN
```

Do not route through English unnecessarily.

---

# 12. SCAN COMPARISON — FIX RESULT NOT APPEARING

Audit:

```text
/analyses/compare
ScanComparisonCard.tsx
```

Trace the complete flow:

```text
Select Scan A
↓
Select Scan B
↓
API Request
↓
Backend
↓
Database
↓
Comparison Engine
↓
Response
↓
Frontend State
↓
Comparison UI
```

Check:

- Scan IDs
- Query parameters
- Request body
- API route
- Authentication
- Ownership validation
- Database query
- Null fields
- Response schema
- Loading state
- Error state
- Frontend parsing

Do not hide errors.

If comparison is impossible, show a clear localized message.

---

# 13. COMPARISON RESULT

Return structured values such as:

```json
{
  "severity_change": "improved",
  "confidence_change": 0.08,
  "trend": "improving"
}
```

Translate presentation only.

Show:

```text
EARLIER SCAN
↓
CURRENT SCAN
↓
WHAT CHANGED?
```

Show available deltas for:

- Severity
- Confidence
- Symptoms
- Disease
- Risk
- Timeline
- Visual difference

Never claim improvement without supporting evidence.

Comparison UI must be fully multilingual.

---

# 14. FIELD CREATION

Fix the field creation flow.

Required relationship:

```text
USER
↓
FIELD
↓
CROP
↓
SCAN
```

Creating a field must:

```text
Submit
↓
Persist to Supabase
↓
Return field ID
↓
Refresh field list
↓
Navigate to field detail
```

Never show success before persistence succeeds.

Field form should support, where available:

- Field name
- Farm name
- Area
- Soil
- Irrigation
- Latitude
- Longitude
- Location/boundary
- Notes

Validation must be multilingual.

---

# 15. CROP ↔ FIELD LINK

When creating/editing a crop, provide a field selector.

Example:

```text
Field
[ North Tomato Field ▼ ]
```

If no field exists:

```text
+ Add Field
```

Ensure the selected field ID is actually persisted.

---

# 16. FIELD IMAGES

Fix field image loading.

Audit:

- Supabase Storage bucket
- File path
- Storage policies
- Signed URLs
- URL generation
- Database image path
- Permissions
- Expiration
- Frontend rendering

Do not expose private storage incorrectly.

If no image exists, show a clean localized placeholder instead of a broken image.

---

# 17. FIELD MAP

The field map is currently not visible.

Audit:

- Map component mounting
- Container height
- CSS
- Coordinates
- Map provider/token
- Client-side rendering
- Dynamic import
- Browser console errors
- Network errors
- Marker rendering
- Mobile rendering

Ensure the map container has a real visible height.

Do not leave a blank map area.

If the current map provider is unavailable or requires unavailable credentials, provide a graceful fallback rather than breaking the field page.

Never fabricate geographic data.

If valid GPS coordinates exist, display them accurately.

---

# 18. FIELD MAP CONTENT

Where actual data exists, show:

- Field location
- Boundary
- Crop location
- Scan locations
- Disease hotspots
- Health status
- Severity

Use:

```text
Green  = Healthy
Yellow = Attention
Red    = High Risk
```

Keep the map simple enough for farmers.

---

# 19. MOBILE FIELD NAVIGATION

The Fields section is missing from the mobile sidebar/navigation.

Audit:

- Sidebar component
- Mobile navigation
- Navigation configuration
- Responsive breakpoints
- Conditional rendering
- Permissions
- Active route logic

Fields must be accessible on mobile.

Required primary navigation should include:

```text
Dashboard
Crops
Fields
Scan
History
Assistant
```

Use the existing navigation architecture instead of creating duplicate navigation systems.

Test:

```text
320px
360px
375px
390px
412px
430px
```

No horizontal scrolling.

---

# 20. MOBILE FIELD FLOW

Verify:

```text
Mobile
↓
Fields
↓
Add Field
↓
Save
↓
Field Detail
↓
Map
↓
Image
↓
Linked Crop
↓
Scan
```

Everything must work.

---

# 21. LANGUAGE PERSISTENCE

Selected language must persist across:

- Navigation
- Refresh
- Login
- Dashboard
- Scan
- Analysis
- Crops
- Fields
- History
- Assistant

If Bengali is selected:

```text
Dashboard → Scan → Analysis → Crop → Field → Assistant
```

must remain Bengali.

Do not reset to English during navigation.

---

# 22. BACKEND LANGUAGE PROPAGATION

Verify:

```text
Frontend selected language
↓
API request
↓
FastAPI
↓
Gemini service
↓
Structured AI response
↓
Frontend
```

Do not rely only on frontend translation for AI-generated content.

---

# 23. TRANSLATION QA

Create a development-only audit if useful to detect English leakage while:

```text
language = hi
```

or:

```text
language = bn
```

Check especially:

- Dashboard summaries
- AI analysis
- Scan preview
- Risk
- Weather
- Assistant
- Comparison
- Fields
- Errors
- Toasts
- Empty states
- Loading states

---

# 24. DO NOT TRANSLATE INTERNAL DATA

Keep stable:

- IDs
- URLs
- API paths
- Database columns
- Enum values
- Internal status values
- Scientific identifiers
- User-entered names

Only translate user-facing presentation.

---

# 25. REQUIRED TEST MATRIX

| Feature | English | Hindi | Bengali |
|---|---|---|---|
| Dashboard | PASS/FAIL | PASS/FAIL | PASS/FAIL |
| Scan UI | PASS/FAIL | PASS/FAIL | PASS/FAIL |
| AI Preview | PASS/FAIL | PASS/FAIL | PASS/FAIL |
| AI Result | PASS/FAIL | PASS/FAIL | PASS/FAIL |
| Risk | PASS/FAIL | PASS/FAIL | PASS/FAIL |
| Weather | PASS/FAIL | PASS/FAIL | PASS/FAIL |
| Crop | PASS/FAIL | PASS/FAIL | PASS/FAIL |
| Field | PASS/FAIL | PASS/FAIL | PASS/FAIL |
| Comparison | PASS/FAIL | PASS/FAIL | PASS/FAIL |
| History | PASS/FAIL | PASS/FAIL | PASS/FAIL |
| Assistant | PASS/FAIL | PASS/FAIL | PASS/FAIL |
| Voice Input | PASS/FAIL | PASS/FAIL | PASS/FAIL |
| Voice Output | PASS/FAIL | PASS/FAIL | PASS/FAIL |
| Errors | PASS/FAIL | PASS/FAIL | PASS/FAIL |
| Mobile Fields | PASS/FAIL | PASS/FAIL | PASS/FAIL |

Do not mark PASS without actually testing.

---

# 26. VOICE TEST MATRIX

### English

```text
UI = English
Recognition = en-IN
AI = English
TTS = en-IN
```

### Hindi

```text
UI = Hindi
Recognition = hi-IN
AI = Hindi
TTS = hi-IN
```

### Bengali

```text
UI = Bengali
Recognition = bn-IN
AI = Bengali
TTS = bn-IN
```

Test:

- Short speech
- Long speech
- Pauses
- Background noise
- Multiple sentences
- Manual stop
- Restart
- Permission denied
- Missing microphone
- Unsupported browser

---

# 27. FIELD TEST

Run:

```text
Create Field
↓
Save
↓
Refresh
↓
Field still exists
↓
Create Crop
↓
Assign Field
↓
Save
↓
Open Field
↓
Crop visible
↓
Scan Crop
↓
Scan linked to Crop
↓
Field sees scan
```

Also test:

```text
Edit Field
↓
Save
↓
Verify
```

and safe deletion.

Do not let deleting a field silently corrupt linked records.

---

# 28. MAP TEST

Test:

1. Valid coordinates
2. Missing coordinates
3. Field image
4. Missing image
5. Mobile
6. Desktop
7. Slow network
8. Map provider unavailable

Expected:

- Valid coordinates → map renders.
- Missing coordinates → clear localized location state.
- Missing image → clean placeholder.
- Provider failure → useful fallback/error.
- No blank broken map area.

---

# 29. COMPARISON TEST

Test:

```text
Scan A + Scan B
```

Expected:

```text
Comparison result
```

Test only one scan:

```text
Select another scan to compare.
```

Test incompatible scans:

```text
These scans cannot be compared reliably.
```

All messages must be localized.

---

# 30. ERROR HANDLING

Every failed request must provide:

```text
Friendly message
+
Retry
+
Development log
```

Do not expose stack traces to users.

---

# 31. PERFORMANCE

Do not introduce:

- AI regeneration on every render
- Duplicate translation calls
- Repeated speech initialization
- Repeated map initialization
- Duplicate field requests
- Duplicate comparison requests

Reuse existing data and cache appropriately.

---

# 32. REGRESSION CHECK

After fixing everything, verify:

- Authentication
- Signup
- Verification
- Password reset
- Crop CRUD
- Scan upload
- Camera
- AI diagnosis
- History
- Risk
- Weather
- Assistant
- Intervention tracking
- Field CRUD
- RLS
- Offline indicator
- Mobile responsiveness

Do not fix one feature by breaking another.

---

# 33. IMPLEMENTATION ORDER

Follow exactly:

1. Audit localization
2. Fix static translations
3. Fix AI language propagation
4. Fix AI scan-result language
5. Fix dashboard dynamic summaries
6. Fix risk/weather/assistant localization
7. Fix voice recognition lifecycle
8. Fix language-aware recognition
9. Fix language-aware TTS
10. Fix scan comparison
11. Fix field creation
12. Fix crop-field linking
13. Fix field images
14. Fix field map
15. Fix mobile Fields navigation
16. Run full regression
17. Run English/Hindi/Bengali matrix
18. Run mobile matrix
19. Remove remaining English leakage

---

# 34. FINAL ACCEPTANCE CRITERIA

## Multilingual

- [ ] English complete
- [ ] Hindi complete
- [ ] Bengali complete
- [ ] Static UI translated
- [ ] Dynamic summaries translated
- [ ] AI preview translated
- [ ] AI result translated
- [ ] Risk translated
- [ ] Weather reasoning translated
- [ ] Assistant translated
- [ ] Comparison translated
- [ ] Field intelligence translated
- [ ] Errors translated
- [ ] Empty states translated
- [ ] Loading states translated
- [ ] Language persists across navigation and refresh

## Voice

- [ ] Voice input no longer stops prematurely
- [ ] en-IN works
- [ ] hi-IN works
- [ ] bn-IN works
- [ ] Interim speech appears
- [ ] Manual stop works
- [ ] Permission errors handled
- [ ] Bengali input → Bengali AI
- [ ] Hindi input → Hindi AI
- [ ] English input → English AI
- [ ] Bengali TTS works where device supports it
- [ ] Hindi TTS works where device supports it
- [ ] English TTS works
- [ ] Correct fallback when a voice is unavailable

## Comparison

- [ ] Two scans can be selected
- [ ] Comparison API works
- [ ] Result renders
- [ ] Deltas render
- [ ] Errors render
- [ ] Empty state works
- [ ] Comparison is multilingual

## Fields

- [ ] Add Field works
- [ ] Edit Field works
- [ ] Delete Field is safe
- [ ] Crop can be assigned to Field
- [ ] Scan connects to Crop/Field
- [ ] Field images render
- [ ] Image fallback works
- [ ] Coordinates persist
- [ ] Map renders
- [ ] Hotspots render when data exists
- [ ] Mobile Fields navigation works
- [ ] Desktop Fields navigation works

## Mobile

- [ ] Fields visible in navigation
- [ ] Scan works
- [ ] Voice works
- [ ] Analysis works
- [ ] Comparison works
- [ ] Field map works
- [ ] No horizontal scrolling
- [ ] Touch targets are usable

---

# 35. FINAL AGENT COMMAND

Do NOT rewrite the application.

First inspect the current codebase and identify:

1. Localization gaps
2. AI language propagation gaps
3. Voice recognition bug
4. TTS language bug
5. Scan comparison failure
6. Field creation/linking failure
7. Field image failure
8. Field map failure
9. Mobile Fields navigation failure

Then implement fixes in the exact order above.

Use the existing architecture wherever possible.

Make the smallest safe changes.

After each major fix:

```text
IMPLEMENT
↓
RUN
↓
TEST
↓
VERIFY
↓
REGRESSION CHECK
```

Do not mark something fixed merely because it compiles.

Actually test it end-to-end.

---

# FINAL USER EXPERIENCE

English:

```text
English UI
→ English voice input
→ English AI
→ English result
→ English voice output
```

Hindi:

```text
Hindi UI
→ Hindi voice input
→ Hindi AI
→ Hindi result
→ Hindi voice output
```

Bengali:

```text
Bengali UI
→ Bengali voice input
→ Bengali AI
→ Bengali result
→ Bengali voice output
```

And:

```text
FIELD
→ CROP
→ SCAN
→ ANALYSIS
→ COMPARISON
→ RISK
→ ACTION
→ FOLLOW-UP
```

must remain connected.

## Most important rule

**Do not make AgriSight more complicated for farmers.**

Fix the technology behind the interface.

Keep the farmer-facing experience simple.

The final goal is:

> A farmer can use AgriSight in their own language, speak naturally in that language, receive the AI answer in the same language, hear it in the same language, connect their crop to the correct field, see their field and map, compare scans, and understand the next action — without needing to understand the technology underneath.

Do not stop until the complete flow works end-to-end.
