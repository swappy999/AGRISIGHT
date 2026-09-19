# AgriSight — Master Feature Development Phase

## Mission

You are entering the feature-development phase of the existing **AgriSight** application.

Previous stabilization covered authentication, email verification, sessions, mobile responsiveness, Scan Leaf UX, Scan → Analysis → Results, API/backend reliability, performance, and usability.

**Do NOT undo or break those improvements.**
**Do NOT rebuild the application from scratch.**
**Do NOT add fake/mock data to make unfinished features appear functional.**

The product-development sequence is:

**PLAN → IMPLEMENT → INTEGRATE → TEST → FIX → POLISH**

---

# Core Product Loop

AgriSight should become one connected ecosystem:

**Farmer → Add/Select Crop → Scan Leaf → AI Analysis → Diagnosis → Severity → Explanation → Treatment → Prevention → Save History → Track Crop Health → Risk/Early Warning → Follow-up Scan**

Every feature should feed useful information into the next part of the system.

---

# Milestone 1 — Advanced Leaf Intelligence

Upgrade the existing Scan Leaf analysis without unnecessarily replacing the current AI integration.

Inspect the existing response structure first.

Where supported, display:

- Crop
- Leaf condition
- Disease/problem
- Healthy/unhealthy status
- Confidence
- Severity
- Symptoms
- Possible causes
- Immediate actions
- Management/treatment
- Prevention
- Follow-up

Never invent symptoms, confidence, disease names, severity, or recommendations. Use actual backend/AI data.

## Severity

Where supported, use:

- Healthy
- Low Risk
- Moderate
- High
- Critical

If severity is derived from existing signals, document the deterministic logic clearly in code.

## Result Presentation

Structure results into:

### What We Found
Short farmer-friendly explanation.

### Why It May Be Happening
Supported possible causes.

### What You Should Do
Immediate action.

### What To Avoid
Relevant cautions.

### Prevention
Longer-term preventive steps.

Do not invent pesticide names, dosages, chemical concentrations, or unsafe agricultural instructions. When crop/location-specific advice is unavailable, recommend an appropriate agricultural expert/local authority.

---

# Milestone 2 — Scan History

Persist successful scans for the authenticated user.

Conceptual relationship:

**User → Crop → Scan → Analysis → Recommendations**

Potential fields:

- User ID
- Crop ID
- Scan ID
- Image reference/path
- Timestamp
- Crop
- Diagnosis
- Health status
- Severity
- Confidence
- Symptoms
- Recommendations

Store only information actually received/generated.

## Scan History UI

Create a polished timeline/card experience showing:

- Date
- Crop
- Result
- Severity
- Thumbnail where appropriate
- Short diagnosis

Allow users to open the complete historical analysis.

Do not expose raw database objects.

---

# Milestone 3 — Crop Management

Allow users to create and manage crop profiles.

Potential fields:

- Crop name
- Variety where supported
- Planting date
- Growth stage
- Field/farm name
- Notes
- Optional location

Do not make every field mandatory.

## Crop Detail Page

Include:

- Overview
- Current health status
- Recent scans
- Problems
- Recommendations
- History
- Notes

The crop becomes the central context for future AgriSight intelligence.

---

# Milestone 4 — Crop Health Trends

When enough scans exist for a crop, show meaningful progression.

Example:

**Scan 1 → Moderate → Scan 2 → Low → Scan 3 → Healthy**

Possible metrics:

- Health trend
- Disease recurrence
- Severity trend
- Number of scans
- Recent problems

Never manufacture historical values.

The user should be able to understand:

**Is my crop getting better or worse?**

---

# Milestone 5 — Farmer Dashboard

Upgrade the dashboard into a decision-oriented command center.

The dashboard should answer:

> **How are my crops doing right now?**

Potential sections:

- Overall Crop Health
- Active Issues
- Recent Scans
- Priority Actions
- Crop Overview
- Recent Activity

Avoid turning the dashboard into a generic analytics dashboard. Prioritize decisions over numbers.

---

# Milestone 6 — Risk Intelligence

Introduce an agricultural risk layer for:

- Disease risk
- Pest risk
- Crop stress
- Weather-related risk
- Recurring disease
- Poor crop condition

Use:

- Low
- Moderate
- High
- Critical

Every risk must explain why it is being shown.

Do not show arbitrary risk percentages. Scores must come from actual model/data or documented deterministic calculations.

---

# Milestone 7 — Weather / Environmental Context

Where appropriate, connect environmental information to agricultural risk.

Potential data:

- Temperature
- Humidity
- Rainfall
- Weather conditions
- Forecast

Use weather only when it has agricultural relevance. Do not clutter the dashboard with generic weather information.

Conceptual relationship:

**Environmental conditions + crop/scan context → relevant agricultural risk**

Do not claim causation unless supported by the underlying logic.

---

# Milestone 8 — Multilingual Experience

Support:

- English
- Bengali
- Hindi

Implement localization with a centralized translation structure.

Major user-facing text should be translatable:

- Navigation
- Buttons
- Scan instructions
- Results
- Recommendations
- Errors
- Dashboard
- Crop information

Persist the selected language.

---

# Milestone 9 — Voice Experience

Add voice only after the text-based system is stable.

Potential capabilities:

### Voice Input
**Speech → Text → AgriSight AI**

### Voice Output
**Text → Speech**

Use clear states:

- Listening
- Processing
- Speaking

Handle microphone permission failures gracefully.

Voice must remain optional.

---

# Milestone 10 — AgriSight AI Assistant

Create a dedicated assistant only after the core data model is stable.

It should use available AgriSight context:

- User's crops
- Recent scans
- Diagnoses
- Health history
- Recommendations
- Environmental information where available

Example questions:

- Why are my leaves turning yellow?
- What should I do about this disease?
- Is my crop improving?
- What did my last scan detect?
- What should I check next?

Clearly distinguish between:

**Known from AgriSight data**

and

**General agricultural guidance**

Never hallucinate user-specific crop information.

---

# Mobile-First Requirement

Every new feature must work well at:

- 320px
- 360px
- 375px
- 390px
- 412px
- 430px
- Tablet
- Desktop

No horizontal scrolling.

Cards must stack intelligently. Charts must remain readable. Buttons must be touch-friendly. Navigation must remain simple.

Do not create desktop-only experiences.

---

# Offline / Poor Network Handling

Prepare the application for agricultural environments.

At minimum:

- Detect offline state
- Clearly communicate connectivity
- Preserve appropriate unsaved local state
- Avoid losing a selected image because of a temporary network problem
- Allow retrying failed analysis
- Cache appropriate non-sensitive information where practical

Do not pretend an analysis completed while offline unless an actual offline model exists.

---

# Follow-Up Architecture

Prepare the architecture for future reminders such as:

- Re-scan crop
- Follow up on disease
- Check crop condition
- Review recommendation

Do not build an unnecessarily complex notification system yet. Design the data model so follow-up actions can be added later without restructuring everything.

---

# Data Architecture

Keep the data model coherent:

**USER → PROFILE → CROPS → SCANS → ANALYSIS → HEALTH HISTORY / RECOMMENDATIONS**

Use stable IDs.

Prevent cross-user data access.

Do not duplicate the same information across unrelated tables.

---

# Security

Every backend operation must verify the authenticated user.

A user must never access another user's:

- Crops
- Scans
- Images
- Analysis
- Recommendations
- Profile information

Do not rely solely on frontend checks. Validate authorization server-side/database-side.

---

# Structured AI Response

If the existing AI output is unstructured, create a structured internal response format where appropriate:

```json
{
  "crop": "",
  "health_status": "",
  "diagnosis": "",
  "confidence": null,
  "severity": "",
  "symptoms": [],
  "possible_causes": [],
  "immediate_actions": [],
  "management": [],
  "prevention": [],
  "follow_up": ""
}
```

Only populate fields supported by the actual AI/backend response.

Keep the frontend independent from raw AI text whenever possible.

---

# Design System

All new screens must use one coherent AgriSight design language:

**Modern · Natural · Intelligent · Trustworthy · Professional · Farmer-friendly**

Use consistent:

- Typography
- Spacing
- Colors
- Cards
- Buttons
- Icons
- Status indicators
- Animations
- Navigation

Avoid generic AI SaaS styling. AgriSight should feel like its own product.

---

# Performance

Prevent the application from becoming slow as features are added.

Use appropriate:

- Lazy loading
- Efficient database queries
- Pagination
- Optimized images
- Caching
- Debounced requests
- Correct React rendering patterns

Do not load every historical scan/image on the dashboard. Do not request data that is not currently needed.

---

# Testing

Every milestone must be tested before moving to the next.

For each feature test:

### Functional
Does it actually work?

### Failure
What happens if the API fails?

### Empty State
What happens for a new user with no data?

### Mobile
Does it work on a phone?

### Authentication
Can one user access another user's data?

### Performance
Does the feature create unnecessary requests?

### Navigation
Can the user naturally enter and leave the feature?

---

# Build Order

Implement in this exact order:

1. Advanced Leaf Intelligence
2. Scan History
3. Crop Management
4. Crop Health Trends
5. Farmer Dashboard
6. Risk Intelligence
7. Environmental / Weather Context
8. Multilingual Support
9. Voice
10. AgriSight AI Assistant

Complete and test each milestone before beginning the next.

---

# Product Principle

Do not create features simply because they sound impressive.

Every feature should answer:

> **Does this help the farmer make a better decision?**

Prioritize:

**Understand → Decide → Act → Monitor**

rather than:

**More screens → More charts → More buttons**

---

# Do Not Break Existing Work

The following must continue working:

- Login
- Signup
- Email verification
- Password reset
- Logout
- Session persistence
- Mobile authentication
- Scan Leaf
- Image upload
- AI analysis
- Existing results
- Existing navigation

Before modifying shared components, understand their dependencies.

---

# Final Product Vision

AgriSight should evolve into a connected agricultural intelligence platform:

**Farmer + Farm/Crops + Scanning + AI Analysis + Weather/Risk Context + Agricultural Intelligence + Recommendations + Monitoring**

The product should feel like a real agricultural intelligence platform, not simply a disease-detection website.

---

# FINAL AGENT COMMAND

Start by inspecting the current AgriSight implementation.

Before adding anything:

1. Understand the existing architecture.
2. Understand the existing database.
3. Understand the current AI analysis response.
4. Understand the Scan Leaf flow.
5. Understand authentication and user ownership.
6. Reuse existing components and integrations where possible.

Then implement the milestones in the specified order.

For every milestone:

**Plan → Implement → Integrate → Test → Fix → Polish**

Do not move to the next milestone if the current one is broken.

Do not use fake data to make the UI appear complete.

Do not add unrelated features.

Do not break authentication or Scan Leaf improvements from the previous phase.

The final result should be a **cohesive, mobile-first, production-quality AgriSight platform where every major feature is connected to the farmer's actual crops, scans, history, and agricultural intelligence.**
