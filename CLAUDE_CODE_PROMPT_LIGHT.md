# 🚀 Claude Code - Prompt Light (Backend-Only)

> Version simplifiée du Master Prompt - Focus backend uniquement

---

## Context
- **Projet**: myriam-bp-emondage
- **Objectif**: Backend tests verts, preflight backend OK
- **Stack**: FastAPI + Supabase + Twilio + pytest

## Workflow Simplifié

### 1. État instantané
```bash
cd /root/myriam-bp-emondage
pytest -q
```

Résumé des failures par catégorie.

### 2. Plan (3-5 étapes max)
1. Fix priorité 1
2. Fix priorité 2
3. Tests
4. Preflight

### 3. Exécution
Changements minimaux, tests first.

### 4. Validation
```bash
pytest -q
make preflight ARGS="--skip-frontend --skip-e2e --skip-security"
```

Exit code 0 = ✅

## Contraintes

### Sécurité
- ❌ Jamais afficher secrets
- ❌ Jamais réduire coverage
- ✅ Utiliser skip flags pour tests nécessitant credentials

### Tests
- Pattern de skip:
```python
@pytest.mark.skipif(
    os.getenv("BP_SKIP_VAPI_TESTS") == "1",
    reason="VAPI disabled"
)
```

## Modules Critiques

**`api/qualification_workflow.py`**:
- 6 champs requis
- Phone normalization: `+1XXXXXXXXXX`
- Urgence: `bool`

**`api/main.py`**:
- Twilio signature: strict en prod, bypass en test
- Runtime security: raise en prod si secrets manquants

**`api/secrets_manager.py`**:
- `SecureConfigManager.health_check()`

## Commandes Essentielles

```bash
# Secrets
python scripts/check_secrets.py

# Tests
pytest -q

# Preflight backend
make preflight ARGS="--skip-frontend --skip-e2e"
```

## Objectif

```bash
make preflight ARGS="--skip-frontend --skip-e2e --skip-security"
# Exit code: 0 ✅
```

**Scope**: Backend seulement. Frontend/E2E/Deploy = hors scope.
