# AgriSight 🌱

### Field Intelligence for Smarter, Safer Farming

AgriSight is an **offline-first, field-deployable agricultural intelligence platform** designed to help farmers understand crop health, environmental conditions, irrigation needs, agricultural risks, and recommended actions from a single mobile application.

Built for **Smart India Hackathon 2026 — SIH26180**, AgriSight combines **local intelligence, camera-based crop analysis, IoT sensor data, field history, multilingual voice interaction, weather context, alerts, and actionable recommendations** into one farmer-friendly system.

> **Sense → Detect → Predict → Advise → Act**

---

## 🏆 Smart India Hackathon

| Category | Details |
|---|---|
| **Project** | AgriSight |
| **PS ID** | SIH26180 |
| **Organization** | Qualcomm Inc. |
| **Category** | Hardware |
| **Theme** | Disaster Management |
| **Domain** | Agriculture, FoodTech & Rural Development |
| **Core Focus** | Offline-first Edge-AI agricultural intelligence |

---

# 🌾 The Problem

Farmers often have to make important decisions with incomplete information:

- Crop diseases may be detected too late.
- Pest and nutrient problems can be difficult to identify.
- Irrigation decisions are often based on guesswork.
- Heat, drought, flooding, waterlogging, and environmental stress can damage crops.
- Agricultural expertise is not always available in the field.
- Rural connectivity can be unreliable.
- Existing solutions often separate crop diagnosis, IoT monitoring, weather, and advisory systems.

Farmers need **field-level intelligence that remains useful even when connectivity is limited**.

---

# 💡 Our Solution

AgriSight creates a unified agricultural decision-support system that combines:

- 📷 Camera-based crop and leaf analysis
- 🌱 Crop and field management
- 🌡️ Environmental sensing
- 💧 Soil-moisture monitoring
- 🌤️ Weather and environmental context
- 🎙️ Multilingual voice interaction
- 🧠 Local/offline intelligence
- 📊 Field analytics and historical trends
- 🚨 Agricultural risk and alert detection
- 💡 Actionable recommendations
- 📱 Mobile-first field operation
- 🔄 Offline data storage and synchronization

Instead of showing raw data, AgriSight converts field information into **simple decisions and actions**.

---

# 🧠 Core Intelligence

AgriSight follows a multimodal decision pipeline:

```text
                FIELD
                  │
      ┌───────────┼───────────┐
      │           │           │
    Camera      Sensors      Voice
      │           │           │
      └───────────┼───────────┘
                  ↓
          Local Data Processing
                  ↓
          Agricultural AI Layer
                  ↓
            Sensor Fusion
                  ↓
        Agricultural Knowledge
                  ↓
          Decision Engine
                  ↓
      ┌───────────┼───────────┐
      │           │           │
    Detect      Predict      Assess
      │           │           │
      └───────────┼───────────┘
                  ↓
        Actionable Recommendation
                  ↓
             FARMER ACTION
```

The architecture is designed so that core agricultural intelligence can operate locally, with connectivity used as an enhancement rather than a dependency.

---

# 📱 Mobile Application

AgriSight is designed as a **mobile-first field application**.

### Main navigation

```text
Home
Fields
Scan
Assistant
Profile
```

### Field-centric workflow

```text
Create Field
     ↓
Add Crop
     ↓
Optional Field Node
     ↓
Field Health
     ↓
Scan Leaf / View Conditions
     ↓
Analysis
     ↓
Recommendation
     ↓
History & Analytics
```

A farmer should be able to manage an entire field from one workspace.

---

# 🔍 Scan Leaf

The Scan Leaf workflow is designed around a simple process:

```text
Capture Image
      ↓
Image Validation
      ↓
Local AI Processing
      ↓
Crop / Health Analysis
      ↓
Risk Assessment
      ↓
Recommended Action
      ↓
Save to Field History
```

The system is designed to avoid generic or fabricated results.

Every completed scan should be associated with:

- Authenticated user
- Field
- Crop
- Actual image
- Scan ID
- Timestamp
- Language
- Analysis result
- Processing status
- Processing mode
- Historical context

This allows the Assistant and analytics system to use **real field history**.

---

# 🧠 Local & Offline Intelligence

Offline-first operation is a core design principle.

The application is designed around local storage and local processing so that important field information remains accessible during poor connectivity.

### Local capabilities

- Field information
- Crop profiles
- Scan history
- Sensor readings
- Alerts
- Recommendations
- Weather cache
- Assistant context
- Agricultural knowledge
- Pending synchronization
- Application settings

### Offline flow

```text
Field Data
    ↓
Local Storage
    ↓
Local Processing
    ↓
Local Decision Support
    ↓
Farmer
```

When connectivity becomes available:

```text
Local Changes
     ↓
Sync Queue
     ↓
Secure Cloud Synchronization
     ↓
Account Backup / Multi-device Continuity
```

The cloud is an enhancement layer, not the foundation of field operation.

---

# 🌱 Agricultural Intelligence

AgriSight is designed to evaluate multiple agricultural conditions.

### Crop Health

- Crop health status
- Disease indicators
- Pest indicators
- Nutrient stress
- Environmental stress
- Growth-stage context

### Water Intelligence

- Soil moisture
- Water stress
- Irrigation recommendations
- Excess-water detection
- Waterlogging risk
- Irrigation history

### Disaster & Resilience Intelligence

- Heat stress
- Drought risk
- Flood risk
- Waterlogging
- Extreme environmental conditions
- Disease-favorable conditions
- Crop stress

The goal is to provide **early, understandable warnings instead of raw sensor values alone**.

---

# 🔌 IoT & Field Hardware

AgriSight supports an ESP32-based field sensor node.

### Sensor foundation

```text
ESP32
 │
 ├── Soil Moisture Sensor
 │
 ├── Temperature Sensor
 │
 ├── Humidity Sensor
 │
 ├── pH Sensor
 │
 └── Optional Water Flow Sensor
```

The ESP32 is responsible for:

- Sensor acquisition
- Sensor communication
- Device status
- Actuator control
- Sending structured field readings

The heavier agricultural intelligence is designed for a capable local compute device.

### Example sensor payload

```json
{
  "device_id": "AGRISIGHT_NODE_01",
  "field_id": "FIELD_01",
  "soil_moisture": 31.5,
  "temperature": 29.4,
  "humidity": 67,
  "soil_ph": 6.4,
  "timestamp": "..."
}
```

---

# 🔗 Sensor Fusion

A camera alone cannot understand the entire field.

A sensor alone cannot understand the appearance of a crop.

AgriSight combines both.

```text
Camera
  +
Soil Moisture
  +
Temperature
  +
Humidity
  +
pH
  +
Weather
  +
Crop Profile
  +
Field History
       ↓
  SENSOR FUSION
       ↓
AGRICULTURAL DECISION
```

This allows the system to move from:

> "The leaf looks stressed."

toward:

> "The crop is showing stress and the surrounding field conditions indicate a possible environmental or water-related cause."

---

# 🎙️ Multilingual Farmer Assistant

AgriSight is designed for multilingual interaction.

### Supported languages

- English
- Hindi
- Bengali

The Assistant can use:

- Text input
- Voice input
- Voice output
- Field context
- Crop context
- Recent scan history
- Sensor context
- Agricultural knowledge

### Assistant architecture

```text
Farmer Voice / Text
        ↓
Language Detection
        ↓
Intent Understanding
        ↓
Field Context
        ↓
Agricultural Knowledge
        ↓
Decision / Reasoning Layer
        ↓
Simple Answer
        ↓
Voice / Text Response
```

The response style should remain simple and actionable:

```text
Answer
  ↓
Reason
  ↓
Action
```

---

# 🌤️ Weather & Location

The application can use device location to provide relevant environmental context.

Weather information may include:

- Temperature
- Weather condition
- Rain / precipitation
- Humidity
- Wind speed
- Feels-like temperature
- Rain probability
- Other available environmental metrics

The application should use the **actual device location and available weather data**, rather than hardcoded values.

When offline, the system can display the latest cached weather information with its timestamp.

---

# 🚨 Alerts & Recommendations

AgriSight converts field information into actionable alerts.

Examples:

```text
LOW SOIL MOISTURE
Irrigation may be required.

HIGH HEAT STRESS
Monitor crop condition and irrigation.

EXCESS WATER
Check drainage and waterlogging.

CROP HEALTH RISK
Inspect affected plants.

DISEASE RISK
Perform field inspection and follow recommended management.
```

Alerts are designed to be:

- Context-aware
- Action-oriented
- Deduplicated
- Persisted
- Available offline where possible

---

# 📊 Field History & Analytics

Every field can maintain a digital history.

### Field history

- Crop changes
- Scan history
- Sensor readings
- Alerts
- Recommendations
- Farmer actions
- Environmental events

### Analytics

- Crop health trends
- Soil moisture trends
- Temperature/humidity trends
- Scan history
- Risk history
- Field activity
- Recommendation history

This enables farmers to understand **how a field changes over time**, rather than looking at isolated readings.

---

# 🔐 Account & Data Isolation

AgriSight is designed for authenticated users.

Each user's data is isolated.

```text
User
 │
 ├── Fields
 │    ├── Crops
 │    ├── Scans
 │    ├── Sensor Data
 │    ├── Alerts
 │    └── Analytics
 │
 └── Assistant Context
```

Security principles include:

- Authentication required
- User-specific data
- Row-level access control
- Secure storage
- Protected API access
- No shared demo data
- No fabricated user records
- No cross-account scan visibility

---

# 🏗️ System Architecture

```text
┌──────────────────────────────────────────────────────────┐
│                    AGRISIGHT FIELD                       │
├──────────────────────────────────────────────────────────┤
│ Camera │ Voice │ ESP32 Sensors │ Weather │ Field Data   │
└─────────────────────────┬────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│              LOCAL DATA PROCESSING LAYER                 │
│ Image Processing │ Sensor Filtering │ Validation        │
│ Local Cache │ Offline Queue │ Data Normalization        │
└─────────────────────────┬────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│                 LOCAL AI / EDGE LAYER                    │
│ Vision Intelligence │ Speech │ Sensor Intelligence      │
│ Local Models │ Agricultural Processing                  │
└─────────────────────────┬────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│                 SENSOR FUSION LAYER                      │
│ Crop │ Field │ Image │ Sensors │ Weather │ History      │
└─────────────────────────┬────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│             AGRICULTURAL DECISION ENGINE                 │
│ Disease │ Pest │ Nutrition │ Water │ Heat │ Flood       │
│ Drought │ Stress │ Risk Scoring │ Recommendations       │
└─────────────────────────┬────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│                    FARMER INTERFACE                      │
│ Mobile App │ Voice │ Alerts │ Analytics │ History       │
└─────────────────────────┬────────────────────────────────┘
                          ↓
                     FARMER ACTION

                ┄┄ Optional Connectivity ┄┄
                          ↕
              Secure Synchronization Layer
```

---

# 🧩 Technology Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- Capacitor

## Mobile

- Capacitor Android
- Native device capabilities
- Camera
- Geolocation
- Network status
- Local preferences
- Offline storage

## Backend & Data

- Supabase
- PostgreSQL
- Authentication
- Row Level Security
- Storage
- Edge Functions

## Local Data

- SQLite / local persistent storage
- Offline-first repository pattern
- Sync queue
- Cached field context

## AI / Intelligence

- On-device/local AI architecture
- Computer vision
- Agricultural knowledge base
- Sensor intelligence
- Decision engine
- Multimodal sensor fusion
- Local rule-based safety layer

## Hardware

- ESP32
- Soil moisture sensor
- DHT22 / environmental sensing
- pH sensor
- Optional water-flow sensor
- Relay / actuator interface

## Deployment

- Vercel
- Supabase
- Android APK
- Qualcomm-capable Edge platform for the intended Edge-AI deployment

---

# 🔄 Offline-First Data Architecture

AgriSight uses a local-first approach.

```text
                 USER ACTION
                     ↓
               LOCAL DATABASE
                     ↓
              APPLICATION LOGIC
                     ↓
        ┌────────────┴────────────┐
        ↓                         ↓
   Works Offline             Internet Available
        ↓                         ↓
 Local Result / Queue        Secure Sync
                                  ↓
                              Supabase
```

### Sync states

```text
LOCAL_ONLY
     ↓
PENDING_SYNC
     ↓
SYNCING
     ↓
SYNCED
```

If synchronization fails:

```text
SYNC_FAILED
     ↓
Retry when connectivity returns
```

---

# 🛡️ Safety Architecture

Agricultural automation should never depend entirely on probabilistic AI output.

AgriSight therefore separates:

```text
AI Recommendation
       ↓
Safety / Rule Engine
       ↓
Actuator Controller
       ↓
Pump / Valve
```

The deterministic safety layer can enforce conditions such as:

- Minimum/maximum moisture thresholds
- Maximum pump runtime
- Sensor validity
- Device connectivity
- Manual override
- Emergency shutdown
- Actuator cooldown

**The ESP32 GPIO must never directly power a pump.** A suitable relay/driver and separate pump power supply are required.

---

# 📁 Project Structure

A recommended repository structure:

```text
agrisight/
│
├── app/
├── components/
├── services/
├── lib/
├── hardware/
├── public/
├── android/
├── supabase/
├── docs/
├── capacitor.config.ts
├── next.config.ts
├── package.json
└── README.md
```

The actual repository structure may differ. The final SIH repository should contain only maintained source code, documentation, configuration templates, and required assets.

---

# 🧹 Repository Cleanup Policy

Before pushing the final SIH repository, perform a complete cleanup.

### Remove

- Unused components
- Dead routes
- Abandoned experiments
- Duplicate components
- Duplicate services
- Old logos
- Temporary images
- Development screenshots
- Test/demo accounts
- Hardcoded credentials
- Debug logs
- Temporary scripts
- Build artifacts
- Old APKs
- IDE metadata
- Unused dependencies
- Generated cache folders
- Old documentation
- Prototype-only mock data
- Fake sensor readings
- Fake scan results
- Hardcoded weather data
- Broken imports
- Dead feature flags

### Never commit

```text
.env
.env.local
.env.production
*.pem
*.key
*.keystore
*.jks
node_modules/
.next/
out/
dist/
build/
coverage/
*.log
.DS_Store
.idea/
```

Use:

```text
.env.example
```

with placeholder values only.

---

# 🔑 Environment Configuration

Example:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_WEATHER_API_URL=
NEXT_PUBLIC_APP_ENV=production
```

Secrets must be stored through the appropriate deployment/platform secret manager.

**Never commit real credentials to GitHub.**

---

# 📲 Android Deployment

AgriSight uses Capacitor for mobile packaging.

```text
App ID:
com.agrisight.app

App Name:
AgriSight

Web Directory:
out

Minimum Android SDK:
24+

Target Android SDK:
36
```

After installation:

```text
Phone
  ↓
AgriSight APK
  ↓
Local Application
  ↓
Local Storage / Local Intelligence
  ↓
Optional Internet Synchronization
```

A laptop, development server, USB connection, or localhost server should **not** be required for normal field usage.

---

# ☁️ Connectivity Model

AgriSight follows:

```text
OFFLINE
  ↓
Core field functionality
  ↓
Local storage
  ↓
Local intelligence
  ↓
Local alerts/recommendations

ONLINE
  ↓
Synchronization
  ↓
Cloud backup
  ↓
Weather refresh
  ↓
Knowledge/model/software updates
```

Connectivity improves the system but should not make the application unusable.

---

# 🚀 Installation

## 1. Clone

```bash
git clone <repository-url>
cd agrisight
```

## 2. Install dependencies

```bash
npm install
```

## 3. Configure environment

```bash
cp .env.example .env.local
```

Add the required configuration.

## 4. Run development server

```bash
npm run dev
```

## 5. Build

```bash
npm run build
```

## 6. Sync mobile project

```bash
npx cap sync android
```

Build the Android application using the configured Android project.

---

# 🧪 Quality & Validation

Before every SIH release, verify:

### Authentication

- [ ] Account creation
- [ ] Google authentication
- [ ] Email verification
- [ ] Password reset
- [ ] Persistent session
- [ ] Logout
- [ ] Account isolation

### Fields

- [ ] Create field
- [ ] Edit field
- [ ] Delete field
- [ ] Add crop
- [ ] Field history
- [ ] Field analytics

### Scanning

- [ ] Camera capture
- [ ] Gallery selection
- [ ] Image validation
- [ ] Crop validation
- [ ] Analysis
- [ ] Real result persistence
- [ ] Scan history
- [ ] Scan comparison

### Assistant

- [ ] Field context
- [ ] Recent scan context
- [ ] Crop context
- [ ] Multilingual text
- [ ] Voice input
- [ ] Voice output
- [ ] Persistent conversation context

### Offline

- [ ] App opens offline
- [ ] Existing fields visible
- [ ] Existing crops visible
- [ ] Existing scans visible
- [ ] Local data writes
- [ ] Queue creation
- [ ] Sync retry
- [ ] Conflict handling

### Hardware

- [ ] ESP32 communication
- [ ] Soil moisture
- [ ] Temperature
- [ ] Humidity
- [ ] Device status
- [ ] Sensor validity
- [ ] Actuator safety
- [ ] Manual override

### Mobile

- [ ] Android real-device test
- [ ] Camera permission
- [ ] Location permission
- [ ] Network transitions
- [ ] Background/resume
- [ ] App restart
- [ ] Storage persistence
- [ ] APK installation
- [ ] APK update
- [ ] No laptop dependency

---

# 🔒 Security Checklist

- [ ] No API keys in GitHub
- [ ] No service-role keys in the client
- [ ] Supabase RLS enabled
- [ ] User ownership enforced
- [ ] Storage access restricted
- [ ] Input validation
- [ ] File type validation
- [ ] Image size limits
- [ ] Secure authentication
- [ ] Secure API endpoints
- [ ] Production error handling
- [ ] No sensitive information in logs

---

# 📈 Scalability

AgriSight is designed to scale from:

```text
Individual Farmer
       ↓
Small Farm
       ↓
Multiple Fields
       ↓
Farmer Groups / FPOs
       ↓
Cooperatives
       ↓
Enterprise Agriculture
       ↓
Regional Agricultural Networks
```

The architecture can support:

- Multiple farms
- Multiple fields
- Multiple crops
- Multiple sensor nodes
- Multiple users
- Regional agricultural knowledge
- Edge device deployments
- Cloud synchronization
- Centralized analytics when connectivity exists

---

# 🌍 Long-Term Vision

AgriSight aims to become a **field-level agricultural intelligence layer**.

```text
Farmer
  +
Field
  +
Crop
  +
Camera
  +
Sensors
  +
Weather
  +
Local Knowledge
  +
Edge AI
  +
Historical Data
        ↓
Agricultural Intelligence
        ↓
Action
```

The objective is not simply to identify a disease.

The objective is to help answer:

> **What is happening in my field, why might it be happening, what is the risk, and what should I do next?**

---

# 🎯 Why AgriSight?

AgriSight brings multiple fragmented capabilities into one system:

| Capability | AgriSight |
|---|---|
| Crop management | ✅ |
| Field management | ✅ |
| Camera intelligence | ✅ |
| Sensor monitoring | ✅ |
| Weather context | ✅ |
| Multilingual interaction | ✅ |
| Voice interaction | ✅ |
| Offline-first operation | ✅ |
| Local intelligence | ✅ |
| Sensor fusion | ✅ |
| Agricultural decision engine | ✅ |
| Disaster-risk awareness | ✅ |
| Field history | ✅ |
| Analytics | ✅ |
| Actionable recommendations | ✅ |
| Mobile deployment | ✅ |
| ESP32 integration | ✅ |
| Edge-AI architecture | ✅ |

---

# 🏆 SIH Vision

AgriSight is designed around a simple principle:

> **Agricultural intelligence should reach the farmer at the field, not wait for the field to reach the cloud.**

By combining local intelligence, multimodal sensing, agricultural knowledge, mobile technology, and field hardware, AgriSight aims to make agricultural decision support more accessible, timely, and resilient in real-world conditions.

---

# 👥 Project

**AgriSight**  
Smart India Hackathon 2026

**PS ID:** SIH26180  
**Organization:** Qualcomm Inc.  
**Category:** Hardware  
**Theme:** Disaster Management  
**Domain:** Agriculture, FoodTech & Rural Development

---

## 📄 License

Add the project's final license here before public release.

---

## ⭐ Final Repository Standard

The final GitHub repository should represent the **clean, production-oriented SIH version of AgriSight**.

```text
Clean Code
+
Clean Documentation
+
Secure Configuration
+
Real Application Logic
+
Offline-First Architecture
+
Local Intelligence
+
Mobile Application
+
IoT Integration
+
Agricultural Decision Support
```

No temporary prototype artifacts should be part of the final repository.
