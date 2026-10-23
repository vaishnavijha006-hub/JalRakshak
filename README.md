# JalRakshak — Delhi Monsoon Road Intelligence Platform

> **Know what lies beneath the flood.**

JalRakshak is a civic-tech prototype that helps delivery riders and commuters make safer road decisions during Delhi's monsoon season. It connects pre-monsoon road-defect observations with current waterlogging reports to identify **hidden road hazards** — deep potholes and open manholes submerged beneath floodwater and invisible to travellers on arterial Delhi roads like Minto Bridge, ITO Junction, Ring Road, and Mathura Road.

---

## 🚀 Live Demo

> **All data shown is synthetic demonstration data.** No real incidents, no government integration, no live sensor feeds.

### Run locally
```bash
npm install
npm run dev
```
App starts at **http://localhost:5173**

### Production build
```bash
npm run build
npm run preview
```

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
├── data/
│   ├── types.ts                     # Core TypeScript types
│   ├── incidents.ts                 # Synthetic demo dataset (18 incidents, 4 hidden hazards, 3 route plans)
│   └── store.ts                     # Reactive data store with localStorage persistence
├── utils/
│   ├── format.ts                    # Formatting, color, and utility helpers
│   ├── geo.ts                       # Geolocation and distance utilities
│   ├── speech.ts                    # Web Speech API engine (TTS + optional recognition)
│   └── voiceGuidanceContent.ts      # Bilingual page narration scripts (EN + HI)
├── components/
│   ├── layout/
│   │   ├── Layout.tsx               # Responsive sidebar + top toolbar
│   │   └── InteractiveBackground.tsx  # Cursor-reactive ambient lighting + continuous rain simulation
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
    ├── ReportPage.tsx               # Hazard reporting form with review step
    ├── IncidentDetailPage.tsx       # Single incident detail, map, status history
    └── MaintenancePage.tsx          # Municipal workflow lifecycle + integration diagram
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
