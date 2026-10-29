# JalRakshak — Delhi Monsoon Road Intelligence Platform

> **Know what lies beneath the flood.**

JalRakshak is a civic-tech prototype that helps delivery riders and commuters make safer road decisions during Delhi's monsoon season. It connects pre-monsoon road-defect observations with current waterlogging reports to identify **hidden road hazards** — deep potholes and open manholes submerged beneath floodwater and invisible to travellers on arterial Delhi roads like Minto Bridge, ITO Junction, Ring Road, and Mathura Road.

---

## 🚀 Live Demo & Dual-Mode Architecture

JalRakshak features a **dual-mode architecture**:
1. **Cloud Connected Mode**: Backed by a full Supabase PostgreSQL database, Supabase Auth, Supabase Storage for incident photographs, and Realtime event streams.
2. **Local Demo Mode**: Zero-configuration standalone mode that runs instantly in any browser with `localStorage` persistence and fallback mock services if Supabase credentials are not provided.

### Run locally
```bash
npm install
npm run dev
```
App starts at **http://localhost:5173**

### Run automated tests
```bash
npm test
```

### Production build & lint
```bash
npm run build
npm run lint
```

---

## 🗄️ Full-Stack Backend Integration (Supabase)

JalRakshak includes complete enterprise-grade full-stack integration with **Supabase**:

### 1. Database Schema & Migration (`supabase/migrations/20261029000001_initial_schema.sql`)
- **`profiles`**: User profiles automatically provisioned via PostgreSQL triggers on signup, with role-based access control (`citizen`, `reviewer`, `admin`).
- **`incidents`**: Full geospatial incident ledger tracking coordinates, categories, severities, verification levels, lifecycle status, photo storage paths, and public image URLs.
- **`incident_status_history`**: Audit trail recording previous status, new status, actor details, notes, and timestamps for every state transition.
- **`hidden_hazards`**: Correlated hazards connecting pre-monsoon baseline defects with active waterlogging events.

### 2. Row Level Security (RLS) & Policies
- **Public Read Access**: Active hazard maps and public safety routes are readable by all citizens.
- **Authenticated Incident Reporting**: Authenticated citizens and anonymous community members can submit incident observations.
- **Audited Status Lifecycle**: Municipal reviewers and administrators have privileged rights to transition lifecycle stages and verify hazards.
- **Profile Security**: Users can only edit their own profile; role escalation is blocked at the database trigger level.

### 3. Cloud Photo Storage (`incident-photos`)
- Dedicated storage bucket for incident hazard photographs.
- Client-side and server-side MIME validation (JPEG, PNG, WebP, GIF) up to 5 MB.
- Collision-resistant directory organization (`incidents/<id>/<timestamp>_<sanitized>.<ext>`).
- Public URL generation with atomic rollback/cleanup if database insert fails.

### 4. Supabase Setup Guide
1. Create a free project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard and execute the migration script:
   ```
   supabase/migrations/20261029000001_initial_schema.sql
   ```
3. Copy `.env.example` to `.env` and fill in your project credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```
4. Start the application with `npm run dev`. The top navigation will automatically show a green **Supabase Connected** badge.

---

## ✨ Two Innovations + One USP

### Innovation 1 — Pre-Monsoon Road Intelligence
Historical GPS-tagged road observations (potholes, open manholes, damaged surfaces) collected during dry months are stored before the rains arrive. When floods come and road surfaces drop to zero visibility, this baseline becomes a critical safety reference. Corridors like Minto Bridge and ITO Junction are catalogued before each monsoon so that when floodwater conceals them, JalRakshak can still warn riders.

### Innovation 2 — Dynamic Risk-Based Routing
Combines historical road defects, current waterlogging reports, report freshness, and verification confidence to compare route risks. SafeRoute recommends lower-risk alternatives with transparent trade-off information — e.g. the elevated Barapullah bypass adds 5 minutes but cuts risk by over 60% versus flooded Mathura Road.

### USP — Hidden Hazard Prediction
The core product differentiator: correlating previously recorded road defects with active waterlogging reports to warn riders about hazards that are submerged and invisible. Each alert shows the historical record, current waterlogging report, spatial-confidence score, and a clear disclaimer that the hazard is **inferred — not directly confirmed beneath the water.**

---

## 🎨 Visual Design System

JalRakshak uses a distinctive immersive brand identity rooted in **Delhi + Monsoon + Road Intelligence**.

| Token | Value | Usage |
|-------|-------|-------|
| Jet Black | `#050507` | Main application background |
| Deep Black | `#0B0B10` | Cards, sidebar, elevated surfaces |
| Royal Amethyst | `#8B5CF6` | Primary actions, active navigation, brand identity |
| Electric Cyan | `#00F5FF` | Map highlights, interactive elements, intelligence indicators |
| Critical Red | `#FF4D6D` | Emergency alerts, highest-risk hazards |
| High Orange | `#FF9F43` | High-priority hazards |
| Warning Yellow | `#FFD166` | Pending verification, medium-risk warnings |
| Safe Green | `#35D07F` | Verified resolution, low-risk safe routes |

### Atmospheric Delhi Monsoon Hero
The landing page features a **cinematic India Gate twilight monsoon photograph** with:
- Continuous canvas-rendered rain particle simulation (`MonsoonRainEffect`) with wind-slanted drops and ground splash ripples — respects `prefers-reduced-motion`
- Geospatial HUD telemetry overlays: live coordinates, rainfall rate, pulsing hazard reticle targeting a submerged cavity
- SafeRoute corridor vector preview (ITO ↔ Lajpat Nagar, Risk 84 vs. Risk 28 on bypass)
- Cursor-reactive ambient lighting with RAF-lerp interpolation across the entire application background

### Delhi Landmark Monsoon Surveillance Network
The landing page includes authentic atmospheric photographs of **four iconic Delhi landmarks** in monsoon downpour, each anchoring a real geographic surveillance sector:

| Landmark | Sector | Context |
|----------|--------|---------|
| India Gate (Rajpath C-Hexagon) | Central Delhi | Submerged cavity detection, 42 mm/hr |
| Red Fort / Lal Qila | Old Delhi Ring Road | Chandni Chowk inundation, 2.4 ft floodwater |
| Humayun's Tomb | Nizamuddin / South Delhi | Barapullah elevated bypass, SafeRoute Risk 26 |
| Purana Qila | Bhairon Marg / Central | Pragati Maidan drainage basin, PWD priority zone |

---

## 🔊 Voice-Guided Accessibility Assistant

JalRakshak includes a **bilingual voice guidance assistant** (English & हिन्दी) built entirely on the browser-native Web Speech API — no external API keys, no AI services, no microphone required to listen.

### Features

- **Persistent floating button** — `Talk to JalRakshak` visible on every page; shows a live equalizer animation when audio is playing
- **Three narration modes** per page:
  - 🔊 **Listen to this Page** — high-level screen summary with live data state (real incident counts, not hardcoded)
  - ✨ **Explain Important Information** — hidden hazard methodology, risk disclaimers, inferred prediction logic
  - ❓ **Guide Through Controls** — how to use filters, map markers, SafeRoute selectors, reporting form
- **Real text-to-speech** using `window.speechSynthesis` — genuine audio playback, not a fake animation
- **Play / Pause / Resume / Stop** controls with a visible status indicator
- **Live teleprompter** — full narration script visible in a scrollable captions box (benefits deaf/hard-of-hearing users independently of TTS)
- **Bilingual toggle** — switch between English and हिन्दी; gracefully warns when a native Hindi OS voice is not installed and falls back to system default
- **Page-aware dynamic content** — narrations use real live store data (actual `metrics.criticalAlerts`, `incidents.length`) — not hardcoded strings
- **Optional voice commands** (when browser `SpeechRecognition` is available) — say "Dashboard", "Safe Route", "Report", "Stop", "Hindi", or "English" to navigate or control playback; microphone requires explicit user activation

### Accessibility Standards
- `role="dialog"`, `aria-labelledby`, `aria-live="polite"` for playback state announcements
- Full keyboard operability — Escape closes panel; all controls keyboard-reachable
- Visible focus rings on every interactive element
- No colour-alone status communication — all states use text or icon labels
- Does **not** auto-start speech on page load; never records or transmits audio

---

## 📱 Application Screens

| Route | Screen | Description |
|-------|--------|-------------|
| `/` | Landing Page | Cinematic Delhi monsoon hero, 5-section progressive narrative, 4 landmark surveillance sectors |
| `/dashboard` | Command Center | Geospatial hazard map, live metrics, incident feed, hidden hazard correlations chart |
| `/safe-route` | SafeRoute | Bidirectional corridor risk comparison, hidden hazard overlay, route waypoints on map |
| `/road-intelligence` | Road Intelligence | Searchable evidence ledger with search, category/status filters, and status timeline |
| `/report` | Report Hazard | Multi-step reporting form with safety reminder and local-only submission |
| `/incidents/:id` | Incident Detail | Full incident with map, evidence, verification controls, status history timeline |
| `/maintenance` | Maintenance | Municipal lifecycle workflow + proposed government integration pipeline diagram |

---

## 🛠 Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| React | 19 | UI framework |
| TypeScript | 6 | Type safety |
| Vite | 8 | Build tooling |
| Tailwind CSS | 4 | Styling (dark design system) |
| React Router | 7 | Client-side routing |
| Leaflet + OSM | 1.9 | Interactive Delhi hazard map |
| Recharts | 3 | Data visualizations |
| Lucide React | latest | Icon system |
| Web Speech API | Browser native | Voice guidance TTS + optional recognition — no external dependency |

---

## 📂 Project Structure

```
src/
├── assets/
│   ├── delhi-monsoon-hero.jpg       # India Gate twilight monsoon photograph
│   ├── delhi-red-fort.jpg           # Red Fort / Lal Qila monsoon photograph
│   ├── delhi-humayun-tomb.jpg       # Humayun's Tomb monsoon photograph
│   └── delhi-purana-qila.jpg        # Purana Qila monsoon photograph
├── context/
│   └── AuthContext.tsx              # React Context for Supabase Auth & citizen profiles
├── data/
│   ├── types.ts                     # Core domain TypeScript types
│   ├── incidents.ts                 # Synthetic baseline dataset
│   └── store.ts                     # Reactive data store with local/cloud sync
├── lib/
│   └── supabase.ts                  # Supabase client instance, health check & configuration
├── services/
│   ├── authService.ts               # Sign-in, sign-up, sign-out & session listeners
│   ├── incidentService.ts           # PostgreSQL fetch, create, update & Realtime channels
│   └── storageService.ts            # Cloud photo validation, upload & cleanup
├── types/
│   └── database.types.ts            # Generated TypeScript types from PostgreSQL schema
├── utils/
│   ├── format.ts                    # Formatting, color, and utility helpers
│   ├── geo.ts                       # Geolocation and distance utilities
│   ├── speech.ts                    # Web Speech API engine (TTS + optional recognition)
│   └── voiceGuidanceContent.ts      # Bilingual page narration scripts (EN + HI)
├── components/
│   ├── auth/
│   │   └── AuthModal.tsx            # Citizen & reviewer sign-in / registration modal
│   ├── layout/
│   │   ├── Layout.tsx               # Responsive sidebar, auth controls & top toolbar
│   │   ├── BackendStatusBadge.tsx   # Live indicator of Supabase Cloud vs Local Demo
│   │   └── InteractiveBackground.tsx # Ambient lighting + continuous rain simulation
│   ├── map/
│   │   └── HazardMap.tsx            # Leaflet map, dark theme, hazard markers, route waypoints
│   ├── ui/
│   │   └── MonsoonRainEffect.tsx    # Canvas-rendered continuous rain particle engine
│   └── voice/
│       └── VoiceAssistant.tsx       # Floating bilingual voice guidance assistant panel
└── pages/
    ├── LandingPage.tsx              # Cinematic hero + 5-section progressive narrative
    ├── DashboardPage.tsx            # Command Center — metrics, map, incident feed
    ├── SafeRoutePage.tsx            # SafeRoute corridor comparison + map waypoints
    ├── RoadIntelligencePage.tsx     # Evidence ledger with search, filters, timeline
    ├── ReportPage.tsx               # Hazard reporting form with photo upload & validation
    ├── IncidentDetailPage.tsx       # Single incident detail, map, status history
    └── MaintenancePage.tsx          # Municipal workflow lifecycle + status transitions

supabase/
└── migrations/
    └── 20261029000001_initial_schema.sql  # Complete PostgreSQL schema, RLS, triggers & storage

tests/
├── risk-mapping.test.ts             # Risk-level to severity mapping tests
├── store.test.ts                    # Reactive store & metric tests
├── report-photo.test.ts             # Image validation and report constraints tests
├── backend-services.test.ts         # Supabase auth, storage, and incident service tests
└── run-all.ts                       # Integrated test runner
```

---

## 🗺 Demo Dataset

18 synthetic road incidents across central and south Delhi:
- Pre-monsoon pothole and open manhole **baseline observations** (dry-season surveys)
- Active **waterlogging reports** (Minto Bridge, Ring Road, ITO Junction, Pragati Maidan, Mathura Road)
- **4 hidden hazard correlations** with spatial confidence scores and inferred-only disclaimers
- **3 pre-configured route plans** covering all supported corridor pairs:
  - Connaught Place ↔ Lajpat Nagar — Mathura Road direct vs. Barapullah Elevated Bypass
  - ITO ↔ Connaught Place — DDU Marg underpass vs. Sikandra Road alternate
  - ITO ↔ Lajpat Nagar — Ring Road floodplain vs. Lodhi Road bypass
- Incidents across all **5 lifecycle stages**: Reported → Under Verification → Forwarded for Review → Repair Reported → Resolution Verified

All coordinates reference real Delhi roads. Data is **entirely synthetic** and for demonstration only.

---

## 🔒 Design Principles

- **Transparency** — Every inferred hazard carries an explicit "not directly confirmed" disclaimer in both UI and voice narration
- **No fake government integration** — "Forwarded for Review" is clearly marked as a demo action with no real government submission
- **Honest uncertainty** — Routes with no known hazards are explicitly distinguished from "verified safe"
- **Honest voice narration** — Voice guide states it uses browser speech synthesis and that all data is demonstration data
- **Local-only demo** — No backend calls, no API keys, no personal data collected; all state in `localStorage`
- **Safety first** — Reporting form shows a prominent "report only when safely stopped" warning; voice guide never auto-starts or interrupts unsolicited

---

## 🔄 Reset Demo Data

Click **"Reset Demo Data"** in the sidebar (desktop) or mobile nav to restore all incidents and routes to their initial demonstration state.

---

## ⚠ Disclaimers

- All data is synthetic demonstration data. Not real Delhi incident records.
- No government partnership exists. The "proposed integration" architecture is aspirational only.
- Route risk scores are illustrative prototype calculations, not validated predictive models.
- Evidence photographs are placeholders. No authentic field evidence is displayed.
- Rain measurements, flood depths, and incident counts in voice narration reflect demo data only.
- This demo does not contact any external service, API, or government system.
- Voice guidance uses the browser's built-in Web Speech API. Audio quality and Hindi voice availability vary by operating system and installed voices.

---

*Built as a civic-tech prototype demonstrating Delhi monsoon road intelligence — JalRakshak.*
