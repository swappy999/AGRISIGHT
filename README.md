# AgriSight — Field Intelligence for Smarter, Safer Farming

AgriSight is an agronomic precision farming and diagnostic platform built for Indian farmers. The application places the **Field as the single source of truth** for crop health, disease diagnostics, foliar nutrition analysis, smart irrigation guidance, and IPM protocols.

---

## Architecture Overview

```
                      ANDROID MOBILE (Capacitor) / WEB (Next.js)
                                         |
                                       HTTPS
                                         |
                        +----------------+----------------+
                        |                                 |
                        v                                 v
                 FastAPI Backend                   Supabase Auth
             (Cloud: Render/Railway)              & PostgreSQL DB
                        |                                 |
                        +----------------+----------------+
                                         |
                                         v
                                  Supabase Storage
```

---

## Key Capabilities

1. **Field-Centric Workspace**: Full lifecycle tracking of fields, crops, days-since-planting, and localized conditions.
2. **AI Leaf Scanner**: Vision-guided leaf disease detection with crop/non-crop validation.
3. **Smart Irrigation & Foliar Nutrition**: Predictive watering advisories and nutrient deficiency remediation.
4. **Trilingual Support**: English, Hindi (हिन्दी), and Bengali (বাংলা).
5. **Mobile First & Offline Resilient**: Native Capacitor Android build with `@capacitor/network` status detection and local caching.

---

## Tech Stack

- **Frontend**: Next.js 16 (App Router), Tailwind CSS v4, Capacitor 8 (Android)
- **Backend**: FastAPI, Uvicorn, Python 3.11
- **AI & Reasoning**: Google Gemini API (`gemini-2.5-flash`, `gemini-3.5-flash-lite`)
- **Database & Auth**: Supabase (PostgreSQL, Auth with deep link callbacks, Storage)

---

## Deployment Instructions

Refer to the deployment documentation in the repository:
- `backend/Dockerfile`
- `backend/render.yaml`
- `backend/Procfile`
