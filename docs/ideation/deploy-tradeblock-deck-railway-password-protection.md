# Deploy Tradeblock AI Inflection 2025 Deck to Railway with Password Protection

**Slug:** deploy-tradeblock-deck-railway-password-protection
**Author:** Claude Code
**Date:** 2024-12-03
**Branch:** preflight/deploy-tradeblock-deck-railway-password
**Related:** web-decks-initial-handoff.md, CLAUDE.md

---

## 1) Intent & Assumptions

- **Task brief:** Deploy the Tradeblock AI Inflection 2025 investor pitch deck as a live web application to Railway, with basic password protection so that only people with a shared password can view the presentation.

- **Assumptions:**
  - User will create the GitHub repository before development begins
  - The existing `tradeblock-deck-v4.jsx` component is the source of truth for the deck
  - A single shared password is sufficient (no individual user accounts)
  - The deck needs to be viewable on any modern browser
  - Railway's free/hobby tier is acceptable for initial deployment
  - Custom domain is desired but not required for initial launch

- **Out of scope:**
  - Multi-deck routing (only deploying this single deck initially)
  - User registration/individual accounts
  - Analytics/tracking of who viewed the deck
  - Video asset integration (placeholders remain for now)
  - Shared component library extraction (using inline components from v4.jsx)

---

## 2) Pre-reading Log

- `CLAUDE.md`: Comprehensive project architecture doc. Defines shared component patterns, design system (tokens, colors, typography), directory structure (`decks/[entity]/[deck-name]/`), animation presets, and deployment strategies. Uses STM for task management.

- `web-decks-initial-handoff.md`: Deck-specific handoff doc. 13-slide structure documented, remaining TODOs listed (calendar link, demo videos), content reference with key metrics, testing checklist provided.

- `tradeblock-deck-v4.jsx`: Self-contained ~60KB React component. Uses React 18, Framer Motion for scroll animations. Defines inline: Section, RevealText, DemoPlaceholder, ProgressBar, NavDots, PhaseStatus, Roadmap, CompanyCard, AnalyticsCard. Exports single `TradeblockDeckV4` default export. Uses Tailwind CSS classes throughout.

- `.gitignore`: Minimal - only contains `node_modules/` currently.

- Repository state: No package.json, no Next.js setup yet. Essentially just source files + documentation.

---

## 3) Codebase Map

- **Primary components/modules:**
  - `/tradeblock-deck-v4.jsx` - Main deck component (production)
  - `/tradeblock-deck-v4-preview.jsx` - Preview version (not needed for deployment)

- **Shared dependencies (to be installed):**
  - `react` ^18.2.0
  - `react-dom` ^18.2.0
  - `framer-motion` ^10.16.0
  - `next` ^14.x or ^15.x
  - `tailwindcss` ^3.3.0
  - `iron-session` ^8.x (for password protection)

- **Data flow:**
  - Static content → React component → Framer Motion animations → Browser render
  - Password form → API route → iron-session cookie → Middleware check → Deck render

- **Feature flags/config:**
  - `DECK_PASSWORD` - Environment variable for shared password
  - `SESSION_SECRET` - Environment variable for iron-session encryption

- **Potential blast radius:**
  - Minimal - new project, no existing infrastructure to break
  - Password protection middleware will wrap all routes

---

## 4) Root Cause Analysis

*N/A - This is a new feature implementation, not a bug fix.*

---

## 5) Research Findings

### Railway Deployment

**Key findings:**
- Zero-configuration Next.js support with automatic detection
- $5/month Hobby plan (includes $5 usage credit, typically covers light usage)
- GitHub integration for automatic deployments on push
- Automatic SSL certificates for custom domains
- Environment variables configurable via dashboard or CLI
- Typical build: 2-3 minutes for Next.js apps

**Deployment workflow:**
1. Connect GitHub repository to Railway
2. Railway auto-detects Next.js, runs `npm install` and `npm run build`
3. Deploys to `*.up.railway.app` domain
4. Optional: Add custom domain via CNAME record

### Password Protection Approaches

| Approach | Complexity | UX | Security | Persistence | Railway Compatible |
|----------|------------|----|-----------|--------------|--------------------|
| **iron-session** | Low | Excellent | High | Configurable | Yes |
| HTTP Basic Auth | Very Low | Poor | Medium | Browser session | Yes |
| NextAuth.js Credentials | Medium | Good | High | Configurable | Yes |
| Custom cookie/middleware | Medium | Good | Medium | Configurable | Yes |

### Recommendation: iron-session

**Why iron-session is the best fit:**

1. **Simple API** - Just 2-3 functions to learn
2. **Encrypted cookies** - Production-grade security with no database required
3. **Custom login page** - Professional branded experience for investors
4. **Session persistence** - User stays logged in (configurable TTL)
5. **Next.js middleware compatible** - Can protect all routes globally
6. **Zero database** - Stateless, perfect for Railway's pricing model

**Implementation overview:**
```
User visits site → Middleware checks session cookie →
  If valid: Render deck
  If invalid: Redirect to /login → User enters password →
    API validates → Creates encrypted session cookie → Redirect to deck
```

**Estimated implementation time:** 3-4 hours

---

## 6) Clarifications

The following decisions would help refine the implementation:

### 1. Password Configuration
**Question:** How should the password be set?
- **Option A:** Single environment variable (`DECK_PASSWORD=yourpassword`)
- **Option B:** Multiple passwords allowed (comma-separated in env var)
- **Recommendation:** Option A for simplicity

### 2. Session Duration
**Question:** How long should users stay logged in before needing to re-enter the password?
- **Option A:** Until browser closes (session cookie)
- **Option B:** 24 hours
- **Option C:** 7 days
- **Option D:** 30 days
- **Recommendation:** Option C (7 days) - convenient for investors reviewing multiple times

### 3. Login Page Branding
**Question:** What should the password page look like?
- **Option A:** Minimal - just password field and submit button
- **Option B:** Branded - Tradeblock logo, brief "Enter password to view" message
- **Option C:** Custom message - explain context, maybe your contact info
- **Recommendation:** Option B - professional but not over-designed

### 4. Custom Domain
**Question:** Do you have a custom domain in mind?
- **Option A:** Use Railway's default `*.up.railway.app` domain initially
- **Option B:** Set up custom domain immediately (you'd need to own/configure DNS)
- **Recommendation:** Option A initially, add custom domain later

### 5. GitHub Repository Name
**Question:** What should the GitHub repository be named?
- Suggestions: `tradeblock-deck`, `web-decks`, `pitch-decks`, `tradeblock-ai-pitch`
- This affects the Railway project name and default URL

### 6. Error Handling
**Question:** What happens when someone enters the wrong password?
- **Option A:** Simple "Invalid password" message, retry allowed
- **Option B:** Rate limiting after 5 failed attempts (15-minute lockout)
- **Recommendation:** Option A initially (Option B adds complexity)

---

## 7) Proposed Architecture

```
web-decks/
├── app/
│   ├── layout.tsx              # Root layout with fonts
│   ├── page.tsx                # Main deck page (protected)
│   ├── login/
│   │   └── page.tsx            # Password entry form
│   └── api/
│       └── auth/
│           └── route.ts        # Password validation endpoint
├── components/
│   └── TradeblockDeck.tsx      # Migrated from tradeblock-deck-v4.jsx
├── lib/
│   └── session.ts              # iron-session configuration
├── middleware.ts               # Route protection
├── public/
│   └── (assets if any)
├── styles/
│   └── globals.css             # Tailwind + fonts
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── .env.local                  # DECK_PASSWORD, SESSION_SECRET
```

---

## 8) Implementation Tasks (High-Level)

1. **Project Setup**
   - Initialize Next.js 14 project with TypeScript
   - Configure Tailwind CSS
   - Install dependencies (framer-motion, iron-session)

2. **Migrate Deck Component**
   - Convert tradeblock-deck-v4.jsx to TypeScript
   - Move to components/TradeblockDeck.tsx
   - Create app/page.tsx that renders the deck

3. **Implement Password Protection**
   - Set up iron-session configuration
   - Create login page (app/login/page.tsx)
   - Create auth API route (app/api/auth/route.ts)
   - Add middleware.ts for route protection

4. **Railway Deployment**
   - Push to GitHub repository
   - Connect repository to Railway
   - Configure environment variables
   - Verify deployment works

5. **Testing & Polish**
   - Test password flow end-to-end
   - Test on mobile devices
   - Verify animations work in production
   - Check Railway logs for any issues

---

## 9) Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Framer Motion SSR issues | Medium | Use 'use client' directive, dynamic imports if needed |
| Password leaked in URL | Low | Use POST for auth, never pass password in query params |
| Session cookie not persisting | Medium | Verify secure cookie settings for Railway's HTTPS |
| Railway cold starts | Low | Keep session cookies long-lived to reduce re-auth |

---

## Next Steps

1. User creates GitHub repository
2. Review and approve clarification decisions above
3. Generate detailed specification from this ideation
4. Execute implementation tasks
