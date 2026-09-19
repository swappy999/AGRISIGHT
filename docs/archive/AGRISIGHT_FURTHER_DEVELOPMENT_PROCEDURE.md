# AgriSight — Further Development Procedure

## Purpose

The current AgriSight platform already contains a strong foundation: crop management, Scan Leaf, Gemini diagnosis, health trends, dashboard, weather context, Risk Radar, alerts, multilingual support, voice, AI Assistant, history, authentication, RLS, Next.js, FastAPI, Supabase, and Gemini integration.

**Do not rebuild these systems. Do not break existing functionality.**

This phase moves AgriSight from:

> **AI Leaf Diagnosis**

to:

> **AI-Powered Agricultural Decision Intelligence**

---

# Core Product Evolution

Move from:

`SCAN → DIAGNOSE → RECOMMEND`

to:

`OBSERVE → UNDERSTAND → COMPARE → PREDICT → ASSESS RISK → RECOMMEND → ACT → MONITOR → LEARN`

AgriSight should increasingly answer:

1. What is happening?
2. Why might it be happening?
3. Is it getting better or worse?
4. What is likely to happen next?
5. How serious is it?
6. What should the farmer do now?
7. When should the farmer check again?
8. Did the recommended action help?

---

# Development Rules

Implement one milestone at a time:

**INSPECT → DESIGN → IMPLEMENT → INTEGRATE → TEST → FIX → POLISH → VERIFY**

Do not implement everything simultaneously.

Do not use fake data, arbitrary scores, fabricated predictions, or fake AI results.

Use real data, documented deterministic calculations, or clearly labeled model-derived predictions.

---

# Milestone 1 — Predictive Crop Intelligence

Transform AgriSight from a diagnostic system into a predictive system.

Current:
> Disease detected.

Target:
> Disease detected → severity → trend → risk → likely progression → recommended action → follow-up.

## Disease Progression

Use historical scans belonging to the same crop.

Compare:
- Previous diagnosis
- Current diagnosis
- Previous severity
- Current severity
- Confidence
- Time between scans
- Recurrence
- Available weather/environment context

Determine only when enough data exists:
- Improving
- Stable
- Worsening
- New issue
- Recurring issue

## Predictive Status

Where enough evidence exists, provide:
- Current condition
- Trend
- Risk of progression
- Expected direction

Prefer qualitative predictions unless a scientifically defensible probability exists.

## Follow-Up Recommendation

Recommend a follow-up scan when justified by severity, trend, or risk.

Never imply medical/agricultural certainty that the data does not support.

## What Changed?

Create a comparison component showing previous state, current state, and supported change.

---

# Milestone 2 — Scan Comparison Engine

Allow farmers to compare two scans of the same crop.

Compare where supported:
- Severity
- Diagnosis
- Confidence
- Health status
- Recurrence
- Time between scans

Show:

**Previous → Current → Change**

Possible outcomes:
- Improved
- Worsened
- Stable
- Inconclusive

Do not compare unrelated crops.

Do not show numerical change unless the underlying calculation is valid.

---

# Milestone 3 — Advanced Risk Engine

Upgrade the existing Risk Radar into a genuine agricultural decision engine.

Use, where available:

`LEAF DATA + CROP DATA + HISTORY + WEATHER + RECURRENCE + GROWTH STAGE → RISK ENGINE`

Support:
- Disease Risk
- Pest Risk where supported
- Weather Risk
- Recurrence Risk
- Crop Stress
- Overall Crop Risk

Risk levels:
- Low
- Moderate
- High
- Critical

Every important risk must explain **why** it is being shown and what action is recommended.

If no trained model exists, use documented deterministic scoring rather than arbitrary numbers.

---

# Milestone 4 — Weather-Agriculture Intelligence

Turn the existing Open-Meteo integration into agricultural context rather than generic weather display.

Where justified, connect:
- Temperature
- Humidity
- Rainfall
- Forecast
- Crop
- Growth stage
- Recent disease
- Recurrence

Example reasoning:

`High humidity + recent fungal symptoms + recurrence → elevated fungal disease risk`

Do not claim causation without supporting evidence.

---

# Milestone 5 — Farmer Daily Action System

Make the dashboard answer:

> **What should I do today?**

Create a prioritized action list from actual AgriSight data.

Priority levels:
- Critical
- High
- Medium
- Low
- Monitor

Avoid overwhelming the farmer. Show only relevant actions.

---

# Milestone 6 — Crop Intelligence Center

Upgrade `/crops/[id]` into the farmer's complete crop intelligence page.

Include:
- Crop overview
- Current health
- Current risk + explanation
- Recent scan
- Trend
- History
- Current/recurring problems
- Recommended actions
- Forecast where real predictive data exists

The page should answer:

> **How is this crop doing?**

---

# Milestone 7 — Field Intelligence

This is a major differentiator beyond leaf-level diagnosis.

Evolve the intelligence hierarchy toward:

`LEAF → PLANT → CROP → FIELD`

Potential inputs:
- Field imagery
- GeoTIFF
- Satellite imagery
- Drone imagery
- Plant survival information
- Spatial crop data
- Leaf scan information

Reuse existing spatial/PitTrace concepts where technically appropriate.

Do not force the feature into production if the data pipeline is not ready. Build incrementally.

---

# Milestone 8 — Field Health Map

When actual spatial data is available, create field visualizations for:
- Field health score
- Plant survival
- Disease hotspots
- High-risk zones
- Healthy zones
- Problem clusters

Only render spatial information from actual geospatial data.

Never fabricate field maps or hotspots.

---

# Milestone 9 — Field / Leaf Data Connection

Connect leaf-level evidence to field-level intelligence.

Conceptually:

`FIELD → CROP → LEAF SCANS + FIELD IMAGERY → HEALTH/RISK INTELLIGENCE`

Allow field-level evidence and leaf-level evidence to reinforce one another when technically justified.

---

# Milestone 10 — Smart Follow-Up

Generate follow-up recommendations from:
- Current severity
- Trend
- Risk
- Crop stage
- Previous scan
- Environmental context

Examples:
- Re-scan recommended in 3 days.
- Monitor this crop closely.
- Condition appears stable.
- Follow-up scan recommended after treatment.

Only generate a follow-up when there is a meaningful reason.

---

# Milestone 11 — AI Assistant Upgrade

The existing `/assistant` already uses crop, diagnosis, and weather context.

Expand context to include:
- Crop health trends
- Scan history
- Risk scores
- Active actions
- Recent changes
- Field intelligence where available

Support questions such as:
- What changed in my crop?
- Is my crop getting better?
- Which crop needs attention today?
- What did my last scan detect?
- Why is this crop high risk?
- When should I scan again?

Never hallucinate user-specific information.

---

# Milestone 12 — Explainable AI

Every important AI conclusion should have an understandable reason.

Instead of:

> High Risk

show:

> **Why?** Recent disease detection, worsening trend, and favorable environmental conditions.

This is important for farmer trust and SIH evaluation.

---

# Milestone 13 — Data Quality & Confidence

Clearly distinguish:

### High Confidence
Strong evidence.

### Moderate Confidence
Useful result but should be monitored.

### Low Confidence
Retake the image or gather more information.

Never present low-confidence results as definitive.

---

# Milestone 14 — Offline / Low-Connectivity Readiness

Prepare for agricultural environments with unreliable connectivity.

Improve:
- Offline state detection
- Image preservation before upload
- Retry queue
- Failed-request retry
- Local draft preservation
- Cached crop information
- Cached recent history where appropriate

Do not claim AI analysis completed offline unless an actual offline model exists.

---

# Milestone 15 — SIH Differentiation

Make these four capabilities central to the product story:

## 1. Multi-Level Intelligence
**Leaf → Crop → Field**

## 2. Predictive Intelligence
**Detect → Predict → Act**

## 3. Spatial Intelligence
**Field Health + Risk Hotspots**

## 4. Bharat-First Accessibility
**English + Hindi + Bengali + Voice**

---

# Product Experience Principle

Every feature should help answer:

### Understand
What is happening?

### Decide
What does it mean?

### Act
What should I do?

### Monitor
Did it improve?

Avoid adding features simply because they look impressive.

Avoid:
- Excessive dashboards
- Decorative charts
- Arbitrary AI scores
- Generic chatbot features
- Unconnected modules

---

# Mobile-First Requirement

Every new feature must work at:
- 320px
- 360px
- 375px
- 390px
- 412px
- 430px
- Tablet
- Desktop

No horizontal scrolling.

Use responsive layouts and comfortable touch targets.

Do not turn desktop dashboards into tiny mobile dashboards.

---

# Performance Requirement

As the platform grows:
- Use efficient database queries
- Paginate large history sets
- Optimize images
- Lazy-load heavy visualizations
- Avoid duplicate API requests
- Cache appropriate data
- Avoid unnecessary React re-renders
- Do not load all historical scans/images on the dashboard
- Do not load all field imagery at once

---

# Security Requirement

Every new feature must preserve user ownership.

A user must never access another user's:
- Crops
- Scans
- Images
- Analysis
- Risk data
- Field data
- Recommendations
- Assistant context

Use backend/database authorization. Never rely only on frontend checks.

---

# Data Model Direction

Long-term conceptual model:

```text
USER
│
├── PROFILE
│
├── FARM / FIELD
│   │
│   └── CROPS
│       │
│       ├── SCANS
│       │   └── ANALYSIS
│       │
│       ├── HEALTH HISTORY
│       ├── RISK
│       └── ACTIONS
│
├── WEATHER CONTEXT
│
└── AI INSIGHTS
```

Do not restructure the database blindly. Inspect the existing schema first and extend only where necessary.

---

# Implementation Order

## Phase A — Predictive Intelligence
1. Disease progression
2. Scan comparison
3. What changed?
4. Follow-up recommendations

## Phase B — Risk Intelligence
5. Advanced risk engine
6. Explainable risk
7. Weather-agriculture reasoning
8. Daily priority actions

## Phase C — Crop Intelligence
9. Crop Intelligence Center
10. Historical health trends
11. Smarter crop recommendations

## Phase D — Field Intelligence
12. Field data architecture
13. GeoTIFF / spatial pipeline
14. Field health map
15. Disease hotspot detection
16. Plant survival / field health where data exists

## Phase E — AI Intelligence
17. AI Assistant context upgrade
18. Explainable AI
19. Data-aware recommendations
20. Predictive conversational answers

## Phase F — Production Readiness
21. Offline/poor-network improvements
22. Performance optimization
23. Security audit
24. Data-quality audit
25. Full mobile QA

---

# Testing Requirement

Every phase must be tested before moving forward.

For each feature test:

### Functional
Does the actual feature work?

### Data
Does it use real data?

### Empty State
Does it work for a new user?

### Failure
Does it fail gracefully?

### Authentication
Is user ownership enforced?

### Mobile
Does it work on phones?

### Performance
Are requests and rendering efficient?

### Explainability
Can the user understand why the result was generated?

---

# SIH Demo Quality Bar

The eventual demonstration should tell this story:

`FARMER → SELECT CROP → SCAN LEAF → AI IDENTIFIES ISSUE → SEVERITY → HISTORICAL COMPARISON → TREND → WEATHER + HISTORY + CROP DATA → RISK → EXPLANATION → ACTION → FOLLOW-UP → NEXT SCAN → IMPROVEMENT TRACKING`

At field level:

`FIELD → FIELD IMAGERY → HEALTH/SURVIVAL ANALYSIS → SPATIAL RISK → HOTSPOT IDENTIFICATION → TARGETED ACTION`

---

# Final Agent Command

Start by auditing the current AgriSight codebase against this plan.

Before implementation:

1. Inspect the current database schema.
2. Inspect existing scan/history data.
3. Inspect the current AI response structure.
4. Inspect the current health-trend calculation.
5. Inspect the current risk calculation.
6. Inspect the weather integration.
7. Identify what data is already available.
8. Identify what data is genuinely missing.

Then start with **Phase A — Predictive Intelligence**.

For every milestone:

**Inspect → Plan → Implement → Integrate → Test → Fix → Polish**

Do not move to the next milestone until the current milestone is stable.

Do not fabricate data, predictions, percentages, maps, or AI results.

Do not break existing functionality.

The final objective is to transform AgriSight into a:

> **Mobile-first, explainable, predictive, field-aware agricultural intelligence platform for farmers.**

Core differentiation:

> **Leaf → Crop → Field → Risk → Prediction → Action**
