# AgriSight — Complete Stitch Redesign Implementation
## Website + Android Mobile | Antigravity Master Prompt

### Objective

Redesign the **entire existing AgriSight application** using the UI designs, screenshots, images, and other assets generated in the project's **Stitch folder**.

This is an implementation/refinement task, **not a rebuild**.

Required workflow:

**INSPECT → PLAN → IMPLEMENT → ALIGN → TEST → REPORT → STOP → WAIT FOR APPROVAL**

The final product must be:
- Premium and professional
- Clean and modern
- Properly aligned
- Responsive
- Desktop-ready
- Mobile/Android-ready
- Farmer-friendly
- Presentation-ready
- Fully compatible with existing functionality

---

## 1. Preserve All Existing Functionality

Do not remove, replace, or break working functionality.

Preserve:
- Gemini AI
- Crop image analysis
- Crop/non-crop validation
- Disease analysis
- Pest analysis
- Nutrition analysis
- Water/irrigation analysis
- IPM
- Scan comparison
- AI Assistant
- English/Hindi/Bengali
- Voice input/output
- Camera capture
- Image upload and compression
- Camera switching
- Weather
- Alerts/risk
- Fields and field details
- Analytics
- Scan history
- Profile/settings
- Google authentication
- Supabase
- FastAPI
- Capacitor Android
- Back-button handling
- Existing API integrations

Do not replace real functionality with static mockups.

Do not fabricate AI confidence, diagnoses, crop names, weather, field statistics, or sensor values.

---

## 2. Inspect Before Editing

First inspect the complete existing project:

- `package.json`
- Next.js configuration
- `app/`
- `components/`
- `hooks/`
- `lib/`
- API client
- FastAPI integration
- Supabase integration
- Gemini integration
- Capacitor configuration
- Android project
- global CSS/styles
- existing design tokens
- routes
- layouts
- authentication
- camera implementation
- voice implementation

### Find and inspect the Stitch folder

Locate the actual Stitch-generated folder in the project.

Inspect all useful contents, including:
- screenshots
- exported images
- SVGs
- icons
- design references
- desktop designs
- mobile designs
- generated HTML/CSS if present

Do not assume its path.

---

## 3. Stitch Is the Visual Source of Truth

Use the Stitch designs/assets as the primary visual reference for the redesign.

Reproduce their:
- layout
- spacing
- typography
- colors
- navigation
- cards
- buttons
- forms
- imagery
- section hierarchy
- desktop screens
- mobile screens
- scan workflow
- dashboard
- fields
- assistant
- analytics
- alerts
- settings

However, do **not** blindly copy broken Stitch code.

Implement the design cleanly inside the existing AgriSight architecture.

Where Stitch visually represents existing functionality, connect it to the real implementation.

---

# 4. Redesign the Complete Application

Do not redesign only the dashboard.

Redesign every existing equivalent of:

### Authentication
- Login
- Google authentication
- Callback/loading states

### Main application
- Dashboard/Home
- Fields
- Field detail
- Crop Scan
- Scan result
- Disease
- Pest
- Nutrition
- Water
- IPM
- Compare
- Scan History
- AI Assistant
- Alerts
- Analytics
- Profile
- Settings

Also polish:
- loading states
- empty states
- error states
- dialogs
- drawers
- bottom sheets
- AI processing
- camera states
- permission states
- non-crop state

Use the actual routes in the project rather than assuming route names.

---

# 5. Desktop Website

The desktop version must be intentionally designed for desktop, not merely stretched from mobile.

Test at:
- 1440px
- 1280px
- 1024px

Ensure:
- consistent max content width
- consistent page gutters
- properly aligned columns
- stable sidebar
- predictable hierarchy
- no giant empty areas
- no cramped sections
- no awkward card wrapping

---

# 6. Mobile / Android

Design intentionally for:
- 360px
- 375px
- 390px

Ensure:
- proper bottom navigation
- Android safe areas
- touch-friendly controls
- readable typography
- no horizontal overflow
- no overlapping elements
- no clipped buttons
- no content hidden behind navigation
- keyboard-safe inputs
- correct scrolling
- usable camera interface

Website and Android should feel like the **same AgriSight product**, not two unrelated products.

---

# 7. Alignment Is a Top Priority

Every screen must follow a consistent layout grid.

Check:
- left/right edges
- page gutters
- section headers
- card widths
- button positions
- input widths
- icon alignment
- text baselines
- vertical rhythm
- sidebar spacing
- bottom navigation spacing
- image proportions

Nothing should appear randomly positioned.

Prefer:
- CSS Grid
- Flexbox
- reusable containers
- spacing tokens
- responsive breakpoints

Avoid excessive absolute positioning.

---

# 8. Visual Identity

Follow the approved Stitch direction:

## FIELD INTELLIGENCE

Foundation:
- Deep Charcoal `#101614`
- Warm Ivory `#F5F2EA`

Supporting:
- Deep Botanical `#173B2E`
- Muted Botanical `#5F7D68`
- Sage `#A8B7A7`
- Clay `#A8795D`
- Amber `#C69A45`
- Critical Red `#B94A48`
- restrained muted environmental blue

Green is an accent, **not the entire interface**.

---

# 9. Avoid Generic Farming UI

Avoid:
- excessive green
- leaf icons everywhere
- cartoon farmers
- generic AI illustrations
- huge green gradients
- excessive shadows
- every component being a rounded card
- excessive pills
- giant floating green action buttons
- generic SaaS/farming templates

AgriSight should feel like:

**FIELD INTELLIGENCE + AGRICULTURAL TECHNOLOGY + PREMIUM SOFTWARE**

---

# 10. Stitch Images and Assets

All useful images/assets currently stored in the Stitch folder must be reviewed.

For each useful asset:
1. Identify its intended screen.
2. Identify desktop/mobile usage.
3. Determine whether it is a background, hero, crop image, icon, illustration, or decoration.
4. Reuse it intentionally.
5. Preserve aspect ratio.
6. Do not stretch or distort it.
7. Use appropriate `object-fit` / `object-position`.
8. Optimize very large assets where appropriate.
9. Avoid unnecessary duplicates.

Do not dump every Stitch image into the application.

Use imagery intentionally and prioritize usability.

---

# 11. Responsive Images

For every image verify:

Desktop:
- correct dimensions
- correct crop
- correct alignment

Mobile:
- responsive width
- correct aspect ratio
- no clipping
- no stretching

Pay particular attention to:
- dashboard imagery
- crop scan images
- scan-result images
- field images
- profile imagery
- weather imagery
- decorative graphics

---

# 12. Navigation

### Desktop
Use the approved Stitch sidebar:

- Overview
- Fields
- Crop Scan
- Assistant
- Alerts
- Analytics
- Profile
- Settings

### Mobile
Bottom navigation:

- Home
- Fields
- Scan
- Assistant
- Profile

Scan may be emphasized, but **do not use a huge generic green floating button**.

Clearly indicate the active page.

---

# 13. Dashboard

Use the Stitch dashboard hierarchy:

1. Greeting/context
2. Field intelligence
3. Weather
4. Crop Scan
5. Important alert
6. Field status
7. Recent activity
8. Compact AI assistant presence

Keep the dashboard compact.

Do not put every feature on the home screen.

---

# 14. Crop Scan

Preserve the real:
- Capacitor camera
- browser camera fallback
- image upload
- compression
- camera switching
- Gemini analysis

Flow:

**Scan → Camera/Upload → Preview → Retake/Analyze → AI Processing → Result**

Do not replace the actual camera implementation with a visual mockup.

---

# 15. Non-Crop Validation — Critical

A non-crop image must never receive a fabricated crop diagnosis.

Never use defaults such as:
- `result?.crop || "Tomato"`
- `result?.diagnosis || "Healthy Plant"`

Never fabricate confidence.

If the image is not a crop, show:

## NON-CROP IMAGE

“This image does not appear to contain a crop.”

Actions:
- Retake Photo
- Choose Another Image

Test with:
- person
- room
- vehicle
- building
- animal
- random object
- landscape

A non-crop must never silently become a crop diagnosis.

---

# 16. Scan Result

Do not show a giant wall of AI text.

Show:
- Crop
- Condition
- Severity/status
- Short summary

Then separate actions:

- Disease
- Pest
- Nutrition
- Water
- IPM
- Compare

Use progressive disclosure:

**SUMMARY → WHY → ACTION**

---

# 17. AI Assistant

Use the Stitch assistant design while preserving:
- Gemini
- text input
- voice input
- English
- Hindi
- Bengali
- speech output

Response hierarchy:

**ANSWER → REASON → ACTION**

Keep responses concise and readable.

Do not turn it into a generic chatbot clone.

---

# 18. Fields

Use the Stitch field intelligence style.

Where actual data exists, show:
- field
- crop
- condition
- risk
- last scan
- weather
- recent activity

Future sensor UI may be visually prepared:

Soil Moisture —  
Temperature —  
Humidity —  
Soil pH —

Never fake readings.

---

# 19. Alerts

Use:
- CRITICAL
- ATTENTION
- MONITOR
- INFO

Every alert should communicate:
- WHAT
- WHY
- ACTION

Avoid making the whole interface red.

---

# 20. Analytics

Use the Stitch visual language.

Keep analytics readable and purposeful.

Possible existing data:
- crop health trends
- disease trends
- water trends
- risk trends
- scan activity

Do not add charts simply to fill space.

Only show real available data.

---

# 21. Profile / Settings

Keep these clean.

Preserve existing functionality for:
- account
- Google authentication/session
- language
- voice preferences
- notifications
- application settings

Do not break authentication.

---

# 22. Reusable Component System

Reuse and standardize:
- App shell
- Sidebar
- Bottom navigation
- Header
- Page header
- Buttons
- Inputs
- Selects
- Tabs
- Cards
- Metric blocks
- Status badges
- Alerts
- Weather blocks
- Field blocks
- Scan blocks
- AI messages
- Tables
- Lists
- Modals
- Drawers
- Bottom sheets
- Loading
- Empty
- Error states

Do not create multiple inconsistent versions of the same component.

---

# 23. Typography

Follow the Stitch typography.

Prioritize:
- readable body text
- strong page titles
- meaningful large numbers
- restrained uppercase labels
- consistent line height
- clear hierarchy

Do not use tiny text just to fit more information.

---

# 24. Responsive System

Support:
- mobile
- tablet
- desktop
- large desktop

Test components at multiple widths, not just one viewport.

---

# 25. Mobile Keyboard

For assistant and other inputs verify:
- input stays visible
- send button remains accessible
- messages scroll correctly
- keyboard does not cover controls
- bottom navigation behaves correctly

---

# 26. Capacitor / Android

Preserve:
- `appId: com.agrisight.app`
- `appName: AgriSight`
- `webDir: out`

Verify:
- camera permissions
- status bar
- safe areas
- back button
- keyboard
- navigation
- splash screen
- network behavior

Do not make unnecessary Android configuration changes.

---

# 27. Performance

Inspect:
- oversized images
- unnecessary renders
- duplicate API calls
- unnecessary client-side work
- unnecessary dependencies

Optimize only when useful.

Do not rewrite stable architecture unnecessarily.

---

# 28. Accessibility

Check:
- contrast
- focus states
- keyboard navigation
- semantic buttons
- labels
- alt text
- touch targets
- form errors

---

# 29. Loading / Empty / Error States

Every major workflow must have polished states.

Examples:

Loading:
“Analyzing your crop…”

Error:
“Crop analysis couldn’t be completed.”
[Try Again]

Empty:
“No scans yet.”
[Start a Crop Scan]

Non-crop:
“This image does not appear to contain a crop.”
[Retake Photo]

Do not rely on meaningless generic error messages.

---

# 30. Testing

Run all existing frontend tests.

Run all existing backend tests.

Run:

```bash
npm run build
```

Confirm the static export produces:

```text
out/
```

Verify dynamic routes remain compatible with the existing
`generateStaticParams()` architecture.

---

# 31. Complete Visual QA

Manually inspect every major screen:

- Login
- Dashboard
- Fields
- Field detail
- Crop Scan
- Camera
- Upload
- Analysis loading
- Analysis result
- Non-crop result
- Disease
- Pest
- Nutrition
- Water
- IPM
- Compare
- Scan History
- AI Assistant
- Voice
- Alerts
- Analytics
- Profile
- Settings

For every screen check:

- Desktop alignment
- Tablet behavior
- Mobile alignment
- No horizontal overflow
- No clipping
- No broken images
- No console errors
- No functionality regression

---

# 32. Do Not Stop After the Dashboard

The task is NOT complete if only Login, Dashboard, and Scan are redesigned.

The **complete application** must receive the Stitch visual treatment.

---

# 33. Do Not Create a Second Application

Do not:
- create a new Next.js project
- create a new frontend
- replace the backend
- replace Supabase
- replace Gemini
- replace Capacitor
- create duplicate routes
- create an unrelated parallel UI

Implement directly into the existing AgriSight project.

---

# 34. Code Cleanup

After implementation:
- remove unused imports
- remove dead styling
- remove duplicate components
- reuse existing utilities
- keep components maintainable
- avoid unnecessary dependencies
- do not delete files unless verified unused

---

# 35. Complete Demo Journey

Test:

**LOGIN  
↓  
DASHBOARD  
↓  
FIELD  
↓  
CROP SCAN  
↓  
CAMERA  
↓  
CAPTURE  
↓  
ANALYZE  
↓  
GEMINI  
↓  
SCAN RESULT  
↓  
DISEASE / PEST / NUTRITION / WATER / IPM  
↓  
COMPARE  
↓  
AI ASSISTANT  
↓  
VOICE  
↓  
WEATHER  
↓  
ALERTS  
↓  
ANALYTICS  
↓  
PROFILE / SETTINGS**

Then test a clearly non-crop image.

---

# 36. Final Report

Report:

## STITCH ASSETS
- Stitch folder location
- Assets reused
- Assets intentionally not used

## UI IMPLEMENTATION
- Screens redesigned
- Components created
- Components reused
- Responsive layouts completed

## FUNCTIONALITY
- Gemini
- Camera
- Voice
- Authentication
- Weather
- Fields
- Alerts
- Analytics
- Capacitor

## TESTING
- Frontend tests
- Backend tests
- Build
- Desktop QA
- Mobile QA
- Android QA

## ISSUES
List only real remaining issues.

## NOT CHANGED
List backend/core functionality intentionally preserved.

Then:

**STOP.**

**WAIT FOR APPROVAL.**

Do not begin another phase automatically.
