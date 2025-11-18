-- Table pour stocker les guides et recherches marketing
-- À exécuter dans Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/gpcxsxxgdeqeewznditi

CREATE TABLE IF NOT EXISTS marketing_content (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT,
    type TEXT,
    file_path TEXT,
    content TEXT NOT NULL,
    word_count INTEGER,
    tags TEXT[],
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_marketing_content_category ON marketing_content(category);
CREATE INDEX IF NOT EXISTS idx_marketing_content_type ON marketing_content(type);
CREATE INDEX IF NOT EXISTS idx_marketing_content_tags ON marketing_content USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_marketing_content_created_at ON marketing_content(created_at);

-- Index full-text search (français)
CREATE INDEX IF NOT EXISTS idx_marketing_content_search
ON marketing_content USING GIN (to_tsvector('french', content));

CREATE INDEX IF NOT EXISTS idx_marketing_content_title_search
ON marketing_content USING GIN (to_tsvector('french', title));

-- Commentaires
COMMENT ON TABLE marketing_content IS 'Contenu marketing et recherches psychologiques';
COMMENT ON COLUMN marketing_content.title IS 'Titre du contenu';
COMMENT ON COLUMN marketing_content.category IS 'Catégorie (ex: Marketing Psychology, Research)';
COMMENT ON COLUMN marketing_content.type IS 'Type de contenu (ex: Comprehensive Guide, Academic Research)';
COMMENT ON COLUMN marketing_content.content IS 'Contenu complet en markdown';
COMMENT ON COLUMN marketing_content.word_count IS 'Nombre de mots';
COMMENT ON COLUMN marketing_content.tags IS 'Tags pour classification';
COMMENT ON COLUMN marketing_content.metadata IS 'Métadonnées additionnelles (JSON)';
