# AgriSight — Safe Project Cleanup & Consolidation

## Objective

Clean the existing AgriSight project so it is:

- concise
- compact
- organized
- maintainable
- production-ready
- free of unnecessary files
- free of duplicate code
- free of dead code

**Do not rebuild the application. Do not remove working functionality. Do not blindly delete files.**

> **Clean the project, not the functionality.**

---

## 1. Audit Before Deleting

First inspect the complete project:

- frontend
- backend
- components
- pages/routes
- hooks
- services
- utilities
- APIs
- database
- migrations
- configuration
- public assets
- images
- fonts
- scripts
- tests
- mocks
- documentation
- environment files

Classify every candidate as:

```text
USED
UNUSED
DUPLICATE
EMPTY
DEPRECATED
TEMPORARY
REQUIRED CONFIG
UNKNOWN
```

Do not automatically delete `UNKNOWN`.

---

## 2. Empty Files

Find:

- completely empty files
- whitespace-only files
- placeholder files
- comment-only files
- empty folders

Before deleting, check whether each is required by:

- framework
- routing
- build system
- deployment
- configuration
- tooling
- future Capacitor setup

Delete only genuinely unnecessary files.

---

## 3. Unused Files

Before deleting a file, search for:

- direct imports
- dynamic imports
- route references
- build/config references
- scripts
- asset references
- CSS references
- backend registration
- API registration

Do not assume a file is unused just because there is no obvious direct import.

---

## 4. Duplicate Components

Look for duplicate versions of:

- AI Assistant
- scanner
- camera
- field components
- field pages
- heatmaps
- sidebar/navbar
- weather cards
- alert cards
- buttons/modals
- image components

If two implementations do the same job:

```text
KEEP CANONICAL VERSION
→ UPDATE REFERENCES
→ DELETE CONFIRMED UNUSED DUPLICATE
```

Never delete the active implementation.

---

## 5. Dead Code

Find:

- unused components
- unused hooks
- unused functions
- unused variables
- unused API services
- unreachable branches
- old experiments
- commented-out implementations
- abandoned scanners
- abandoned AI systems
- abandoned voice systems

Delete only code confirmed to be unused.

---

## 6. Old / Abandoned Folders

Inspect folders/files such as:

```text
old/
backup/
temp/
tmp/
test/
new/
new2/
final/
final2/
legacy/
prototype/
draft/
copy/
```

Do not delete based on names alone.

Check references and runtime usage first.

---

## 7. Mock / Demo Data

Find:

- fake fields
- fake weather
- fake scan results
- fake disease results
- fake health scores
- fake heatmap data
- placeholder alerts
- temporary JSON/CSV
- test images

Do not remove intentional demo infrastructure if it is still useful.

Production must never accidentally depend on abandoned mock data.

If demo data is required, isolate it with:

```text
DEMO_MODE=true
```

---

## 8. Asset Cleanup

Audit:

- images
- logos
- icons
- screenshots
- backgrounds
- illustrations
- SVGs
- fonts

Delete only assets with no remaining references.

Keep:

- current logo
- favicon
- app icons
- current splash assets
- required build assets
- assets needed for future mobile packaging

---

## 9. Public Directory

Clean the public/static directory.

Remove confirmed-unused:

- screenshots
- temporary images
- duplicate icons
- old branding
- abandoned assets

Do not remove framework-required files.

---

## 10. Configuration

Audit, but do not blindly delete:

```text
package.json
lockfile
tsconfig
vite/next config
eslint
prettier
tailwind
postcss
environment templates
Docker/deployment config
test config
Capacitor config if present
```

Remove only confirmed-unused configuration.

---

## 11. Dependency Cleanup

Inspect `package.json`.

Find dependencies that are genuinely unused.

Before uninstalling, search the whole project for usage in:

- source files
- scripts
- config
- build plugins
- tests
- dynamic imports

Then update the lockfile.

Do not remove packages solely because they are not directly imported.

---

## 12. Backend Cleanup

Audit:

- routes
- services
- schemas
- models
- utilities
- AI services
- weather services
- storage services
- auth

Find:

- unused endpoints
- duplicate services
- old scan endpoints
- old AI endpoints
- unused models
- unused schemas
- dead utilities

Keep all active API contracts intact.

---

## 13. Database / Migration Safety

**Do not delete database migrations blindly.**

Determine whether each migration is part of the actual migration history.

Keep migrations unless their role and status are fully understood.

Do not damage the current database.

---

## 14. Environment Files

Be careful with:

```text
.env
.env.local
.env.example
.env.production
```

Do not delete environment templates just because they are not imported directly.

Never print secrets.

Do not remove variables still required by the application.

---

## 15. Debug / Temporary Files

Search for:

```text
debug
temp
tmp
dump
backup
draft
prototype
screenshot
test-output
copy
old
unused
```

Remove only genuinely abandoned developer files.

Keep legitimate tests and test configuration.

---

## 16. Styling Cleanup

Find:

- duplicate CSS
- unused CSS modules
- unused design tokens
- duplicate theme files
- unnecessary styles

Consolidate only when safe.

Do not perform a complete redesign during cleanup.

---

## 17. Route Cleanup

Audit routes as:

```text
ACTIVE
DEPRECATED
DUPLICATE
DEAD
```

If duplicate:

```text
KEEP CANONICAL ROUTE
→ UPDATE NAVIGATION
→ REMOVE DEAD ROUTE
```

Test direct navigation and refresh afterward.

---

## 18. API Layer Cleanup

Look for duplicate API clients such as:

```text
api.ts
client.ts
apiClient.ts
backend.ts
services/api.ts
```

Identify the canonical request layer.

Where safe, consolidate to one clean API architecture.

Do not break authentication or request contracts.

---

## 19. AI Cleanup

Find duplicate/abandoned:

- Gemini clients
- vision services
- assistant services
- prompt files
- AI utilities
- old scan logic

Keep one canonical AI architecture:

```text
Frontend
↓
AgriSight API
↓
AI Service
↓
AI Provider
```

Preserve existing intelligence:

- disease
- pest
- IPM
- nutrition
- water
- crop health
- recommendations
- multilingual assistant

---

## 20. Scan / Camera Cleanup

Because Scan is a core feature, be especially careful.

Find duplicate:

- scanner components
- camera components
- image processors
- upload handlers
- scan APIs

Keep one canonical scan flow:

```text
Camera / Upload
↓
Image Validation
↓
Crop Validation
↓
Crop Identification
↓
Disease / Pest Analysis
↓
Result
```

Do not delete code connected to active scan functionality.

---

## 21. AI Assistant Cleanup

Keep the active assistant.

Remove only confirmed-unused:

- old chatbot
- old assistant modal
- duplicate floating assistant
- old voice assistant
- obsolete language selector
- old TTS implementation

---

## 22. Field / Heatmap Cleanup

Find duplicate:

- field cards
- field pages
- map components
- heatmaps
- field API services

Keep the active implementation.

Do not delete detailed field intelligence merely because it is hidden from Home.

---

## 23. Test Cleanup

Keep legitimate:

- unit tests
- integration tests
- end-to-end tests
- fixtures
- test configuration

Remove obsolete tests only when clearly safe.

Never delete tests simply to reduce file count.

---

## 24. Safe Delete Protocol

Before deleting ANY file:

```text
FILE
↓
Search references
↓
Check dynamic usage
↓
Check route usage
↓
Check build/config usage
↓
Check scripts
↓
Check asset references
↓
Classify
↓
DELETE ONLY IF SAFE
```

If uncertain:

```text
DO NOT DELETE
```

---

## 25. Do Not Mass Delete

Do not use destructive wildcard deletion based only on names.

Do not mass-delete directories.

Do not delete a file merely because it:

- looks old
- is tiny
- is empty
- sounds unnecessary

Frameworks and build tools may use files indirectly.

---

## 26. Preserve Future Capacitor Compatibility

Do not add Capacitor during this cleanup unless explicitly instructed.

Do not delete files/configuration that may be required for later:

```text
Web
↓
Capacitor
↓
Android / iOS
```

migration.

---

## 27. Required Functionality That Must Remain

After cleanup, verify all of these still work:

```text
Authentication
Home / Dashboard
Weather
Scan
Camera
Image Upload
Crop Validation
Non-Crop Rejection
Disease Detection
Pest Detection
IPM Guidance
Nutrition Guidance
Water / Irrigation Guidance
Crop Management
Risk Assessment
Scan Comparison
AI Assistant
Bengali
Hindi
English
Voice Input
Voice Output
Fields
Field Images
Field Health
Heatmap / Spatial Health
Alerts
Analysis / History
Backend APIs
Database
```

Do not remove these because they are hidden from Home.

---

## 28. Post-Cleanup Validation

Run where available:

```bash
npm run lint
npm run typecheck
npm run build
```

Then start the application.

Fix:

- broken imports
- missing assets
- route failures
- TypeScript errors
- build errors
- runtime errors

---

## 29. Functional Regression Test

### Authentication
- Login
- Logout
- Session persistence

### Home
- Weather
- Scan button
- Alerts
- AI Assistant

### Scan
- Camera
- Upload
- Capture
- Crop validation
- Non-crop rejection
- Disease analysis
- Results
- Save

### AI
- Text
- Voice
- English
- Bengali
- Hindi

### Fields
- Add
- View
- Images
- Health
- Heatmap

### Navigation
- Sidebar
- Mobile navigation
- Direct routes
- Browser refresh

---

## 30. Performance Check

After cleanup verify:

- bundle size
- initial requests
- duplicate requests
- asset size
- console
- network

The cleanup must not make the application slower.

Keep heavy features lazy-loaded where appropriate.

---

## 31. Final Project Structure

Aim for one canonical location per responsibility.

A reasonable structure is:

```text
AgriSight/
├── src/
│   ├── components/
│   ├── features/
│   │   ├── scan/
│   │   ├── assistant/
│   │   ├── fields/
│   │   ├── alerts/
│   │   ├── crops/
│   │   └── analysis/
│   ├── pages/
│   ├── services/
│   ├── hooks/
│   ├── utils/
│   ├── types/
│   └── styles/
├── public/
├── backend/
├── package.json
├── lockfile
└── config files
```

Do not force this exact structure if the existing framework uses another valid architecture.

Principle:

> **One responsibility → one canonical implementation.**

---

## 32. Final Cleanup Goal

The final codebase should contain:

```text
NO
❌ dead files
❌ unnecessary empty files
❌ abandoned components
❌ duplicate implementations
❌ unused dependencies
❌ temporary assets
❌ fake production data
❌ broken imports
❌ unnecessary debug files
```

while preserving:

```text
✅ Scan
✅ Camera
✅ AI
✅ Voice
✅ Bengali/Hindi/English
✅ Fields
✅ Images
✅ Heatmap
✅ Weather
✅ Alerts
✅ IPM
✅ Nutrition
✅ Water guidance
✅ Crop management
✅ Analysis
✅ Authentication
✅ Database
✅ Backend APIs
```

---

## 33. Cleanup Manifest

Before deletion, maintain an internal list:

```text
TO DELETE
TO KEEP
TO REVIEW
```

For each deletion know why it is safe.

Example:

```text
Deleted:
src/components/OldScanner.tsx

Reason:
No references; replaced by the active scanner implementation.
```

Do not create a permanent manifest file unless useful.

---

## 34. Final Report

After cleanup provide:

### Files Deleted
List files actually deleted.

### Dependencies Removed
List packages actually removed.

### Duplicates Consolidated
List duplicate implementations consolidated.

### Dead Code Removed
List major dead-code cleanup.

### Build/Test Results

```text
Lint:
Typecheck:
Build:
Runtime:
```

### Functional Tests
List the major flows tested.

### Required Files Kept
Mention apparently-unused files retained because they are required by framework/configuration/migrations/deployment/future mobile packaging.

### Remaining Review Items
Only genuinely uncertain items.

---

# FINAL RULE

> **CLEAN THE PROJECT, NOT THE FUNCTIONALITY.**

Use:

```text
INSPECT
→ CLASSIFY
→ SAFELY DELETE
→ REPAIR REFERENCES
→ LINT
→ TYPECHECK
→ BUILD
→ TEST
→ REPORT
→ STOP
```

Do not:
- blindly delete empty files
- blindly delete old-looking files
- delete database migrations
- delete required configuration
- delete active camera/scan/AI/IPM/field code
- remove features just because they are hidden from Home

After cleanup is complete, **STOP** and wait for approval before making additional architectural changes.
