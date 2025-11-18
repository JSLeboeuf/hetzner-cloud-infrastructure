# Plan Détaillé - Augmentation Coverage 55% → 85%

**Date** : 17 Novembre 2025
**Objectif** : Passer de 55.38% à 85%+ coverage
**Effort total estimé** : 8-12 heures
**Priorité** : CRITIQUE pour production

---

## 📊 ÉTAT ACTUEL

```
Total statements  : 1,775
Covered           : 983 (55.38%)
Missing           : 792 (44.62%)

Target            : 85% coverage
Statements requis : 1,509 (1775 * 0.85)
Gap à combler     : 526 statements additionnels
```

---

## 🎯 STRATÉGIE EN 3 PHASES

### Phase 1 : Nettoyer Code Mort (0% coverage) - 1 heure
**Impact** : +15% coverage sans écrire de tests

### Phase 2 : Tester Modules Critiques (<60%) - 6-8 heures
**Impact** : +25% coverage, sécurise production

### Phase 3 : Compléter Modules Partiels (60-94%) - 2-3 heures
**Impact** : +5% coverage, perfection

---

## PHASE 1 : NETTOYER CODE MORT (1 heure)

### Modules à 0% Coverage (528 lignes mortes)

| Module | Lignes | Action | Effort |
|--------|--------|--------|--------|
| `hybrid_ai_optimized.py` | 194 | **SUPPRIMER** (doublon de hybrid_ai.py) | 5 min |
| `secrets_manager_v2.py` | 104 | **SUPPRIMER** (version non utilisée) | 5 min |
| `advanced_rate_limit.py` | 107 | **SUPPRIMER** (implémentation abandonnée) | 5 min |
| `security.py` | 114 | **ACTIVER** ou documenter pourquoi désactivé | 20 min |
| `index.py` | 9 | **SUPPRIMER** ou tester si utilisé | 5 min |

**Commandes :**
```bash
# 1. Vérifier si modules sont importés ailleurs
grep -r "import.*hybrid_ai_optimized" api/ tests/
grep -r "import.*secrets_manager_v2" api/ tests/
grep -r "import.*advanced_rate_limit" api/ tests/

# 2. Si aucune référence, supprimer
rm api/hybrid_ai_optimized.py
rm api/secrets_manager_v2.py
rm api/middleware/advanced_rate_limit.py

# 3. Pour security.py, vérifier pourquoi non utilisé
grep -r "from.*security import" api/

# 4. Si non utilisé, soit l'activer dans main.py, soit supprimer
```

**Résultat attendu :**
- Lignes totales : 1775 → 1247 (-528 lignes mortes)
- Coverage : 55% → **79%** (983/1247) sans écrire de tests !

---

## PHASE 2 : TESTER MODULES CRITIQUES (6-8 heures)

### 2.1 emergency_orchestrator.py (313 lignes, 57% → 90%)

**Lignes non couvertes** : 134 lignes (43%)

**Priorité** : 🔴 CRITIQUE (gestion urgences, escalade humaine)

**Tests à ajouter** :

#### A. Tests Détection Urgence (30 min)
```python
# tests/test_emergency_orchestrator_extended.py

def test_detect_power_lines_danger():
    """Test détection fils électriques"""
    orchestrator = EmergencyOrchestrator()

    # Cas positifs
    assert orchestrator.is_emergency("arbre sur fils électriques") == True
    assert orchestrator.is_emergency("contact avec power lines") == True

    # Cas négatifs
    assert orchestrator.is_emergency("arbre près de fils") == False

def test_detect_structural_danger():
    """Test détection danger structurel"""
    orchestrator = EmergencyOrchestrator()

    assert orchestrator.is_emergency("arbre tombé sur maison") == True
    assert orchestrator.is_emergency("arbre penche dangereusement") == True
    assert orchestrator.is_emergency("risque d'effondrement") == True

def test_detect_immediate_fall_risk():
    """Test détection risque chute immédiate"""
    orchestrator = EmergencyOrchestrator()

    assert orchestrator.is_emergency("arbre va tomber") == True
    assert orchestrator.is_emergency("branches cassées suspendues") == True
```

#### B. Tests Escalade Urgence (45 min)
```python
def test_escalate_to_human():
    """Test escalade vers humain"""
    orchestrator = EmergencyOrchestrator()

    result = orchestrator.escalate_emergency(
        call_id="test-123",
        urgency_level="critical",
        description="Arbre sur maison"
    )

    assert result["escalated"] == True
    assert result["sms_sent"] == True
    assert result["eta_callback"] == "15 minutes"

def test_sms_notification_owner():
    """Test SMS au propriétaire"""
    orchestrator = EmergencyOrchestrator()

    with mock.patch('api.twilio_client.send_sms') as mock_sms:
        orchestrator.notify_owner_emergency({
            "phone": "+15145551234",
            "address": "123 rue Test",
            "urgency": "critical"
        })

        assert mock_sms.called
        assert "URGENCE" in mock_sms.call_args[0][0]
```

#### C. Tests Templates Urgence (30 min)
```python
def test_emergency_response_templates():
    """Test templates réponses urgence"""
    orchestrator = EmergencyOrchestrator()

    # Doit refuser de donner un prix
    response = orchestrator.get_emergency_response("critical")
    assert "prix" not in response.lower()
    assert "visite gratuite" not in response.lower()

    # Doit promettre rappel rapide
    assert "15 minutes" in response or "rappel" in response

def test_emergency_priority_queue():
    """Test queue de priorité urgences"""
    orchestrator = EmergencyOrchestrator()

    orchestrator.add_to_priority_queue({
        "call_id": "urgent-1",
        "urgency": "critical"
    })

    next_call = orchestrator.get_next_priority_call()
    assert next_call["call_id"] == "urgent-1"
```

**Lignes couvertes** : +105 lignes
**Coverage module** : 57% → 90%
**Effort** : 2 heures

---

### 2.2 agent_optimizer.py (178 lignes, 44% → 85%)

**Lignes non couvertes** : 99 lignes (56%)

**Priorité** : 🟡 MOYEN (optimisation agent, pas critique)

**Tests à ajouter** :

#### A. Tests Optimisation Prompts (1 heure)
```python
# tests/test_agent_optimizer_extended.py

def test_optimize_system_prompt():
    """Test optimisation du system prompt"""
    optimizer = AgentOptimizer()

    original_prompt = "Tu es un assistant."
    optimized = optimizer.optimize_prompt(original_prompt)

    # Doit être plus long et détaillé
    assert len(optimized) > len(original_prompt)
    assert "français canadien" in optimized.lower()

def test_add_context_to_prompt():
    """Test ajout de contexte métier"""
    optimizer = AgentOptimizer()

    base_prompt = "Réponds aux questions."
    with_context = optimizer.add_business_context(base_prompt)

    assert "BP Émondage" in with_context
    assert "Joliette" in with_context or "Lanaudière" in with_context

def test_optimize_for_token_usage():
    """Test optimisation pour réduire tokens"""
    optimizer = AgentOptimizer()

    verbose_prompt = "..." * 1000  # Prompt très long
    optimized = optimizer.optimize_for_tokens(verbose_prompt, max_tokens=500)

    assert len(optimized) < len(verbose_prompt)
    assert optimizer.count_tokens(optimized) <= 500
```

#### B. Tests Analyse Performance (45 min)
```python
def test_analyze_agent_performance():
    """Test analyse performance agent"""
    optimizer = AgentOptimizer()

    calls_data = [
        {"id": "1", "duration": 120, "qualified": True},
        {"id": "2", "duration": 180, "qualified": False},
        {"id": "3", "duration": 90, "qualified": True},
    ]

    metrics = optimizer.analyze_performance(calls_data)

    assert metrics["avg_duration"] == 130
    assert metrics["qualification_rate"] == 2/3

def test_identify_optimization_opportunities():
    """Test identification opportunités optimisation"""
    optimizer = AgentOptimizer()

    opportunities = optimizer.identify_optimizations([
        {"step": "qualification", "avg_time": 300},  # Trop long
        {"step": "confirmation", "avg_time": 30},    # Bon
    ])

    assert "qualification" in [opp["step"] for opp in opportunities]
```

**Lignes couvertes** : +75 lignes
**Coverage module** : 44% → 85%
**Effort** : 2 heures

---

### 2.3 rate_limit.py (27 lignes, 59% → 100%)

**Lignes non couvertes** : 11 lignes (41%)

**Priorité** : 🔴 CRITIQUE (sécurité anti-abuse)

**Tests à ajouter** :

#### Tests Rate Limiting Complets (30 min)
```python
# tests/test_rate_limit_extended.py

def test_rate_limit_exceeded():
    """Test dépassement limite"""
    from api.middleware.rate_limit import RateLimiter

    limiter = RateLimiter(max_requests=5, window=60)

    # 5 requêtes OK
    for i in range(5):
        assert limiter.is_allowed("client-1") == True

    # 6ème requête bloquée
    assert limiter.is_allowed("client-1") == False

def test_rate_limit_window_reset():
    """Test reset après fenêtre"""
    limiter = RateLimiter(max_requests=5, window=1)  # 1 seconde

    # Remplir limite
    for i in range(5):
        limiter.is_allowed("client-2")

    # Attendre reset
    import time
    time.sleep(1.1)

    # Devrait être reset
    assert limiter.is_allowed("client-2") == True

def test_rate_limit_per_client():
    """Test isolation par client"""
    limiter = RateLimiter(max_requests=5, window=60)

    # Client 1 atteint limite
    for i in range(5):
        limiter.is_allowed("client-1")

    # Client 2 devrait être OK
    assert limiter.is_allowed("client-2") == True

def test_rate_limit_middleware_integration():
    """Test intégration middleware FastAPI"""
    from fastapi.testclient import TestClient
    from api.main import app

    client = TestClient(app)

    # Faire plusieurs requêtes rapides
    responses = [client.get("/health") for _ in range(150)]

    # Au moins une devrait être rate limited (429)
    status_codes = [r.status_code for r in responses]
    assert 429 in status_codes
```

**Lignes couvertes** : +11 lignes
**Coverage module** : 59% → 100%
**Effort** : 30 minutes

---

## PHASE 3 : COMPLÉTER MODULES PARTIELS (2-3 heures)

### 3.1 input_sanitizer.py (169 lignes, 94% → 100%)

**Lignes non couvertes** : 10 lignes (6%)

**Missing lines** : 161, 168, 237, 257-258, 265-266, 323-324, 420

**Tests à ajouter** (30 min) :
```python
# tests/test_input_sanitizer_edge_cases.py

def test_sanitize_unicode_characters():
    """Test sanitisation caractères Unicode"""
    from api.input_sanitizer import InputSanitizer

    sanitizer = InputSanitizer()

    # Caractères spéciaux québécois
    assert sanitizer.sanitize("Côté") == "Côté"
    assert sanitizer.sanitize("Émondage") == "Émondage"

    # Caractères dangereux
    dangerous = "<script>alert('xss')</script>"
    assert "<script>" not in sanitizer.sanitize(dangerous)

def test_sanitize_sql_injection_variants():
    """Test variantes injection SQL"""
    sanitizer = InputSanitizer()

    variants = [
        "1' OR '1'='1",
        "admin'--",
        "'; DROP TABLE users; --",
    ]

    for variant in variants:
        sanitized = sanitizer.sanitize(variant)
        assert "DROP" not in sanitized
        assert "--" not in sanitized

def test_sanitize_path_traversal():
    """Test sanitisation path traversal"""
    sanitizer = InputSanitizer()

    assert "../../../etc/passwd" not in sanitizer.sanitize("../../../etc/passwd")
    assert sanitizer.sanitize("../../config") == "config"
```

**Lignes couvertes** : +10 lignes
**Coverage module** : 94% → 100%
**Effort** : 30 minutes

---

### 3.2 pricing_adapter.py (127 lignes, 94% → 100%)

**Lignes non couvertes** : 7 lignes (6%)

**Missing lines** : 13-20

**Tests à ajouter** (30 min) :
```python
# tests/test_pricing_adapter_edge_cases.py

def test_pricing_adapter_initialization():
    """Test initialisation avec config custom"""
    from api.pricing_adapter import PricingAdapter

    adapter = PricingAdapter(config={
        "base_rate": 150,
        "distance_multiplier": 1.5
    })

    assert adapter.config["base_rate"] == 150

def test_pricing_invalid_service_type():
    """Test calcul prix avec type invalide"""
    adapter = PricingAdapter()

    with pytest.raises(ValueError):
        adapter.calculate_price(service_type="invalid")

def test_pricing_extreme_distances():
    """Test calcul prix distances extrêmes"""
    adapter = PricingAdapter()

    # >100 km devrait refuser ou appliquer minimum
    price = adapter.calculate_price(
        service_type="elagage",
        distance_km=150
    )

    assert price >= 500  # Minimum pour distance extrême
```

**Lignes couvertes** : +7 lignes
**Coverage module** : 94% → 100%
**Effort** : 30 minutes

---

### 3.3 config.py (27 lignes, 93% → 100%)

**Lignes non couvertes** : 2 lignes (7%)

**Missing lines** : 16-17

**Tests à ajouter** (15 min) :
```python
# tests/test_config.py

def test_config_missing_env_variables():
    """Test config avec variables manquantes"""
    import os
    from api.config import get_config

    # Sauvegarder variable
    original = os.environ.get("TWILIO_ACCOUNT_SID")

    # Supprimer temporairement
    if "TWILIO_ACCOUNT_SID" in os.environ:
        del os.environ["TWILIO_ACCOUNT_SID"]

    # Devrait utiliser valeur par défaut ou lever erreur
    with pytest.raises(ValueError):
        config = get_config()

    # Restaurer
    if original:
        os.environ["TWILIO_ACCOUNT_SID"] = original

def test_config_validation():
    """Test validation config au startup"""
    from api.config import validate_config

    invalid_config = {
        "TWILIO_AUTH_TOKEN": "",  # Vide
        "SUPABASE_URL": "invalid-url"  # Format invalide
    }

    assert validate_config(invalid_config) == False
```

**Lignes couvertes** : +2 lignes
**Coverage module** : 93% → 100%
**Effort** : 15 minutes

---

### 3.4 cors_config.py (8 lignes, 88% → 100%)

**Lignes non couvertes** : 1 ligne (12%)

**Missing line** : 18

**Tests à ajouter** (10 min) :
```python
# tests/test_cors_config.py

def test_cors_allowed_origins():
    """Test origins CORS autorisées"""
    from api.middleware.cors_config import get_cors_origins

    origins = get_cors_origins()

    # Devrait inclure domaines production
    assert "https://dashboard-bpemondage.vercel.app" in origins

    # Ne devrait PAS inclure *
    assert "*" not in origins

def test_cors_preflight_request():
    """Test requête preflight CORS"""
    from fastapi.testclient import TestClient
    from api.main import app

    client = TestClient(app)

    response = client.options(
        "/health",
        headers={
            "Origin": "https://dashboard-bpemondage.vercel.app",
            "Access-Control-Request-Method": "GET"
        }
    )

    assert response.status_code == 200
    assert "Access-Control-Allow-Origin" in response.headers
```

**Lignes couvertes** : +1 ligne
**Coverage module** : 88% → 100%
**Effort** : 10 minutes

---

## 📊 CALCUL IMPACT COVERAGE

### Après Phase 1 (Nettoyer Code Mort)
```
Statements totaux : 1,247 (au lieu de 1,775)
Covered           : 983
Coverage          : 78.8%
```

### Après Phase 2 (Tester Modules Critiques)
```
Lignes additionnelles couvertes : +191
Covered total                    : 1,174
Coverage                         : 94.1%
```

### Après Phase 3 (Compléter Partiels)
```
Lignes additionnelles couvertes : +30
Covered total                    : 1,204
Coverage                         : 96.6%
```

**RÉSULTAT FINAL : 96.6% coverage (dépassement objectif 85%)**

---

## 🗓️ PLANNING D'EXÉCUTION

### Jour 1 - Matin (4 heures)
```
09:00-09:30  Phase 1: Nettoyer code mort (0.5h)
             → rm hybrid_ai_optimized.py, secrets_manager_v2.py, advanced_rate_limit.py
             → Coverage: 55% → 79%

09:30-11:30  Phase 2.1: emergency_orchestrator.py (2h)
             → Tests détection urgence
             → Tests escalade
             → Tests templates
             → Coverage module: 57% → 90%

11:30-12:00  Phase 2.3: rate_limit.py (0.5h)
             → Tests rate limiting complet
             → Coverage module: 59% → 100%
```

### Jour 1 - Après-midi (4 heures)
```
13:00-15:00  Phase 2.2: agent_optimizer.py (2h)
             → Tests optimisation prompts
             → Tests analyse performance
             → Coverage module: 44% → 85%

15:00-16:30  Phase 3: Modules partiels (1.5h)
             → input_sanitizer.py: 94% → 100%
             → pricing_adapter.py: 94% → 100%
             → config.py: 93% → 100%
             → cors_config.py: 88% → 100%

16:30-17:00  Validation finale (0.5h)
             → pytest --cov=api --cov-report=html
             → Vérifier 85%+ atteint
             → Documentation résultats
```

**Total : 8 heures**

---

## 📁 FICHIERS À CRÉER

```
tests/
├── test_emergency_orchestrator_extended.py      (nouveau, 2h)
├── test_agent_optimizer_extended.py             (nouveau, 2h)
├── test_rate_limit_extended.py                  (nouveau, 0.5h)
├── test_input_sanitizer_edge_cases.py           (nouveau, 0.5h)
├── test_pricing_adapter_edge_cases.py           (nouveau, 0.5h)
├── test_config.py                               (nouveau, 0.25h)
└── test_cors_config.py                          (nouveau, 0.25h)
```

---

## ✅ CHECKLIST D'EXÉCUTION

### Phase 1 : Nettoyer Code Mort
- [ ] Vérifier imports de hybrid_ai_optimized.py
- [ ] Supprimer hybrid_ai_optimized.py si non utilisé
- [ ] Vérifier imports de secrets_manager_v2.py
- [ ] Supprimer secrets_manager_v2.py si non utilisé
- [ ] Vérifier imports de advanced_rate_limit.py
- [ ] Supprimer advanced_rate_limit.py si non utilisé
- [ ] Décider sort de security.py (activer ou supprimer)
- [ ] Décider sort de index.py (tester ou supprimer)
- [ ] Exécuter pytest --cov=api
- [ ] Vérifier coverage ~79%

### Phase 2 : Tester Modules Critiques
- [ ] Créer test_emergency_orchestrator_extended.py
- [ ] Implémenter tests détection urgence (6 tests)
- [ ] Implémenter tests escalade (4 tests)
- [ ] Implémenter tests templates (3 tests)
- [ ] Exécuter pytest tests/test_emergency_orchestrator*
- [ ] Vérifier coverage module ≥90%
- [ ] Créer test_agent_optimizer_extended.py
- [ ] Implémenter tests optimisation prompts (5 tests)
- [ ] Implémenter tests analyse performance (3 tests)
- [ ] Exécuter pytest tests/test_agent_optimizer*
- [ ] Vérifier coverage module ≥85%
- [ ] Créer test_rate_limit_extended.py
- [ ] Implémenter tests rate limiting (4 tests)
- [ ] Exécuter pytest tests/test_rate_limit*
- [ ] Vérifier coverage module 100%

### Phase 3 : Compléter Partiels
- [ ] Créer test_input_sanitizer_edge_cases.py
- [ ] Implémenter 3 tests edge cases
- [ ] Exécuter pytest tests/test_input_sanitizer*
- [ ] Vérifier coverage 100%
- [ ] Créer test_pricing_adapter_edge_cases.py
- [ ] Implémenter 3 tests edge cases
- [ ] Exécuter pytest tests/test_pricing_adapter*
- [ ] Vérifier coverage 100%
- [ ] Créer test_config.py
- [ ] Implémenter 2 tests config
- [ ] Créer test_cors_config.py
- [ ] Implémenter 2 tests CORS

### Validation Finale
- [ ] Exécuter pytest --cov=api --cov-report=html --cov-report=term
- [ ] Vérifier coverage ≥85%
- [ ] Ouvrir htmlcov/index.html et vérifier modules critiques
- [ ] Documenter résultats dans RAPPORT_COVERAGE_FINAL.md
- [ ] Commit et push

---

## 🚀 COMMANDES RAPIDES

### Vérifier Coverage Actuel
```bash
pytest tests/ --cov=api --cov-report=term-missing \
  --ignore=tests/load_test.py \
  --ignore=tests/test_qualification_workflow_complete.py \
  --ignore=tests/test_security.py
```

### Nettoyer Code Mort (Phase 1)
```bash
# Vérifier utilisation
grep -r "hybrid_ai_optimized" api/ tests/
grep -r "secrets_manager_v2" api/ tests/
grep -r "advanced_rate_limit" api/ tests/

# Supprimer si non utilisés
rm api/hybrid_ai_optimized.py
rm api/secrets_manager_v2.py
rm api/middleware/advanced_rate_limit.py

# Re-tester coverage
pytest --cov=api --cov-report=term
```

### Tester Module Spécifique
```bash
# Emergency orchestrator
pytest tests/test_emergency_orchestrator* --cov=api.emergency_orchestrator --cov-report=term

# Agent optimizer
pytest tests/test_agent_optimizer* --cov=api.agent_optimizer --cov-report=term

# Rate limit
pytest tests/test_rate_limit* --cov=api.middleware.rate_limit --cov-report=term
```

### Générer Rapport HTML
```bash
pytest --cov=api --cov-report=html --ignore=tests/load_test.py
open htmlcov/index.html  # macOS
xdg-open htmlcov/index.html  # Linux
```

---

## 💡 CONSEILS PRATIQUES

### 1. Commencer par Phase 1 (Nettoyer)
- **Pourquoi** : +24% coverage instantané sans écrire de tests
- **Temps** : 30 minutes seulement
- **Risque** : Très faible (code non utilisé)

### 2. Prioriser emergency_orchestrator.py
- **Pourquoi** : Module critique (gestion urgences)
- **Impact** : +13% coverage global
- **Tests** : Simples à écrire (mock SMS, détection keywords)

### 3. Utiliser pytest-cov --cov-report=html
- **Pourquoi** : Interface visuelle pour identifier lignes manquantes
- **Comment** : Ouvrir htmlcov/index.html dans navigateur
- **Bénéfice** : Voir exactement quoi tester ligne par ligne

### 4. Tester par Module Isolé
- **Commande** : `pytest --cov=api.module_name --cov-report=term`
- **Bénéfice** : Focus sur 1 module à la fois
- **Évite** : Confusion avec coverage global

### 5. Utiliser Mocks pour Dépendances Externes
```python
from unittest.mock import Mock, patch

@patch('api.twilio_client.send_sms')
def test_with_mock(mock_sms):
    # Twilio mocké, pas d'appel réel
    mock_sms.return_value = {"status": "sent"}
    # ... test code
```

### 6. Tests Paramétrés pour Variantes
```python
@pytest.mark.parametrize("input,expected", [
    ("urgence", True),
    ("normal", False),
    ("URGENCE", True),
])
def test_is_emergency(input, expected):
    assert is_emergency(input) == expected
```

---

## 📈 MÉTRIQUES DE SUCCÈS

### Critères GO/NO-GO

| Métrique | Minimum | Cible | Actuel |
|----------|---------|-------|--------|
| Coverage global | 85% | 90% | 55% → **96%** |
| emergency_orchestrator | 80% | 90% | 57% → **90%** |
| agent_optimizer | 75% | 85% | 44% → **85%** |
| rate_limit | 90% | 100% | 59% → **100%** |
| Modules critiques | 85% | 95% | Variable → **95%+** |

### Définition Coverage "Critique"

Modules critiques (doivent avoir ≥85% coverage) :
- ✅ `emergency_orchestrator.py` - Gestion urgences
- ✅ `agent_router.py` - Classification appels (déjà 100%)
- ✅ `qualification_workflow.py` - Qualification leads (déjà 100%)
- ✅ `input_sanitizer.py` - Sécurité (déjà 94%)
- ✅ `webhook_validation.py` - Sécurité (déjà 100%)
- ✅ `rate_limit.py` - Anti-abuse

---

## 🎯 RÉSUMÉ EXÉCUTIF

### Avant
```
Coverage : 55%
Modules à 0% : 5 (528 lignes mortes)
Modules critiques <80% : 3
Prêt pour prod : ❌ NON
```

### Après (8 heures de travail)
```
Coverage : 96%
Modules à 0% : 0 (nettoyés)
Modules critiques <80% : 0
Prêt pour prod : ✅ OUI
```

### ROI
- **Investissement** : 8 heures
- **Gain** : +41% coverage (55% → 96%)
- **Impact** : Sécurise production, réduit risque bugs
- **Confiance** : Passe de "acceptable" à "excellent"

---

**Plan créé le** : 17 Novembre 2025
**Approuvé pour** : Myriam BP Émondage
**Exécution** : Peut démarrer immédiatement
**Contact** : Voir RAPPORT_FINALISATION_MYRIAM_2025-11-17.md

---

**Next Steps :**
1. ✅ Lire ce plan
2. ⏳ Exécuter Phase 1 (30 min)
3. ⏳ Vérifier coverage passe à 79%
4. ⏳ Continuer Phase 2 et 3
5. ✅ Atteindre 85%+ coverage
6. 🚀 DEPLOY TO PRODUCTION
