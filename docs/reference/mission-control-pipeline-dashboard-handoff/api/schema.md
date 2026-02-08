# Database Schema — Mission Control

## Overview

This schema supports the Mission Control dashboard with full pipeline tracking, AI enrichment, and team capacity management.

Designed for **Supabase (PostgreSQL)**.

---

## Core Tables

### 1. clients

Stores company/contact information separate from pipeline status.

```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  name TEXT NOT NULL,
  industry TEXT,
  color TEXT DEFAULT '#D4A84B',  -- For UI avatars
  website TEXT,
  
  -- Primary Contact
  contact_name TEXT,
  contact_role TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contact_linkedin TEXT,
  
  -- Additional Contacts (JSONB array)
  additional_contacts JSONB DEFAULT '[]',
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Index for search
CREATE INDEX idx_clients_name ON clients USING gin(to_tsvector('english', name));
```

### 2. pipeline

Tracks each client's position in the sales funnel.

```sql
CREATE TYPE pipeline_status AS ENUM ('intent', 'funnel', 'closed');
CREATE TYPE pipeline_decision AS ENUM ('yes', 'no', 'pending');
CREATE TYPE stage_id AS ENUM ('lead', 'discovery', 'assessment', 'proposal', 'negotiation', 'contract', 'payment', 'kickoff');

CREATE TABLE pipeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  -- Status
  status pipeline_status NOT NULL DEFAULT 'funnel',
  decision pipeline_decision DEFAULT 'pending',
  decision_reason TEXT,  -- If decision is 'no'
  
  -- Stage Tracking (for Intent clients)
  current_stage stage_id DEFAULT 'lead',
  stage_index INTEGER DEFAULT 0,
  stage_entered_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Values
  value INTEGER,           -- Confirmed contract value (Intent)
  potential_value INTEGER, -- Estimated value (Funnel)
  
  -- Priority Scores (1-10)
  score_strategic INTEGER CHECK (score_strategic BETWEEN 1 AND 10) DEFAULT 5,
  score_value INTEGER CHECK (score_value BETWEEN 1 AND 10) DEFAULT 5,
  score_readiness INTEGER CHECK (score_readiness BETWEEN 1 AND 10) DEFAULT 5,
  score_timeline INTEGER CHECK (score_timeline BETWEEN 1 AND 10) DEFAULT 5,
  score_bandwidth INTEGER CHECK (score_bandwidth BETWEEN 1 AND 10) DEFAULT 5,
  
  -- Funnel Progress
  discovery_complete BOOLEAN DEFAULT FALSE,
  assessment_complete BOOLEAN DEFAULT FALSE,
  readiness_percent INTEGER DEFAULT 0 CHECK (readiness_percent BETWEEN 0 AND 100),
  
  -- Actions
  next_action TEXT,
  next_action_date DATE,
  
  -- Flags
  is_new BOOLEAN DEFAULT TRUE,
  product_focus TEXT,  -- SP33D, P33K, M33T, etc.
  
  -- Closed Deal Info
  closed_at TIMESTAMPTZ,
  closed_reason TEXT,
  closed_reason_detail TEXT,
  lessons_learned TEXT,
  reengage_date DATE,
  reengage_notes TEXT,
  
  -- Intake Info
  intake_method TEXT CHECK (intake_method IN ('granola', 'canvas', 'manual', 'portal')),
  intake_date DATE,
  portal_link TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Computed column for days in stage
CREATE OR REPLACE FUNCTION days_in_current_stage(pipeline)
RETURNS INTEGER AS $$
  SELECT EXTRACT(DAY FROM NOW() - $1.stage_entered_at)::INTEGER;
$$ LANGUAGE SQL STABLE;

-- Index for status queries
CREATE INDEX idx_pipeline_status ON pipeline(status);
CREATE INDEX idx_pipeline_client ON pipeline(client_id);
```

### 3. stage_history

Audit trail of stage progression with documents.

```sql
CREATE TABLE stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID REFERENCES pipeline(id) ON DELETE CASCADE NOT NULL,
  
  -- Stage Info
  stage stage_id NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  
  -- Details
  date DATE,
  notes TEXT,
  duration TEXT,  -- e.g., "45 min" for calls
  
  -- Links
  proposal_link TEXT,
  proposal_password TEXT,
  
  -- Documents (file references)
  documents TEXT[] DEFAULT '{}',
  
  -- Signing (for contract stage)
  signed_date DATE,
  
  -- Payment (for payment stage)
  payment_method TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stage_history_pipeline ON stage_history(pipeline_id);
```

### 4. ai_enrichment

Stores AI research results and confidence scores.

```sql
CREATE TYPE confidence_level AS ENUM ('high', 'medium', 'low', 'unknown');
CREATE TYPE enrichment_status AS ENUM ('pending', 'running', 'complete', 'failed');

CREATE TABLE ai_enrichment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  -- Overall Status
  status enrichment_status DEFAULT 'pending',
  last_run TIMESTAMPTZ,
  
  -- Confidence Scores (JSONB for flexibility)
  confidence JSONB DEFAULT '{
    "overall": "unknown",
    "companyInfo": {"score": 0, "status": "unknown", "notes": ""},
    "contactInfo": {"score": 0, "status": "unknown", "notes": ""},
    "problemFit": {"score": 0, "status": "unknown", "notes": ""},
    "budget": {"score": 0, "status": "unknown", "notes": ""},
    "timeline": {"score": 0, "status": "unknown", "notes": ""}
  }',
  
  -- Findings (JSONB for flexible schema)
  findings JSONB DEFAULT '{}',
  
  -- Suggested Actions
  suggested_actions TEXT[] DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_enrichment_client ON ai_enrichment(client_id);
```

### 5. team_capacity

Team member allocations and utilization.

```sql
CREATE TABLE team_capacity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Member Info
  name TEXT NOT NULL,
  role TEXT,
  color TEXT DEFAULT '#3b82f6',
  
  -- Utilization
  utilization INTEGER DEFAULT 0 CHECK (utilization BETWEEN 0 AND 100),
  
  -- Allocations (JSONB array)
  allocations JSONB DEFAULT '[]',
  -- Format: [{"client": "TradeBlock", "percent": 35}, ...]
  
  -- Metadata
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Views

### pipeline_with_client

Joins pipeline with client info for easy querying.

```sql
CREATE VIEW pipeline_with_client AS
SELECT 
  p.*,
  c.name AS client_name,
  c.industry,
  c.color,
  c.website,
  c.contact_name,
  c.contact_role,
  c.contact_email,
  e.confidence,
  e.findings,
  e.suggested_actions,
  EXTRACT(DAY FROM NOW() - p.stage_entered_at)::INTEGER AS days_in_stage,
  (
    p.score_strategic * 0.2 +
    p.score_value * 0.2 +
    p.score_readiness * 0.2 +
    p.score_timeline * 0.2 +
    p.score_bandwidth * 0.2
  ) AS priority_score
FROM pipeline p
JOIN clients c ON p.client_id = c.id
LEFT JOIN ai_enrichment e ON c.id = e.client_id;
```

### pipeline_stats

Aggregate statistics for the dashboard header.

```sql
CREATE VIEW pipeline_stats AS
SELECT
  COUNT(*) FILTER (WHERE status = 'intent') AS intent_count,
  COALESCE(SUM(value) FILTER (WHERE status = 'intent'), 0) AS intent_value,
  COUNT(*) FILTER (WHERE status = 'funnel') AS funnel_count,
  COALESCE(SUM(potential_value) FILTER (WHERE status = 'funnel'), 0) AS funnel_value,
  COUNT(*) FILTER (WHERE status = 'closed') AS closed_count,
  COALESCE(SUM(value) FILTER (WHERE status = 'closed'), 0) AS closed_value
FROM pipeline;
```

---

## Row Level Security (RLS)

Enable RLS for multi-user access:

```sql
-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_enrichment ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_capacity ENABLE ROW LEVEL SECURITY;

-- For now, allow all authenticated users full access
-- (Beems and Emily are the only users)
CREATE POLICY "Allow authenticated users" ON clients
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users" ON pipeline
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users" ON stage_history
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users" ON ai_enrichment
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users" ON team_capacity
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

---

## Triggers

### Auto-update timestamps

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_pipeline_updated_at
  BEFORE UPDATE ON pipeline
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Reset stage timer on stage change

```sql
CREATE OR REPLACE FUNCTION reset_stage_entered_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_stage != OLD.current_stage THEN
    NEW.stage_entered_at = NOW();
    NEW.stage_index = CASE NEW.current_stage
      WHEN 'lead' THEN 0
      WHEN 'discovery' THEN 1
      WHEN 'assessment' THEN 2
      WHEN 'proposal' THEN 3
      WHEN 'negotiation' THEN 4
      WHEN 'contract' THEN 5
      WHEN 'payment' THEN 6
      WHEN 'kickoff' THEN 7
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reset_stage_on_change
  BEFORE UPDATE ON pipeline
  FOR EACH ROW EXECUTE FUNCTION reset_stage_entered_at();
```

---

## Sample Queries

### Get Intent Pipeline (sorted by priority)

```sql
SELECT * FROM pipeline_with_client
WHERE status = 'intent'
ORDER BY priority_score DESC;
```

### Get Funnel (new first, then by priority)

```sql
SELECT * FROM pipeline_with_client
WHERE status = 'funnel'
ORDER BY is_new DESC, priority_score DESC;
```

### Get Closed Deals with Lessons

```sql
SELECT 
  p.*,
  c.name,
  c.industry
FROM pipeline p
JOIN clients c ON p.client_id = c.id
WHERE p.status = 'closed'
ORDER BY p.closed_at DESC;
```

### Dashboard Header Stats

```sql
SELECT * FROM pipeline_stats;
```

---

## Migration from Mock Data

To import existing data from `data.ts`:

```sql
-- Example: Insert TradeBlock
INSERT INTO clients (name, industry, color, contact_name, contact_role)
VALUES ('TradeBlock', 'Sneaker Tech', '#22c55e', 'Mbiyimoh Ghogomu', 'CEO');

INSERT INTO pipeline (
  client_id, status, current_stage, stage_index, value,
  score_strategic, score_value, score_readiness, score_timeline, score_bandwidth,
  next_action, next_action_date
)
SELECT 
  id, 'intent', 'kickoff', 7, 50000,
  9, 8, 9, 8, 7,
  'Monthly check-in scheduled', '2025-01-05'
FROM clients WHERE name = 'TradeBlock';
```

Or use the Supabase dashboard to import JSON directly.
