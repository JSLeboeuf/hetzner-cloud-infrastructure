# 🗄️ Claude Code - Prompt Supabase Specialist

> Spécialisé dans les migrations et intégrations Supabase

---

## Mission

Gérer toutes les opérations Supabase pour `myriam-bp-emondage`:
- Migrations schema
- Tests d'intégration
- Row Level Security (RLS)
- Performance (indexes, queries)

## Schema Actuel

### Tables Principales

**`bp.leads`**:
```sql
id UUID PRIMARY KEY
nom_complet TEXT
telephone TEXT  -- Normalized +1XXXXXXXXXX
telephone_raw TEXT  -- Original input
adresse_complete TEXT
type_service TEXT
description TEXT
urgence BOOLEAN
status TEXT DEFAULT 'nouveau'
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

**`bp.calls`**:
```sql
id UUID PRIMARY KEY
lead_id UUID REFERENCES bp.leads(id)
call_sid TEXT
from_number TEXT
to_number TEXT
status TEXT
duration INTEGER
recording_url TEXT
transcript TEXT
created_at TIMESTAMPTZ
```

## Workflow Migration

### 1. Diagnostic
```bash
# Vérifier connexion
python -c "from api.db import get_supabase; print(get_supabase().table('bp.leads').select('*').limit(1).execute())"

# Lister tables
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres" \
  -c "\dt bp.*"
```

### 2. Créer Migration

**Fichier**: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`

```sql
-- Migration: Add missing columns
BEGIN;

-- Add column if not exists
ALTER TABLE bp.calls
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_calls_status ON bp.calls(status);

-- Add constraint
ALTER TABLE bp.calls
ADD CONSTRAINT chk_call_status
CHECK (status IN ('completed', 'failed', 'in-progress', 'no-answer'));

-- Add comment
COMMENT ON COLUMN bp.calls.status IS 'Call status: completed, failed, in-progress, no-answer';

COMMIT;
```

### 3. Tester en Local (si Supabase CLI)

```bash
# Start local Supabase
supabase start

# Apply migration
supabase db push

# Test
psql postgresql://postgres:postgres@localhost:54322/postgres \
  -c "SELECT status FROM bp.calls LIMIT 1;"
```

### 4. Documenter

**`supabase/README.md`**:
```markdown
## Migration YYYYMMDDHHMMSS_description

### Purpose
Add `status` column to track call outcomes

### Apply via Dashboard
1. Go to https://supabase.com/dashboard/project/[PROJECT_REF]/sql
2. Paste migration SQL
3. Run
4. Verify: `SELECT status FROM bp.calls LIMIT 1;`

### Apply via CLI
```bash
supabase db push
```

### Rollback
```sql
ALTER TABLE bp.calls DROP COLUMN IF EXISTS status;
```

### Tests Affected
- `tests/test_supabase_integration.py::test_call_status_tracking`
```

### 5. Adapter Tests

```python
# tests/test_supabase_integration.py

@pytest.mark.skipif(
    os.getenv("BP_SKIP_SUPABASE_TESTS") == "1",
    reason="Supabase tests disabled"
)
def test_call_status_tracking():
    """Verify status column exists and works"""
    supabase = get_supabase()

    # Insert test call
    result = supabase.table("bp.calls").insert({
        "call_sid": "test_123",
        "from_number": "+15141234567",
        "to_number": "+15149876543",
        "status": "completed"
    }).execute()

    assert result.data[0]["status"] == "completed"

    # Cleanup
    supabase.table("bp.calls").delete().eq("call_sid", "test_123").execute()
```

## Row Level Security (RLS)

### Enable RLS
```sql
-- Enable RLS on tables
ALTER TABLE bp.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE bp.calls ENABLE ROW LEVEL SECURITY;
```

### Policies

**Service Role (backend) - Full access**:
```sql
CREATE POLICY "Service role has full access"
ON bp.leads
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role has full access"
ON bp.calls
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

**Anon (public) - No access**:
```sql
-- No policies for anon = no access
```

**Authenticated Users - Read own data**:
```sql
CREATE POLICY "Users can read their own leads"
ON bp.leads
FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id::text);
```

## Performance

### Indexes Requis

```sql
-- Searches by phone
CREATE INDEX idx_leads_telephone ON bp.leads(telephone);

-- Searches by status
CREATE INDEX idx_leads_status ON bp.leads(status);

-- Join performance
CREATE INDEX idx_calls_lead_id ON bp.calls(lead_id);

-- Time-based queries
CREATE INDEX idx_leads_created_at ON bp.leads(created_at DESC);
CREATE INDEX idx_calls_created_at ON bp.calls(created_at DESC);
```

### Query Optimization

**❌ Inefficient**:
```python
# Fetches all, filters in Python
leads = supabase.table("bp.leads").select("*").execute()
active = [l for l in leads.data if l["status"] == "actif"]
```

**✅ Efficient**:
```python
# Filters in database
leads = supabase.table("bp.leads") \
    .select("*") \
    .eq("status", "actif") \
    .execute()
```

## Validation

### Schema Verification
```bash
# Check tables exist
python -c "
from api.db import get_supabase
s = get_supabase()
print('bp.leads:', len(s.table('bp.leads').select('id').limit(1).execute().data))
print('bp.calls:', len(s.table('bp.calls').select('id').limit(1).execute().data))
"
```

### RLS Verification
```sql
-- Should return rows (service_role)
SELECT * FROM bp.leads LIMIT 1;

-- Should return 0 rows (anon)
SET ROLE anon;
SELECT * FROM bp.leads LIMIT 1;
RESET ROLE;
```

### Performance Verification
```sql
-- Check index usage
EXPLAIN ANALYZE
SELECT * FROM bp.leads WHERE telephone = '+15141234567';

-- Should use idx_leads_telephone
```

## Checklist Migration

- [ ] Migration SQL créée dans `supabase/migrations/`
- [ ] Migration testée localement (ou dry-run)
- [ ] Documentation dans `supabase/README.md`
- [ ] Rollback SQL documenté
- [ ] Tests adaptés
- [ ] Indexes ajoutés si nécessaire
- [ ] RLS vérifié
- [ ] Performance validée

## Skip Flag

Pour tests Supabase:
```bash
export BP_SKIP_SUPABASE_TESTS=1
pytest
```

## Objectif

✅ Schema aligné avec tests
✅ Migrations documentées et appliquées
✅ RLS configuré correctement
✅ Performance optimisée (indexes)
✅ Tests passants ou skippables proprement
