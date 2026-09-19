# AgriSight — Critical Vision Accuracy & Non-Crop Rejection Fix

## Objective

Fix the critical false-positive problem in the AgriSight crop-scanning system.

Current failure example:

- User uploads an image containing people/non-crop content.
- The system displays `HEALTHY → TOMATO → Healthy Plant → 95%`.
- The UI may even acknowledge that the image contains people.

This is unacceptable.

**Never diagnose a crop, disease, plant health, crop name, or confidence score when the image is not a valid agricultural image.**

Do not fix this only by changing UI text. Fix the complete pipeline:

```text
Image
→ Validation
→ Agricultural classification
→ Crop identification
→ Disease analysis
→ Structured result
→ Database
→ UI
```

---

# 1. Core Rule

Implement this hard gate:

```text
NON-CROP IMAGE
    ↓
REJECT
    ↓
NO CROP IDENTIFICATION
NO DISEASE DIAGNOSIS
NO HEALTH SCORE
NO "HEALTHY" RESULT
NO FAKE CONFIDENCE
NO DEFAULT TOMATO
```

Reject images containing or primarily showing:

- People
- Faces/selfies
- Groups of people
- Laptops
- Phones
- Cars
- Buildings
- Rooms
- Food
- Animals
- Random objects
- Documents
- Screenshots
- Roads
- Sky
- Unrelated landscapes
- Any other non-agricultural content

Return a clear result:

```text
⚠️ Invalid Crop Image

This image does not appear to contain a crop
or plant suitable for agricultural analysis.

Please upload a clear photo of a crop, leaf,
stem, fruit, or plant.

[ Retake Photo ]
[ Upload Another Image ]
```

---

# 2. Full Audit Before Changes

Inspect the existing codebase before modifying anything.

Audit:

## Frontend

- Scan page
- Camera capture
- File upload
- Image preview
- Scan state management
- AI result rendering
- Crop result rendering
- Confidence rendering
- Health rendering
- Error states
- React Query/cache/state
- localStorage/sessionStorage
- URL state

## Backend

- Scan endpoint
- Image validation
- Image preprocessing
- Gemini/vision API integration
- AI prompt
- AI response parser
- Structured output
- Database save
- Field association
- Scan history
- Health calculation

## Database/Storage

Inspect:

- scans
- diagnoses
- fields
- crops
- images
- field health
- heatmap data
- RLS
- Storage policies

Also inspect:

- Browser console
- Network requests
- Backend logs
- AI API errors

Find root causes before patching.

---

# 3. Two-Stage Vision Pipeline

Do not directly send every image into disease diagnosis.

Implement:

```text
UPLOADED IMAGE
      ↓
IMAGE QUALITY CHECK
      ↓
AGRICULTURAL IMAGE CLASSIFICATION
      ↓
Is it a valid crop/plant image?
      ↓
   YES              NO
    ↓                ↓
Crop ID           REJECT
    ↓
Crop confidence
    ↓
Disease analysis
    ↓
Result
```

Possible image types:

```text
LEAF
PLANT
STEM
FRUIT
CROP_FIELD
AGRICULTURAL_CONTEXT
HUMAN
ANIMAL
OBJECT
DOCUMENT
SCREENSHOT
UNKNOWN
```

Only valid agricultural types may continue.

---

# 4. Image Quality Gate

Before diagnosis verify:

- File exists
- File is non-empty
- Valid image format
- Image can be decoded
- Resolution is sufficient
- Image is not completely dark
- Image is not unusably blurry
- Image contains meaningful visual content

If invalid:

```text
The image is too unclear to analyze.

Please take a clearer photo of the crop.
```

Do not guess.

---

# 5. Human/Non-Crop Detection

The current failure demonstrates the need for explicit non-crop detection.

If the image primarily contains a person, face, selfie, group, room, laptop, phone, animal, vehicle, etc.:

```text
image_type = NON_CROP
is_agricultural_image = false
crop_detected = false
```

Stop the pipeline.

Do not continue to disease analysis.

---

# 6. Structured Validation Response

Require the vision layer to return structured information.

Example valid agricultural image:

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

Example person image:

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
  "diagnosis": {
    "detected": false,
    "disease": null,
    "confidence": 0,
    "severity": null
  }
}
```

The backend must enforce this result.

---

# 7. Never Default to Tomato

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

Remove any fallback that produces:

```text
Tomato
Healthy Plant
Healthy
95%
```

when AI fails, returns incomplete data, or is uncertain.

Dangerous code such as:

```javascript
const crop = result.crop || "Tomato";
```

must be removed.

Use:

```javascript
const crop = result.crop ?? null;
```

and render an explicit uncertain/unavailable state.

---

# 8. Never Default to Healthy

Never convert:

- AI failure
- missing diagnosis
- low confidence
- non-crop
- uncertain crop

into:

```text
Healthy Plant
```

A healthy result must be supported by actual evidence.

If health cannot be determined:

```text
Unable to determine plant health confidently.
```

---

# 9. Never Fabricate Confidence

Search for hard-coded values such as:

```text
95%
98%
0.95
confidence = 95
```

Confidence must come from a legitimate model result or a documented calculation.

If confidence is unavailable:

```text
Confidence unavailable
```

Do not invent it.

---

# 10. Crop Identification Gate

If the image is agricultural but the crop cannot be identified reliably:

```text
⚠️ Unable to Identify Crop

The image may contain a plant, but there isn't
enough visual information to identify it reliably.

Try:
• Better lighting
• Focus on the leaf
• Move closer
• Avoid blurry images

[ Retake Photo ]
```

Do not guess the crop.

---

# 11. Crop Confidence Threshold

Use a configurable threshold, for example:

```text
crop_confidence_threshold = 0.70
```

If:

```text
crop_confidence < threshold
```

return:

```text
UNCERTAIN_CROP
```

Do not proceed to crop-specific disease diagnosis.

Keep the threshold configurable so it can be tuned during testing.

---

# 12. Disease Detection Gate

Disease analysis may run only when:

```text
is_agricultural_image == true
AND
crop_detected == true
AND
crop_confidence >= threshold
AND
image_quality == acceptable
```

Only then:

```text
run disease analysis
```

---

# 13. Gemini Vision Prompt

Rewrite the vision prompt so rejection and uncertainty are valid outcomes.

Use this conceptual instruction:

```text
You are an agricultural crop-image validation and diagnosis system.

FIRST determine whether the uploaded image actually contains
a plant, crop, leaf, stem, fruit, agricultural field, or another
valid agricultural subject.

Do NOT assume every image contains a crop.

If the image contains a person, face, room, building, vehicle,
phone, laptop, food, animal, document, screenshot, random object,
or another unrelated subject, classify it as NON_CROP.

If the image is ambiguous or insufficient for crop identification,
classify it as UNCERTAIN.

NEVER guess a crop name.

NEVER default to tomato.

NEVER default to healthy.

NEVER generate a disease diagnosis for a non-crop image.

NEVER fabricate confidence.

Only perform crop-specific disease analysis after the image
passes agricultural validation and the crop is identified with
sufficient confidence.

Return structured JSON matching the required schema.
```

Adapt this to the existing Gemini SDK/API rather than replacing working infrastructure blindly.

---

# 14. Backend Enforcement

Do not rely only on the Gemini prompt.

The backend must validate the result.

Logical flow:

```text
if is_agricultural_image == false:
    return NON_CROP_RESULT

if crop_detected == false:
    return UNCERTAIN_CROP

if crop_confidence < threshold:
    return UNCERTAIN_CROP

run disease diagnosis
```

This prevents a bad AI response from reaching the frontend as a diagnosis.

---

# 15. Frontend Must Not Invent Results

Search for patterns such as:

```javascript
result?.crop || "Tomato"
result?.diagnosis || "Healthy Plant"
result?.confidence || 95
```

Remove them.

Frontend should render explicit states:

```text
SUCCESS
NON_CROP
UNCERTAIN_CROP
LOW_IMAGE_QUALITY
AI_ERROR
NETWORK_ERROR
DATABASE_ERROR
```

Never turn an error into a successful crop diagnosis.

---

# 16. Invalid Image UI

Create a dedicated UI:

```text
┌─────────────────────────────────┐
│                                 │
│              ⚠️                 │
│                                 │
│       Invalid Crop Image        │
│                                 │
│ This image doesn't appear to    │
│ contain a crop suitable for     │
│ agricultural analysis.          │
│                                 │
│ Please upload a clear photo of  │
│ a leaf, plant, stem, fruit, or   │
│ crop field.                     │
│                                 │
│     [ Retake Photo ]            │
│     [ Upload Another ]          │
│                                 │
└─────────────────────────────────┘
```

Do not show a crop diagnosis below it.

---

# 17. Valid Crop Result UI

Only after validation succeeds:

```text
🌿 Crop Detected

Crop:
Tomato

Identification Confidence:
91%

Plant Health:
Healthy

Disease Risk:
Low
```

Then show disease/health details.

---

# 18. Prevent Previous Scan Contamination

When a new scan begins, reset all previous result state:

```text
crop
diagnosis
confidence
severity
health
recommendation
```

before processing the new image.

Audit:

- React state
- React Query
- Zustand/Redux/etc.
- localStorage
- sessionStorage
- URL parameters
- cached API responses

A previous tomato result must never survive into a new person/non-crop scan.

Test specifically:

```text
Valid tomato scan
        ↓
New person image
        ↓
Expected: NON_CROP
        ↓
crop = null
        ↓
diagnosis = null
```

---

# 19. Database Protection

Rejected images must NOT create crop diagnoses.

For a rejected scan:

```text
scan_status = rejected
image_type = non_crop
crop = null
diagnosis = null
```

Do not store:

```text
crop = tomato
diagnosis = healthy
confidence = 95
```

for a non-crop image.

---

# 20. Protect Field Health

Invalid scans must NOT:

- update field health
- change crop health
- update disease risk
- create disease events
- create healthy events
- update heatmaps
- alter crop history

Only valid agricultural scans may affect farm intelligence.

---

# 21. Heatmap Protection

Required:

```text
Invalid image
 ↓
Rejected
 ↓
No diagnosis
 ↓
No field-health update
 ↓
No heatmap update
```

---

# 22. Error Categories

Use explicit states:

```text
INVALID_IMAGE
NON_CROP
UNCERTAIN_CROP
LOW_IMAGE_QUALITY
AI_ERROR
NETWORK_ERROR
DATABASE_ERROR
SUCCESS
```

Do not collapse all states into:

```text
Healthy Plant
```

---

# 23. Development Logging

During development, log:

```text
[SCAN VALIDATION]

Image type:
Agricultural:
Crop detected:
Crop confidence:
Image quality:
Validation decision:
Rejection reason:
```

Example:

```text
[SCAN VALIDATION]

Image type: HUMAN
Agricultural: false
Crop detected: false
Crop confidence: 0
Validation decision: REJECT
Rejection reason: HUMAN_DETECTED
```

Never log API keys or private user information.

---

# 24. Test Matrix

You MUST test all of these.

## Test 1 — Person

Upload a selfie/person image.

Expected:

```text
NON_CROP
```

No:

```text
Tomato
Healthy
95%
```

## Test 2 — Laptop

Expected:

```text
NON_CROP
```

## Test 3 — Car

Expected:

```text
NON_CROP
```

## Test 4 — Animal

Expected:

```text
NON_CROP
```

## Test 5 — Room

Expected:

```text
NON_CROP
```

## Test 6 — Real Tomato Leaf

Expected:

```text
CROP
→ TOMATO
→ disease analysis
```

only if confidence is sufficient.

## Test 7 — Real Rice Leaf

Expected:

```text
CROP
→ RICE
→ disease analysis
```

## Test 8 — Blurry Plant

Expected:

```text
UNCERTAIN
```

not a guessed disease.

## Test 9 — Very Dark Plant

Expected:

```text
LOW_IMAGE_QUALITY
```

or:

```text
UNCERTAIN
```

## Test 10 — Previous Tomato Scan + New Person Image

Expected:

```text
NON_CROP
crop = null
diagnosis = null
```

No stale tomato result.

---

# 25. Final Reliability Rules

The frontend must never be trusted to decide whether an image is valid.

The backend must enforce:

```text
VALIDATION
 ↓
CROP IDENTIFICATION
 ↓
DIAGNOSIS
```

The frontend only displays the backend's structured state.

---

# 26. Definition of Done

The fix is complete only when:

- [ ] Person images are rejected
- [ ] Random objects are rejected
- [ ] Animals are rejected
- [ ] Screenshots are handled correctly
- [ ] Blurry images are rejected/uncertain
- [ ] Dark images are rejected/uncertain
- [ ] Real crop images are accepted
- [ ] Crop identification is not guessed
- [ ] Tomato is never a default
- [ ] Healthy is never a default
- [ ] Confidence is never fabricated
- [ ] Previous scan results cannot leak
- [ ] Invalid scans do not update field health
- [ ] Invalid scans do not update heatmaps
- [ ] Invalid scans do not create disease events
- [ ] AI errors are distinguished from non-crop results
- [ ] Backend enforces validation
- [ ] Frontend renders structured states
- [ ] Real crop diagnosis still works

---

# Final Objective

AgriSight must behave like a trustworthy agricultural vision system, not a generic image classifier that guesses.

The fundamental rule is:

```text
IF IT IS NOT A CROP/PLANT IMAGE
        ↓
REJECT IT

IF CROP CANNOT BE IDENTIFIED CONFIDENTLY
        ↓
ASK FOR A BETTER IMAGE

ONLY WHEN THE IMAGE IS VALID
        ↓
IDENTIFY CROP

ONLY WHEN CROP IS VALID
        ↓
RUN DISEASE ANALYSIS

ONLY WHEN THERE IS SUFFICIENT EVIDENCE
        ↓
PROVIDE HEALTH / DISEASE RESULT
```

**Never guess. Never default to tomato. Never default to healthy. Never fabricate confidence.**

Fix the backend, Gemini vision prompt, response schema, state management, database handling, and frontend rendering so this rule is enforced end-to-end.

Do not claim the issue is fixed until this real-world test succeeds:

```text
Upload a photo of a person
→ Backend identifies NON_CROP
→ Frontend displays Invalid Crop Image
→ crop = null
→ diagnosis = null
→ no health score
→ no heatmap update
→ no fake confidence
```

Then verify that a real crop image still completes the normal diagnosis pipeline.
