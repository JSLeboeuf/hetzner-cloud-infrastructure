#!/usr/bin/env python3
"""
Upload document enrichi académique vers Supabase
"""

import sys
import subprocess
from datetime import datetime
from pathlib import Path

# Install dependencies
try:
    from supabase import create_client
except ImportError:
    print("📦 Installation des dépendances...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "supabase", "--break-system-packages", "--quiet"])
    from supabase import create_client

# Configuration AutoScale AI
SUPABASE_URL = "https://ymwaxkvwypknfumxqhzv.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inltd2F4a3Z3eXBrbmZ1bXhxaHp2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjEzNzMyNCwiZXhwIjoyMDc3NzEzMzI0fQ.NSZn9MJQtYwUNAcnGJ4OnJe8AVoZ9OcP5klbskB4UYM"

FILE = {
    "path": "/home/developer/docs/marketing/GUIDE_ENRICHI_ACADEMIQUE_2024-2025.md",
    "title": "Guide Marketing Enrichi - Recherches Académiques 2024-2025 (COMPLET)",
    "category": "Academic Research",
    "type": "Comprehensive Academic Guide",
    "tags": ["neuromarketing", "behavioral-economics", "consumer-neuroscience", "AI-ethics",
             "dark-patterns", "cross-cultural", "persuasive-design", "habit-formation",
             "social-influence", "viral-psychology", "2024-2025", "peer-reviewed"]
}

def upload_enrichi():
    """Upload document enrichi."""

    print("\n" + "=" * 70)
    print("🚀 UPLOAD DOCUMENT ENRICHI ACADÉMIQUE")
    print("=" * 70)
    print(f"📁 Fichier: {Path(FILE['path']).name}")
    print("=" * 70)

    # Connexion Supabase
    print("\n🔌 Connexion Supabase...")
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        print("✅ Connecté!")
    except Exception as e:
        print(f"❌ Erreur connexion: {e}")
        return False

    # Lecture fichier
    print(f"\n📖 Lecture fichier...")
    file_path = Path(FILE['path'])
    if not file_path.exists():
        print(f"❌ Fichier non trouvé: {file_path}")
        return False

    content = file_path.read_text(encoding='utf-8')
    word_count = len(content.split())

    print(f"✅ Fichier lu: {word_count:,} mots")

    # Préparation données
    data = {
        "title": FILE['title'],
        "category": FILE['category'],
        "type": FILE['type'],
        "file_path": str(file_path),
        "content": content,
        "word_count": word_count,
        "tags": FILE['tags'],
        "metadata": {
            "original_filename": file_path.name,
            "upload_date": datetime.now().isoformat(),
            "file_size_bytes": len(content.encode('utf-8')),
            "sections": content.count('##'),
            "h1_count": content.count('# '),
            "h2_count": content.count('## '),
            "version": "2.0 - COMPLET",
            "research_domains": 10,
            "academic_sources": "50+ études peer-reviewed"
        }
    }

    # Upload
    print(f"\n📤 Upload vers Supabase...")
    try:
        response = supabase.table('marketing_content').insert(data).execute()

        print("\n" + "=" * 70)
        print("🎉 UPLOAD RÉUSSI!")
        print("=" * 70)
        print(f"✅ Document enrichi uploadé avec succès!")
        print(f"\n📊 Statistiques:")
        print(f"   - Mots: {word_count:,}")
        print(f"   - Caractères: {len(content):,}")
        print(f"   - Sections: {data['metadata']['sections']}")
        print(f"   - Domaines recherche: 10")
        print(f"   - Sources académiques: 50+")

        if response.data and len(response.data) > 0:
            record_id = response.data[0].get('id')
            print(f"   - ID Supabase: {record_id}")

        print("\n🌐 Accès:")
        print(f"   Dashboard: https://supabase.com/dashboard/project/ymwaxkvwypknfumxqhzv")
        print(f"   Table Editor: https://supabase.com/dashboard/project/ymwaxkvwypknfumxqhzv/editor")
        print("=" * 70)

        return True

    except Exception as e:
        print(f"❌ Erreur upload: {e}")
        return False

if __name__ == "__main__":
    success = upload_enrichi()
    sys.exit(0 if success else 1)
