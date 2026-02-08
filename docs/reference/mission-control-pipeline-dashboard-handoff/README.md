# 33 Strategies Mission Control Dashboard — Handoff Package

## Overview

This package contains everything needed to implement the Mission Control admin dashboard in the 33 Strategies production repository.

**What it is:** An internal pipeline management tool for tracking prospects through the sales funnel, team capacity, and client intake workflows.

**Key features:**
- Intent → Money pipeline tracking with 8-stage sales journey
- Top of Funnel prospect management with AI enrichment confidence scores
- New client intake workflow (Granola, Clarity Canvas, manual, portal)
- Team capacity visualization
- Closed/Lost deal tracking for learning

---

## File Structure

```
handoff/
├── README.md                    # This file
├── IMPLEMENTATION_GUIDE.md      # Step-by-step setup instructions
├── components/
│   ├── AdminDashboard.tsx       # Main dashboard component (TypeScript)
│   ├── types.ts                 # TypeScript interfaces
│   └── data.ts                  # Mock data (replace with real data source)
├── styles/
│   └── dashboard.css            # Optional external CSS
└── api/
    └── schema.md                # Database schema recommendations
```

---

## Quick Start

1. Copy `components/` to your app's components directory
2. Add route for `/admin` or `/mission-control`
3. Replace mock data in `data.ts` with Supabase queries
4. Deploy

---

## Tech Stack Alignment

This dashboard is built for your existing stack:
- **Next.js 14** (App Router)
- **TypeScript**
- **Supabase** (for data persistence)
- **Railway** (deployment)

The prototype uses inline styles for portability. Production version can use your existing Tailwind setup.

---

## Design System Compliance

All colors, typography, and spacing follow the 33 Strategies Design System:
- Background: `#111111` (primary), `#1a1a1a` (surface)
- Gold accent: `#D4A84B`
- Fonts: DM Sans (body), Space Mono (data)
- See `33_Strategies_Design_System.md` for full reference

---

## Data Flow

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Client Intake  │────▶│   Supabase   │────▶│   Dashboard     │
│  (Form/Import)  │     │   Database   │     │   (Read/Write)  │
└─────────────────┘     └──────────────┘     └─────────────────┘
                              │
                              ▼
                        ┌──────────────┐
                        │  AI Enrichment│
                        │  (Optional)   │
                        └──────────────┘
```

---

## Priority Implementation Order

1. **Phase 1:** Static dashboard with mock data (validate UI)
2. **Phase 2:** Supabase integration (CRUD operations)
3. **Phase 3:** AI enrichment pipeline (P33K integration)
4. **Phase 4:** Real-time updates & notifications

---

## Questions for Implementation

Before starting, clarify:
1. Where should this live? (`/admin`, `/mission-control`, `/dashboard`?)
2. Authentication: Use existing auth or add role-based access?
3. Who has access? (Beems, Emily, both?)
4. Should it be password-protected like web decks?

---

## Files in This Package

| File | Purpose |
|------|---------|
| `AdminDashboard.tsx` | Main React component with all UI |
| `types.ts` | TypeScript interfaces for clients, deals, team |
| `data.ts` | Mock data matching current pipeline |
| `dashboard.css` | Optional CSS if you prefer external styles |
| `schema.md` | Supabase table recommendations |
| `IMPLEMENTATION_GUIDE.md` | Detailed setup instructions |
