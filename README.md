# JalRakshak — Delhi Monsoon Road Intelligence Platform

> **Know what lies beneath the flood.**

JalRakshak is a civic-tech prototype that helps delivery riders and commuters make safer road decisions during Delhi monsoon season. It connects pre-monsoon road-defect observations with current waterlogging reports to identify **hidden road hazards** — potholes and open manholes submerged beneath floodwater and invisible to travellers.

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
Historical GPS-tagged road observations collected under normal conditions — potholes, open manholes, damaged surfaces — are stored before the rains arrive. When floods come and visibility of the road surface drops to zero, this historical baseline becomes a critical safety reference.

### Innovation 2 — Dynamic Risk-Based Routing
Combines historical road defects, current waterlogging reports, report freshness, and verification confidence to compare route risks. Offers lower-risk alternatives with transparent trade-off information (longer route = lower risk).

### USP — Hidden Hazard Prediction
The core product demo: correlating previously recorded road defects with current waterlogging reports to warn riders about hazards that are submerged and invisible. Each alert shows the historical record, current waterlogging report, confidence score, and a clear disclaimer that the hazard is **inferred — not directly confirmed** beneath the water.

---

## 📱 Application Screens

| Route | Screen | Description |
|-------|--------|-------------|
| `/` | Landing Page | Product introduction with animated hazard composition |
| `/dashboard` | Command Center | Main judging screen — live map, metrics, incident feed |
| `/safe-route` | SafeRoute | Route risk comparison with hidden hazard overlay |
| `/road-intelligence` | Road Intelligence | Searchable evidence database, hidden hazard correlations |
| `/report` | Report Hazard | Full reporting form with review + success states |
| `/incidents/:id` | Incident Detail | Full incident detail with map, timeline, demo controls |
| `/maintenance` | Maintenance | Lifecycle workflow + proposed government integration diagram |

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

---

## 📂 Project Structure

```
src/
├── data/
│   ├── types.ts          # Core TypeScript types
│   ├── incidents.ts      # Synthetic demo dataset (18 incidents, 4 hidden hazards, 2 route plans)
│   └── store.ts          # Data store with localStorage persistence
├── utils/
│   └── format.ts         # Formatting, color, and utility helpers
├── components/
│   ├── layout/
│   │   └── Layout.tsx    # Responsive sidebar + top toolbar
│   └── map/
│       └── HazardMap.tsx # Leaflet map with dark theme + legend
└── pages/
    ├── LandingPage.tsx
    ├── DashboardPage.tsx
    ├── SafeRoutePage.tsx
    ├── RoadIntelligencePage.tsx
    ├── ReportPage.tsx
    ├── IncidentDetailPage.tsx
    └── MaintenancePage.tsx
```

---

## 🗺 Demo Dataset

18 synthetic road incidents across central Delhi:
- Pre-monsoon pothole and open manhole observations
- Current waterlogging reports (Minto Bridge, Ring Road, ITO, Pragati Maidan)
- **4 hidden hazard correlations** with confidence scores
- 2 pre-configured route plans (Connaught Place → Lajpat Nagar, ITO → Connaught Place)
- Incidents in all lifecycle stages (Reported → Resolution Verified)

All coordinates reference real Delhi roads. Data is **entirely synthetic** and for demonstration only.

---

## 🔒 Design Principles

- **Transparency**: Every inferred hazard carries an explicit "not directly confirmed" disclaimer
- **No fake government integration**: "Forwarded for Review" status is clearly marked as a demo action with no real submission
- **Honest uncertainty**: Routes marked as "no known hazards" are explicitly distinguished from "verified safe"
- **Local-only demo**: No backend, no API keys, no personal data collected; all state persists in `localStorage`
- **Safety first**: Reporting form includes a prominent "report only when safely stopped" warning

---

## 🔄 Reset Demo Data

Click **"Reset Demo Data"** in the sidebar (desktop) or mobile nav to restore all incidents to the initial state. Useful for fresh demonstrations.

---

## ⚠ Disclaimers

- All data is synthetic demonstration data. Not real Delhi incident records.
- No government partnership exists. The "proposed integration" architecture is aspirational.
- Route risk scores are illustrative prototype calculations, not validated models.
- Evidence photos are placeholders. No authentic field evidence is shown.
- This demo does not contact any external service.

---

*Built as a hackathon prototype for the JalRakshak civic-tech concept.*
