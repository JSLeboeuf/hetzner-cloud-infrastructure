# ⚡ Quick Start - Claude Code pour BP Émondage

> Guide ultra-rapide pour démarrer en 5 minutes

---

## 🚀 Étape 1: Validation de l'environnement (1 min)

```bash
cd /home/developer
./validate_claude_code_setup.sh
```

**Attendu**: `✅ Configuration complète et sécurisée`

---

## 📋 Étape 2: Choix du prompt (30 sec)

### Option A: Complet (Production-ready)
**Fichier**: `CLAUDE_CODE_MASTER_PROMPT.md`
- Backend + Frontend + E2E + Security + Deploy
- Durée: ~30-60 minutes
- **Recommandé si**: Vous voulez tout finaliser

### Option B: Backend-only (Tests verts rapidement)
**Fichier**: `CLAUDE_CODE_PROMPT_LIGHT.md`
- Backend uniquement, tests verts
- Durée: ~10-20 minutes
- **Recommandé si**: Vous voulez juste débloquer les tests

### Option C: Supabase Specialist
**Fichier**: `CLAUDE_CODE_PROMPT_SUPABASE.md`
- Migrations et intégrations Supabase
- Durée: ~15-30 minutes
- **Recommandé si**: Vous avez des problèmes de schema

---

## 💬 Étape 3: Utilisation dans Claude Code (3 min)

### 3.1. Copier le prompt choisi

```bash
# Option A (complet)
cat CLAUDE_CODE_MASTER_PROMPT.md

# Option B (light)
cat CLAUDE_CODE_PROMPT_LIGHT.md

# Option C (supabase)
cat CLAUDE_CODE_PROMPT_SUPABASE.md
```

### 3.2. Coller dans Claude Code

1. Ouvrir Claude Code
2. Nouvelle conversation
3. **Coller TOUT le contenu** du prompt en haut
4. Appuyer sur Entrée

### 3.3. Lancer l'exécution

**Dire simplement**:
```
Analyse le repo et exécute ton plan jusqu'à préflight OK
```

Ou:
```
Finalise le projet au complet maintenant
```

---

## 🔍 Étape 4: Suivre la progression (pendant l'exécution)

Claude Code va suivre ce workflow:

```
📊 État instantané
  ↓
📋 Plan (5-8 étapes)
  ↓
⚙️  Exécution
  ↓
✅ Validation (tests + preflight)
  ↓
❓ Prochaines questions
```

**Attendez** la section **"Prochaines questions"** avant de répondre.

---

## ✅ Étape 5: Vérifier le résultat (1 min)

### Backend-only (Option B)
```bash
cd /root/myriam-bp-emondage
make preflight ARGS="--skip-frontend --skip-e2e --skip-security"
```

**Attendu**: Exit code 0

### Production-ready (Option A)
```bash
cd /root/myriam-bp-emondage
make preflight
```

**Attendu**: Exit code 0 (tous les tests verts)

### Supabase (Option C)
```bash
pytest tests/test_supabase_integration.py -v
```

**Attendu**: Tests passants ou proprement skippés

---

## 🆘 Troubleshooting Rapide

### Problème: "Secret manquant"
**Solution**:
```bash
cd /root/ai-booking-agent/bp-emondage-nexus
set -a && source .env && set +a
cd /root/myriam-bp-emondage
```

### Problème: Tests VAPI échouent
**Solution**:
```bash
export BP_SKIP_VAPI_TESTS=1
pytest
```

### Problème: Coverage trop basse
**Solution**: Ajouter tests, NE PAS réduire le seuil

### Problème: Claude Code ne répond pas au format attendu
**Solution**:
1. Vérifier que TOUT le prompt est collé (pas coupé)
2. Relancer avec: "Suis le format: État → Plan → Exécution → Validation → Questions"

---

## 📊 Checklist de Succès

### Après Option A (Complet)
- [ ] `pytest -q` → 100% pass
- [ ] `make preflight` → Exit 0
- [ ] `npm run test` → Pass
- [ ] Playwright E2E → Pass
- [ ] Documentation à jour

### Après Option B (Backend)
- [ ] `pytest -q` → 100% pass (avec skips documentés)
- [ ] `make preflight ARGS="--skip-frontend --skip-e2e"` → Exit 0
- [ ] Coverage ≥ 90%
- [ ] Secrets vérifiés

### Après Option C (Supabase)
- [ ] Migrations créées dans `supabase/migrations/`
- [ ] Tests Supabase passants
- [ ] RLS configuré
- [ ] Indexes créés

---

## 🎯 Prochaines Étapes (après succès)

### Si vous avez fait Option B (Backend)
→ Relancer avec Option A pour finaliser frontend

### Si vous avez fait Option A (Complet)
→ Déployer:
```bash
# Railway (backend)
railway up

# Vercel (frontend)
vercel deploy
```

### Si vous avez fait Option C (Supabase)
→ Appliquer migrations en production:
```
1. Dashboard Supabase → SQL Editor
2. Copier migration
3. Exécuter
```

---

## 💡 Tips

### Gagner du temps
- **Commencer par Option B** pour débloquer les tests rapidement
- Puis passer à **Option A** pour finaliser

### Sécurité
- JAMAIS committer `.env`
- Toujours vérifier `.gitignore`
- Utiliser skip flags plutôt que supprimer tests

### Performance
- Lancer validation script AVANT de commencer
- Avoir les secrets prêts dans `.env`
- Utiliser skip flags pour tests lourds en local

---

## 📚 Ressources

- **Master Prompt complet**: `CLAUDE_CODE_MASTER_PROMPT.md`
- **Guide sécurité**: `SECURITY_GUIDE.md`
- **Révocation credentials**: `REVOCATION_CHECKLIST.md`
- **Template .env**: `.env.example`

---

## ⏱️ Durée Totale Estimée

| Option | Setup | Exécution | Vérif | Total |
|--------|-------|-----------|-------|-------|
| A - Complet | 5 min | 30-60 min | 5 min | **40-70 min** |
| B - Backend | 5 min | 10-20 min | 2 min | **17-27 min** |
| C - Supabase | 5 min | 15-30 min | 3 min | **23-38 min** |

---

**Prêt ?** → Passez à l'étape 1 ! 🚀
