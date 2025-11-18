#!/usr/bin/env python3
"""
Script pour sauvegarder les guides marketing dans Supabase.
"""

import sys
import subprocess
import json
from datetime import datetime
from pathlib import Path

# Install supabase if not available
try:
    from supabase import create_client
except ImportError:
    print("Installation de supabase...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "supabase", "--break-system-packages", "--quiet"])
    from supabase import create_client

# Supabase configuration
SUPABASE_URL = "https://gpcxsxxgdeqeewznditi.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwY3hzeHhnZGVxZWV3em5kaXRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg5NTg0MywiZXhwIjoyMDc3NDcxODQzfQ.WgInKkEK12hStkVCy1MhA0YCl7bsOvppUELU7W2rMP4"

# Fichiers à uploader
FILES = [
    {
        "path": "/home/developer/docs/marketing/psychologie-acheteurs-guide-complet.md",
        "title": "Guide Complet : Psychologie des Acheteurs et Marketing de Persuasion",
        "category": "Marketing Psychology",
        "type": "Comprehensive Guide",
        "tags": ["psychologie", "marketing", "persuasion", "neuromarketing", "cialdini", "influence"]
    },
    {
        "path": "/home/developer/docs/marketing/influence-subconsciente-recherche-complete.md",
        "title": "Recherche Complète : Influence Subconsciente et Manipulation Psychologique",
        "category": "Research",
        "type": "Academic Research Compilation",
        "tags": ["subliminal", "neuromarketing", "cognitive biases", "manipulation", "ai", "ethics", "2024-2025"]
    }
]

def create_table_if_not_exists(supabase):
    """Crée la table marketing_content si elle n'existe pas."""

    sql = """
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

    CREATE INDEX IF NOT EXISTS idx_marketing_content_category ON marketing_content(category);
    CREATE INDEX IF NOT EXISTS idx_marketing_content_type ON marketing_content(type);
    CREATE INDEX IF NOT EXISTS idx_marketing_content_tags ON marketing_content USING GIN(tags);
    CREATE INDEX IF NOT EXISTS idx_marketing_content_created_at ON marketing_content(created_at);

    CREATE INDEX IF NOT EXISTS idx_marketing_content_search
    ON marketing_content USING GIN (to_tsvector('french', content));

    CREATE INDEX IF NOT EXISTS idx_marketing_content_title_search
    ON marketing_content USING GIN (to_tsvector('french', title));
    """

    print("\n📋 Instructions pour créer la table:")
    print("=" * 70)
    print("1. Allez sur: https://supabase.com/dashboard/project/gpcxsxxgdeqeewznditi")
    print("2. Cliquez sur 'SQL Editor'")
    print("3. Créez une nouvelle query et collez ce SQL:")
    print("\n" + sql)
    print("\n" + "=" * 70)

    response = input("\n✅ Table créée? (y/n): ")
    return response.lower() == 'y'

def upload_file(supabase, file_info):
    """Upload un fichier dans Supabase."""

    print(f"\n📤 Upload: {file_info['title']}")
    print("-" * 70)

    # Lire le contenu
    file_path = Path(file_info['path'])
    if not file_path.exists():
        print(f"❌ Fichier non trouvé: {file_path}")
        return False

    content = file_path.read_text(encoding='utf-8')
    word_count = len(content.split())

    # Préparer les données
    data = {
        "title": file_info['title'],
        "category": file_info['category'],
        "type": file_info['type'],
        "file_path": str(file_path),
        "content": content,
        "word_count": word_count,
        "tags": file_info['tags'],
        "metadata": {
            "original_filename": file_path.name,
            "upload_date": datetime.now().isoformat(),
            "file_size_bytes": len(content.encode('utf-8')),
            "sections": content.count('##'),
            "h1_count": content.count('# '),
            "h2_count": content.count('## ')
        }
    }

    try:
        # Insérer dans Supabase
        response = supabase.table('marketing_content').insert(data).execute()

        print(f"✅ Upload réussi!")
        print(f"   - Mots: {word_count:,}")
        print(f"   - Taille: {len(content):,} caractères")
        print(f"   - Sections: {data['metadata']['sections']}")
        print(f"   - Tags: {', '.join(file_info['tags'])}")

        return True

    except Exception as e:
        print(f"❌ Erreur upload: {e}")
        return False

def main():
    """Fonction principale."""

    print("\n" + "=" * 70)
    print("🚀 UPLOAD GUIDES MARKETING VERS SUPABASE")
    print("=" * 70)

    # Se connecter à Supabase
    print("\n🔌 Connexion à Supabase...")
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    print("✅ Connecté!")

    # Vérifier/Créer la table
    print("\n📊 Vérification table marketing_content...")

    try:
        # Essayer de faire une query simple pour voir si la table existe
        supabase.table('marketing_content').select("id").limit(1).execute()
        print("✅ Table existe déjà!")
    except Exception as e:
        print("⚠️  Table n'existe pas encore.")
        if not create_table_if_not_exists(supabase):
            print("\n❌ Annulé par l'utilisateur.")
            return

    # Upload chaque fichier
    print("\n📁 Upload des fichiers:")
    print("=" * 70)

    success_count = 0
    for file_info in FILES:
        if upload_file(supabase, file_info):
            success_count += 1

    # Résumé
    print("\n" + "=" * 70)
    print(f"✅ TERMINÉ: {success_count}/{len(FILES)} fichiers uploadés avec succès")
    print("=" * 70)

    # Afficher quelques requêtes utiles
    print("\n📖 Requêtes SQL utiles:")
    print("-" * 70)
    print("""
-- Voir tous les contenus
SELECT id, title, category, word_count, created_at
FROM marketing_content
ORDER BY created_at DESC;

-- Rechercher dans le contenu (français)
SELECT title, category, word_count
FROM marketing_content
WHERE to_tsvector('french', content) @@ to_tsquery('french', 'neuromarketing & influence')
ORDER BY created_at DESC;

-- Stats par catégorie
SELECT
    category,
    COUNT(*) as content_count,
    SUM(word_count) as total_words,
    AVG(word_count) as avg_words
FROM marketing_content
GROUP BY category;

-- Rechercher par tags
SELECT title, tags, word_count
FROM marketing_content
WHERE 'neuromarketing' = ANY(tags);
    """)

if __name__ == "__main__":
    main()
