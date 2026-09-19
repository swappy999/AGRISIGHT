# 🌾 AgriSight — Smart India Hackathon (SIH) Final Submission Document

## 1. Executive Summary

**AgriSight** is an AI-Powered Multimodal Decision Support & Spatial Field Intelligence Platform designed for Indian agriculture. Moving beyond simple leaf disease scanners, AgriSight implements a closed-loop agronomic intelligence cycle:

```text
LEAF → PLANT → CROP → FIELD → RISK → PREDICTION → ACTION → OUTCOME
```

---

## 2. Core Problem & Agricultural Need

Smallholder farmers in India lose up to 35% of crop yields annually to preventable fungal, bacterial, and viral diseases. Traditional diagnostic apps only provide a one-time classification label without considering:
- Historical crop progression (*Is the disease getting better or worse after spraying?*)
- Spatial plot clustering (*Is the entire 5-acre field infected, or only the low-drainage East quadrant?*)
- Environmental microclimate (*Does current humidity create a high-risk spore propagation window?*)
- Multilingual voice accessibility (*Can farmers in rural regions interact in their native language?*)

---

## 3. The AgriSight Innovation & 5 Core Differentiators

### 🥇 1. Multi-Level Intelligence Hierarchy (`Leaf → Crop → Field`)
- **Leaf Level**: High-precision disease diagnosis with confidence scoring.
- **Crop Level**: Longitudinal health tracking, vitality scoring, and recurrence counting.
- **Field Level**: 4-quadrant spatial health matrix with disease hotspot pin-pointing.

### 🥈 2. Predictive Progression Engine (`Detect → Predict → Act`)
- Automatically compares scans over time to evaluate trajectory (*Improving*, *Worsening*, *Stable*, or *Recurring*).
- Dynamic follow-up scheduling based on pathogen severity.

### 🥉 3. Explainable AI (XAI) Decision Support
- Clear agronomic reasoning (*Why is this happening? What evidence supports this?*).
- Confidence tier categorization (*High Confidence*, *Moderate Evidence*, *Guidance*).
- Zero hallucination guardrails — alerts farmers when image evidence is inconclusive.

### 🏅 4. Spatial Precision & Targeted Treatment
- Identifies specific micro-plots with active disease outbreaks.
- Prevents indiscriminate pesticide spraying across whole fields, saving costs and reducing environmental runoff.

### 🎖️ 5. Bharat-First Multilingual & Voice Accessibility
- Complete UI persistence and localized terminology in **English**, **Hindi (हिन्दी)**, and **Bengali (বাংলা)**.
- Integrated voice input for hands-free query support in the field.
- Resilient offline mode with local draft preservation.

---

## 4. Technical Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    NEXT.JS 16 FRONTEND                      │
│   (Tailwind CSS, Turbopack, PWA, Speech API, Lucide Icons)  │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON & Multipart
┌──────────────────────────────▼──────────────────────────────┐
│                    FASTAPI BACKEND                          │
│   (Python 3.11, Pydantic, Rate Limiting, Async Handlers)    │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
┌──────────────▼──────────────┐┌──────────────▼───────────────┐
│     GEMINI 2.5 FLASH AI     ││     SUPABASE POSTGRESQL      │
│  (Multimodal Leaf Pathology,││  (Row-Level Security, GPS    │
│   Explainable Decision XAI) ││   Geospatial Data, Storage)  │
└─────────────────────────────┘└──────────────────────────────┘
```

---

## 5. Demonstration Scenarios (SIH Evaluation Flow)

1. **Scenario 1: Disease Recovery Loop**
   * *Step 1*: Upload leaf image with fungal lesion → System flags Critical Severity (85% Risk Score).
   * *Step 2*: Farmer logs copper fungicide intervention.
   * *Step 3*: Follow-up scan 3 days later confirms pathogen stoppage; health status transitions to *Improving*.

2. **Scenario 2: Healthy Crop & Risk Radar**
   * *Step 1*: Nominal 95% crop health detected.
   * *Step 2*: Open-Meteo microclimate radar detects 88% humidity.
   * *Step 3*: Preventative advisory issued to avoid evening overhead irrigation.

3. **Scenario 3: Spatial Field Hotspots**
   * *Step 1*: Geotagged scans pinpoint disease outbreak in Quadrant B (East).
   * *Step 2*: Field Health Index drops to 60% in Quadrant B while remaining 90%+ elsewhere.
   * *Step 3*: Targeted spot-treatment recommendation issued for 0.8 acres instead of 4 acres.

---

## 6. Security, Privacy & Performance Audit

* **Row Level Security (RLS)**: Users can only view and modify their own crops, scans, fields, and interventions.
* **Storage Isolation**: Leaf photos stored in user-isolated Supabase storage buckets.
* **Optimized Latency**: Turbopack compiled Next.js bundle with static route pre-rendering for instant page loads.

---

## 7. Product Freeze Status

✅ **AgriSight v1.0 is frozen and certified for Smart India Hackathon (SIH) demonstration.**
