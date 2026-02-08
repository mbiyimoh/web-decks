# Implementation Guide — Mission Control Dashboard

## Quick Setup (5 min)

### 1. Copy Files

```bash
# From your 33strategies repo root
mkdir -p app/admin/components
cp handoff/components/*.{ts,tsx,jsx} app/admin/components/
```

### 2. Create Route

```tsx
// app/admin/page.tsx
import AdminDashboard from './components/AdminDashboard';

export default function AdminPage() {
  return <AdminDashboard />;
}
```

### 3. Add Layout (Optional - for auth protection)

```tsx
// app/admin/layout.tsx
import { redirect } from 'next/navigation';
// Add your auth check here

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // const session = await getSession();
  // if (!session) redirect('/login');
  
  return <>{children}</>;
}
```

### 4. Test

```bash
npm run dev
# Visit http://localhost:3000/admin
```

---

## Phase 1: Static Dashboard (Current)

The dashboard currently works with mock data in `data.ts`. This is intentional for:
- Validating the UI with real pipeline data
- Getting feedback before database work
- Deploying quickly for Emily to use

**To update data:** Edit `data.ts` manually. This is fine for MVP.

---

## Phase 2: Supabase Integration

### Database Tables

```sql
-- clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT,
  color TEXT DEFAULT '#D4A84B',
  contact_name TEXT,
  contact_role TEXT,
  contact_email TEXT,
  website TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- pipeline table (tracks stage progression)
CREATE TABLE pipeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('intent', 'funnel', 'closed')) NOT NULL,
  current_stage TEXT,
  stage_index INTEGER DEFAULT 0,
  value INTEGER, -- in dollars
  potential_value INTEGER,
  priority_strategic INTEGER CHECK (priority_strategic BETWEEN 1 AND 10),
  priority_value INTEGER CHECK (priority_value BETWEEN 1 AND 10),
  priority_readiness INTEGER CHECK (priority_readiness BETWEEN 1 AND 10),
  priority_timeline INTEGER CHECK (priority_timeline BETWEEN 1 AND 10),
  priority_bandwidth INTEGER CHECK (priority_bandwidth BETWEEN 1 AND 10),
  next_action TEXT,
  next_action_date DATE,
  days_in_stage INTEGER DEFAULT 0,
  decision TEXT CHECK (decision IN ('yes', 'no', 'pending')),
  discovery_complete BOOLEAN DEFAULT FALSE,
  assessment_complete BOOLEAN DEFAULT FALSE,
  readiness_percent INTEGER DEFAULT 0,
  is_new BOOLEAN DEFAULT TRUE,
  closed_date DATE,
  closed_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- stage_history table (audit trail)
CREATE TABLE stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID REFERENCES pipeline(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  notes TEXT,
  documents TEXT[], -- array of file names
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- team_capacity table
CREATE TABLE team_capacity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_name TEXT NOT NULL,
  role TEXT,
  color TEXT,
  utilization INTEGER DEFAULT 0,
  allocations JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Data Fetching

Replace mock data imports with Supabase queries:

```tsx
// app/admin/components/data.ts
import { createClient } from '@/utils/supabase/client';

export async function getIntentClients() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('pipeline')
    .select(`
      *,
      client:clients(*)
    `)
    .eq('status', 'intent')
    .order('updated_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function getFunnelClients() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('pipeline')
    .select(`
      *,
      client:clients(*)
    `)
    .eq('status', 'funnel')
    .order('is_new', { ascending: false })
    .order('updated_at', { ascending: false });
  
  if (error) throw error;
  return data;
}
```

### Server Component Pattern

```tsx
// app/admin/page.tsx
import { getIntentClients, getFunnelClients, getTeam } from './data';
import AdminDashboard from './components/AdminDashboard';

export default async function AdminPage() {
  const [intentClients, funnelClients, team] = await Promise.all([
    getIntentClients(),
    getFunnelClients(),
    getTeam()
  ]);
  
  return (
    <AdminDashboard 
      intentClients={intentClients}
      funnelClients={funnelClients}
      team={team}
    />
  );
}
```

---

## Phase 3: AI Enrichment

### Integration Points

1. **On new prospect creation:**
   - Trigger web search for company info
   - Use P33K patterns for data extraction
   - Store confidence scores per field

2. **Enrichment API route:**

```tsx
// app/api/enrich/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { clientId, companyName, website } = await req.json();
  
  // Call your AI enrichment service
  // This could use Claude API, web scraping, LinkedIn, etc.
  
  const enrichment = {
    companyInfo: { score: 85, status: 'verified', notes: '...' },
    contactInfo: { score: 60, status: 'partial', notes: '...' },
    // ...
  };
  
  // Update database
  // await supabase.from('pipeline').update({ confidence: enrichment })...
  
  return NextResponse.json({ success: true, enrichment });
}
```

---

## Phase 4: Real-time Updates

### Supabase Realtime

```tsx
// In your dashboard component
useEffect(() => {
  const supabase = createClient();
  
  const channel = supabase
    .channel('pipeline-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'pipeline' },
      (payload) => {
        // Refresh data or update local state
        console.log('Pipeline changed:', payload);
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

---

## Converting to Tailwind

The current implementation uses inline styles for portability. To convert to Tailwind:

### Design Tokens → Tailwind Config

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        '33-bg': '#111111',
        '33-surface': '#1a1a1a',
        '33-border': '#27272a',
        '33-gold': '#D4A84B',
        '33-gold-dim': 'rgba(212, 168, 75, 0.15)',
        '33-green': '#4ADE80',
        '33-green-dim': 'rgba(74, 222, 128, 0.15)',
      }
    }
  }
}
```

### Example Conversion

```tsx
// Before (inline)
<div style={{ 
  backgroundColor: '#1a1a1a', 
  border: '1px solid #27272a',
  borderRadius: '12px',
  padding: '20px'
}}>

// After (Tailwind)
<div className="bg-33-surface border border-33-border rounded-xl p-5">
```

---

## Authentication Options

### Option 1: Password-Protected (like web decks)

```tsx
// app/admin/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  const cookieStore = cookies();
  const session = cookieStore.get('admin-session');
  
  if (!session) {
    redirect('/admin/login');
  }
  
  return <AdminDashboard />;
}
```

### Option 2: Supabase Auth

```tsx
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();
  
  if (req.nextUrl.pathname.startsWith('/admin') && !session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  return res;
}
```

---

## Deployment

### Railway (recommended)

The dashboard uses the same stack as web decks. Deploy like any Next.js app:

```bash
# In your repo
railway link
railway up
```

### Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
ADMIN_PASSWORD=your-admin-password  # if using simple auth
```

---

## Testing Checklist

- [ ] Dashboard loads with mock data
- [ ] Click on client opens modal
- [ ] Intake flow works (3 steps)
- [ ] Closed section expands/collapses
- [ ] Team capacity cards render
- [ ] Mobile responsive (tables scroll)
- [ ] Dark theme renders correctly (no white backgrounds!)

---

## Known Issues / TODOs

1. **Stage popup** — Original HTML had click-to-expand stage details. Simplified in this version.
2. **Journey timeline** — Full journey with documents not implemented in modal yet.
3. **User switcher** — Header shows Emily, but no actual user switching.
4. **AI enrichment** — UI exists, backend integration needed.

---

## Questions?

Ping Beems or check the project instructions in Claude.
