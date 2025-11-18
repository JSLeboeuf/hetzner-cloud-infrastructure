-- =====================================================
-- AutoScale Facebook Automation - Schema Complet
-- Supabase PostgreSQL
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. CONTENT TEMPLATES (Bibliothèque de prompts)
-- =====================================================

CREATE TABLE content_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type TEXT NOT NULL CHECK (content_type IN ('case_study', 'statistic', 'tip', 'news', 'testimonial')),
  template_name TEXT NOT NULL,
  template_text TEXT NOT NULL,
  variables JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT TRUE,
  performance_score DECIMAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_content_templates_type ON content_templates(content_type);
CREATE INDEX idx_content_templates_active ON content_templates(active);

COMMENT ON TABLE content_templates IS 'Templates de contenu pour génération IA';

-- =====================================================
-- 2. CONTENT GENERATIONS (Historique génération)
-- =====================================================

CREATE TABLE content_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type TEXT NOT NULL,
  template_id UUID REFERENCES content_templates(id),
  variations JSONB NOT NULL, -- Array des 3 variations générées
  selected_variation INTEGER, -- 0, 1, ou 2
  custom_edits TEXT, -- Si modifié manuellement
  status TEXT DEFAULT 'pending_approval' CHECK (
    status IN ('pending_approval', 'approved', 'rejected', 'published', 'failed')
  ),
  workflow_id TEXT, -- Temporal workflow ID
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ
);

CREATE INDEX idx_content_generations_status ON content_generations(status);
CREATE INDEX idx_content_generations_type ON content_generations(content_type);
CREATE INDEX idx_content_generations_workflow ON content_generations(workflow_id);

COMMENT ON TABLE content_generations IS 'Historique de toutes les générations de contenu';

-- =====================================================
-- 3. GENERATED IMAGES (Images DALL-E)
-- =====================================================

CREATE TABLE generated_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  generation_id UUID REFERENCES content_generations(id),
  supabase_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  dalle_prompt TEXT NOT NULL,
  size TEXT DEFAULT '1792x1024',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_generated_images_generation ON generated_images(generation_id);

COMMENT ON TABLE generated_images IS 'Images générées par DALL-E 3';

-- =====================================================
-- 4. FACEBOOK POSTS (Posts publiés)
-- =====================================================

CREATE TABLE facebook_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id TEXT UNIQUE, -- Facebook post ID
  generation_id UUID REFERENCES content_generations(id),
  content TEXT NOT NULL,
  image_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (
    status IN ('pending', 'scheduled', 'published', 'failed')
  ),
  published_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_facebook_posts_status ON facebook_posts(status);
CREATE INDEX idx_facebook_posts_published ON facebook_posts(published_at);
CREATE UNIQUE INDEX idx_facebook_posts_id ON facebook_posts(post_id) WHERE post_id IS NOT NULL;

COMMENT ON TABLE facebook_posts IS 'Posts Facebook publiés ou planifiés';

-- =====================================================
-- 5. POST ANALYTICS (Métriques performance)
-- =====================================================

CREATE TABLE post_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES facebook_posts(id),
  facebook_post_id TEXT NOT NULL,
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  engagement_rate DECIMAL GENERATED ALWAYS AS (
    CASE
      WHEN impressions > 0 THEN ((likes + comments + shares)::DECIMAL / impressions * 100)
      ELSE 0
    END
  ) STORED,
  collected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_post_analytics_post ON post_analytics(post_id);
CREATE INDEX idx_post_analytics_engagement ON post_analytics(engagement_rate DESC);
CREATE INDEX idx_post_analytics_collected ON post_analytics(collected_at);

COMMENT ON TABLE post_analytics IS 'Métriques de performance des posts Facebook';

-- =====================================================
-- 6. AI PROMPTS (Prompts optimisés ML)
-- =====================================================

CREATE TABLE ai_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_type TEXT NOT NULL, -- 'claude_case_study', 'claude_statistic', 'dalle_image', etc.
  prompt_text TEXT NOT NULL,
  performance_score DECIMAL DEFAULT 0,
  version INTEGER DEFAULT 1,
  active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_prompts_type ON ai_prompts(prompt_type);
CREATE INDEX idx_ai_prompts_active ON ai_prompts(active);
CREATE INDEX idx_ai_prompts_performance ON ai_prompts(performance_score DESC);

COMMENT ON TABLE ai_prompts IS 'Prompts IA avec scores de performance (ML optimization)';

-- =====================================================
-- 7. APPROVAL QUEUE (Dashboard approbation)
-- =====================================================

CREATE TABLE approval_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  generation_id UUID REFERENCES content_generations(id),
  workflow_id TEXT NOT NULL,
  variations JSONB NOT NULL,
  image_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'rejected')
  ),
  approved_by TEXT, -- User email
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_approval_queue_status ON approval_queue(status);
CREATE INDEX idx_approval_queue_workflow ON approval_queue(workflow_id);

COMMENT ON TABLE approval_queue IS 'Queue d\'approbation pour dashboard';

-- =====================================================
-- 8. ML INSIGHTS (Analytics ML)
-- =====================================================

CREATE TABLE ml_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  insight_type TEXT NOT NULL, -- 'best_time', 'best_hashtags', 'best_style', etc.
  content_type TEXT,
  insight_data JSONB NOT NULL,
  confidence_score DECIMAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ml_insights_type ON ml_insights(insight_type);
CREATE INDEX idx_ml_insights_confidence ON ml_insights(confidence_score DESC);

COMMENT ON TABLE ml_insights IS 'Insights générés par ML pour optimization';

-- =====================================================
-- 9. SYSTEM LOGS (Audit trail)
-- =====================================================

CREATE TABLE system_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  log_level TEXT NOT NULL CHECK (log_level IN ('info', 'warn', 'error')),
  component TEXT NOT NULL, -- 'workflow', 'activity', 'api', etc.
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_system_logs_level ON system_logs(log_level);
CREATE INDEX idx_system_logs_created ON system_logs(created_at DESC);

COMMENT ON TABLE system_logs IS 'Logs système pour debugging et audit';

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Policies: service_role a accès complet
CREATE POLICY "Service role has full access" ON content_templates FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role has full access" ON content_generations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role has full access" ON generated_images FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role has full access" ON facebook_posts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role has full access" ON post_analytics FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role has full access" ON ai_prompts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role has full access" ON approval_queue FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role has full access" ON ml_insights FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role has full access" ON system_logs FOR ALL USING (auth.role() = 'service_role');

-- Policies: authenticated users (dashboard) ont accès lecture
CREATE POLICY "Authenticated users can read" ON approval_queue FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read" ON facebook_posts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read" ON post_analytics FOR SELECT USING (auth.role() = 'authenticated');

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function: Mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_content_templates_updated_at
  BEFORE UPDATE ON content_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_prompts_updated_at
  BEFORE UPDATE ON ai_prompts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================

-- Bucket pour images générées (si pas déjà créé)
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-images', 'generated-images', TRUE)
ON CONFLICT DO NOTHING;

-- Policy storage: service_role peut upload
CREATE POLICY "Service role can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'generated-images' AND auth.role() = 'service_role');

CREATE POLICY "Public can read images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'generated-images');

-- =====================================================
-- SEED DATA (Prompts par défaut)
-- =====================================================

INSERT INTO ai_prompts (prompt_type, prompt_text, version, active) VALUES
(
  'claude_case_study',
  'Crée un post Facebook engageant présentant une étude de cas réelle d''une PME québécoise qui a amélioré sa gestion d''appels avec une réceptionniste IA. Focus sur les résultats concrets (% d''appels manqués réduits, temps économisé, revenus générés). Ton professionnel mais accessible.',
  1,
  TRUE
),
(
  'claude_statistic',
  'Crée un post Facebook basé sur une statistique percutante sur les appels manqués dans les PME québécoises (ex: "72% des PME ratent 30% de leurs appels"). Lier à la solution (réceptionniste IA 24/7). Inclure question engageante.',
  1,
  TRUE
),
(
  'claude_tip',
  'Crée un post Facebook offrant un conseil pratique aux PME québécoises pour améliorer leur service client téléphonique. Format: problème commun → astuce simple → bénéfice concret. Ton aidant et expert.',
  1,
  TRUE
);

COMMENT ON TABLE ai_prompts IS 'Prompts optimisés avec ML - version initiale';

-- =====================================================
-- VIEWS (Analytics rapides)
-- =====================================================

CREATE VIEW v_post_performance AS
SELECT
  fp.id,
  fp.post_id AS facebook_post_id,
  fp.content,
  fp.published_at,
  pa.reach,
  pa.impressions,
  pa.likes,
  pa.comments,
  pa.shares,
  pa.engagement_rate,
  cg.content_type,
  cg.selected_variation
FROM facebook_posts fp
LEFT JOIN post_analytics pa ON fp.id = pa.post_id
LEFT JOIN content_generations cg ON fp.generation_id = cg.id
WHERE fp.status = 'published'
ORDER BY fp.published_at DESC;

COMMENT ON VIEW v_post_performance IS 'Vue rapide des performances posts';

-- =====================================================
-- MATERIALIZED VIEW (Analytics ML)
-- =====================================================

CREATE MATERIALIZED VIEW mv_content_performance AS
SELECT
  cg.content_type,
  cg.selected_variation,
  COUNT(*) AS total_posts,
  AVG(pa.engagement_rate) AS avg_engagement_rate,
  AVG(pa.reach) AS avg_reach,
  SUM(pa.likes + pa.comments + pa.shares) AS total_interactions
FROM content_generations cg
JOIN facebook_posts fp ON cg.id = fp.generation_id
JOIN post_analytics pa ON fp.id = pa.post_id
WHERE fp.status = 'published'
GROUP BY cg.content_type, cg.selected_variation
ORDER BY avg_engagement_rate DESC;

-- Index pour refresh rapide
CREATE UNIQUE INDEX idx_mv_content_perf ON mv_content_performance(content_type, selected_variation);

COMMENT ON MATERIALIZED VIEW mv_content_performance IS 'Performance agrégée par type/variation (refresh quotidien)';

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Service role a tous les droits (backend)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Authenticated users (dashboard) peuvent lire
GRANT SELECT ON approval_queue, facebook_posts, post_analytics, v_post_performance TO authenticated;

-- =====================================================
-- FINAL COMMENTS
-- =====================================================

COMMENT ON SCHEMA public IS 'AutoScale Facebook Automation - Schema complet optimisé pour Temporal workflows + ML analytics';

-- Migration complète ✅
