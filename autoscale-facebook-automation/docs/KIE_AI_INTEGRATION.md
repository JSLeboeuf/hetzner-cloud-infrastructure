# 🎨 Intégration kie.ai - Images & Vidéos
## Documentation Complète pour AutoScale Facebook Automation

**Date**: 18 Novembre 2025
**Service**: https://kie.ai/fr
**Documentation**: https://docs.kie.ai
**API Key**: `b23878d0f4f0d9d975dc364145227220`

---

## 📋 Résumé

**kie.ai** est une plateforme française d'APIs AI spécialisée dans la **génération de contenu multimédia**:
- ✅ Génération d'images (4o Image, Flux Kontext, Ideogram)
- ✅ Génération de vidéos (Veo 3.1, Runway, Sora, Kling)
- ✅ Génération de musique (Suno)
- ❌ **PAS de LLM/Chat** (pas de Claude, GPT, etc.)

**Note importante**: Pour la génération de texte (Claude), utiliser **Anthropic API directe** au lieu de kie.ai.

---

## 🖼️ APIs Images Disponibles

### 1. 4o Image API (GPT-4o Vision)

**Description**: Génération d'images avancée avec le modèle vision GPT-4o

**Endpoints**:
```
POST   /api/v1/gpt4o-image/generate        # Créer tâche génération
GET    /api/v1/gpt4o-image/record-info     # Statut de la tâche
POST   /api/v1/gpt4o-image/download-url    # URL de téléchargement
```

**Caractéristiques**:
- Images stockées 14 jours
- Qualité professionnelle
- Support editing et variations

**Exemple d'utilisation**:
```typescript
// POST https://api.kie.ai/api/v1/gpt4o-image/generate
{
  "api_key": "b23878d0f4f0d9d975dc364145227220",
  "prompt": "Modern professional office with AutoScale AI branding, clean design, tech atmosphere",
  "size": "1792x1024",  // Optimal pour Facebook
  "quality": "hd"
}
```

**Documentation**: https://docs.kie.ai/4o-image-api/quickstart

---

### 2. Flux Kontext API (Black Forest Labs)

**Description**: Génération et édition d'images avec IA contextuelle

**Endpoints**:
```
POST   /api/v1/flux/kontext/generate       # Générer/éditer image
GET    /api/v1/flux/kontext/record-info    # Récupérer résultats
```

**Caractéristiques**:
- Context-aware AI (comprend le contexte)
- Text-to-image
- Image editing guidé par texte
- Style transfer

**Exemple d'utilisation**:
```typescript
// POST https://api.kie.ai/api/v1/flux/kontext/generate
{
  "api_key": "b23878d0f4f0d9d975dc364145227220",
  "prompt": "Professional business setting, modern office with AI technology",
  "context": "AutoScale AI - AI phone receptionist branding",
  "size": "1792x1024",
  "style": "professional photography"
}
```

**Documentation**: https://docs.kie.ai/flux-kontext-api/quickstart

---

### 3. Ideogram V3 (Marketplace)

**Description**: Génération d'images avec texte parfait intégré

**Caractéristiques**:
- Excellent pour logos avec texte
- Rendu texte précis
- Multiple styles disponibles

**Note**: Consulter le marketplace kie.ai pour détails spécifiques.

---

## 🎬 APIs Vidéo Disponibles

### 1. Veo 3.1 API (Google)

**Description**: Génération vidéo professionnelle par Google

**Endpoints**:
```
POST   /api/v1/veo/generate          # Créer vidéo
POST   /api/v1/veo/extend            # Étendre vidéo existante
GET    /api/v1/veo/record-info       # Détails tâche
GET    /api/v1/veo/get-1080p-video   # Télécharger en 1080p
```

**Caractéristiques**:
- Qualité professionnelle 1080p
- Extension de vidéos existantes
- Text-to-video
- Image-to-video

**Use cases pour AutoScale**:
- Vidéos démo produit (30-60 sec)
- Animations explicatives
- Contenu publicitaire Facebook/LinkedIn

**Exemple**:
```typescript
// POST https://api.kie.ai/api/v1/veo/generate
{
  "api_key": "b23878d0f4f0d9d975dc364145227220",
  "prompt": "Modern AI assistant answering phone calls in professional office, smooth camera movement",
  "duration": 5,  // secondes
  "quality": "1080p"
}
```

**Documentation**: https://docs.kie.ai/veo3.1-api/quickstart

---

### 2. Runway API (Gen-3 Alpha Turbo)

**Description**: Création vidéo IA rapide et de qualité

**Endpoints**:
```
POST   /api/v1/runway/generate        # Générer vidéo
POST   /api/v1/runway/extend          # Étendre vidéo
GET    /api/v1/runway/record-detail   # Infos tâche
```

**Caractéristiques**:
- Gen-3 Alpha Turbo (rapide)
- Image-to-video
- Text-to-video
- Video extension

**Use cases**:
- Transformations rapides
- Animations produit
- Social media content

**Documentation**: https://docs.kie.ai/runway-api/quickstart

---

### 3. Runway Aleph API (Style Transfer)

**Description**: Transformation vidéo-à-vidéo avec style IA

**Endpoint**:
```
POST   /api/v1/aleph/generate         # Conversion vidéo
```

**Caractéristiques**:
- Video-to-video guidé par texte
- Style transfer artistique
- Recoloration et effets

**Use case**:
- Adapter vidéos existantes au branding AutoScale

**Documentation**: https://docs.kie.ai/runway-aleph-api/quickstart

---

### 4. Luma API

**Description**: Modification et transformation de vidéos

**Endpoint**:
```
POST   /api/v1/modify/generate        # Modifier vidéo
```

**Caractéristiques**:
- Édition vidéo guidée par IA
- Modifications précises

**Documentation**: https://docs.kie.ai/luma-api/quickstart

---

### 5. Sora 2 / Sora 2 Pro (OpenAI - Marketplace)

**Description**: Génération vidéo avancée d'OpenAI

**Caractéristiques**:
- Qualité cinématographique
- Longues durées supportées
- Contrôle créatif avancé

**Note**: Vérifier disponibilité et pricing sur marketplace.

---

### 6. Kling API (v2.1, v2.5)

**Description**: Génération vidéo chinoise avancée

**Versions**: v2.1 (standard), v2.5 (amélioré)

**Note**: Consulter marketplace pour détails.

---

## 🎵 API Musique

### Suno API

**Description**: Génération de musique complète avec paroles

**Capacités**:
- Génération musique avec/sans paroles
- Extension de pistes existantes
- Upload et cover audio
- Ajout couches instrumentales/vocales
- Vocal removal et stem separation
- MIDI depuis audio
- Création vidéos musicales
- Génération paroles

**Use case AutoScale**:
- Musique de fond pour vidéos
- Jingles publicitaires
- Ambiance posts vidéo

**Documentation**: https://docs.kie.ai/suno-api/quickstart

---

## 💰 Pricing & Crédits

### Système de Crédits

**kie.ai** utilise un système de crédits flexible:
- Pay-as-you-go
- Pas d'abonnement obligatoire
- Crédits utilisés par requête

### Free Trial
- ✅ Crédits gratuits au démarrage
- ✅ Playground pour tester toutes les APIs
- ✅ Pas de carte de crédit requise initialement

### Consulter Pricing
- Dashboard: https://kie.ai/api-key
- Marketplace: https://kie.ai/market

### Estimation Coûts (à valider)
```
Images (4o Image / Flux):
- ~$0.02-0.10 par image selon qualité
- 30 images/mois = $0.60-3.00/mois

Vidéos (Veo / Runway):
- ~$0.10-1.00 par seconde selon qualité
- Usage occasionnel = $5-20/mois

Total kie.ai: ~$6-23/mois (usage modéré)
```

---

## 🔐 Authentification

### API Key
```
b23878d0f4f0d9d975dc364145227220
```

### Headers Requis
```typescript
{
  "Authorization": "Bearer b23878d0f4f0d9d975dc364145227220",
  "Content-Type": "application/json"
}
```

### Vérifier Crédits
```bash
# Endpoint Common API
GET /api/v1/common/credits
```

---

## 🛠️ Intégration dans AutoScale

### Scénarios d'Usage

#### 1. Images Facebook (Actuel)
**Status**: Utilise DALL-E 3 (OpenAI)
**Alternative kie.ai**: 4o Image API ou Flux Kontext
**Avantage**: Potentiellement moins cher, plus d'options

#### 2. Vidéos pour Posts (Futur)
**Status**: Non implémenté
**APIs recommandées**: Veo 3.1 (qualité) ou Runway (rapidité)
**Use case**: Posts vidéo Facebook/LinkedIn (engagement +135%)

#### 3. Musique de Fond (Futur)
**Status**: Non implémenté
**API**: Suno
**Use case**: Vidéos avec musique branded

### Exemple d'Intégration

**Nouveau fichier**: `backend/src/temporal/activities/generate-image-kie.activity.ts`

```typescript
import axios from 'axios';

const KIE_API_KEY = process.env.KIE_API_KEY;
const KIE_BASE_URL = 'https://api.kie.ai';

export async function generateImageKie(input: {
  prompt: string;
  size?: string;
}) {
  // 1. Créer tâche génération
  const { data: task } = await axios.post(
    `${KIE_BASE_URL}/api/v1/gpt4o-image/generate`,
    {
      api_key: KIE_API_KEY,
      prompt: input.prompt,
      size: input.size || '1792x1024',
      quality: 'hd',
    }
  );

  // 2. Attendre completion
  let result;
  while (true) {
    const { data } = await axios.get(
      `${KIE_BASE_URL}/api/v1/gpt4o-image/record-info`,
      {
        params: {
          api_key: KIE_API_KEY,
          task_id: task.task_id
        }
      }
    );

    if (data.status === 'completed') {
      result = data;
      break;
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // 3. Télécharger image
  const imageBuffer = await axios.get(result.image_url, {
    responseType: 'arraybuffer'
  });

  return {
    imageUrl: result.image_url,
    buffer: Buffer.from(imageBuffer.data),
  };
}
```

---

## 📊 Comparaison DALL-E vs kie.ai

| Critère | DALL-E 3 (OpenAI) | 4o Image (kie.ai) | Flux Kontext |
|---------|-------------------|-------------------|--------------|
| **Qualité** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Prix/image** | $0.04-0.12 | $0.02-0.10 | $0.03-0.08 |
| **Vitesse** | 10-30s | 10-30s | 15-40s |
| **Formats** | 1024x1024, 1792x1024 | Multiples | Multiples |
| **Texte dans image** | Moyen | Bon | Excellent |
| **Édition** | Non | Oui | Oui |
| **API** | Directe OpenAI | Via kie.ai | Via kie.ai |

**Recommandation**:
- **Production actuelle**: Garder DALL-E 3 (déjà intégré, fiable)
- **Test A/B futur**: Tester 4o Image ou Flux Kontext pour comparaison qualité/coût

---

## 🚀 Roadmap Intégration kie.ai

### Phase 1: Images (Optionnel - A/B Test)
- [ ] Implémenter `generate-image-kie.activity.ts`
- [ ] A/B test: 50% DALL-E / 50% kie.ai
- [ ] Comparer qualité + coûts sur 1 mois
- [ ] Décider provider final

### Phase 2: Vidéos (Q1 2026)
- [ ] Implémenter Veo 3.1 API pour vidéos courtes
- [ ] Posts vidéo Facebook (30-60 sec)
- [ ] Analytics engagement vidéo vs image
- [ ] Scale si ROI positif

### Phase 3: Musique (Q2 2026)
- [ ] Suno API pour musique de fond
- [ ] Vidéos avec branded music
- [ ] Tests engagement

---

## 📚 Ressources

### Documentation Officielle
- **Homepage**: https://kie.ai/fr
- **Docs complètes**: https://docs.kie.ai
- **API Key**: https://kie.ai/api-key
- **Marketplace**: https://kie.ai/market
- **Changelog**: https://kie.ai/changelog

### Support
- **Email**: support@kie.ai
- **Discord**: Communauté disponible
- **Support**: 24/7

### Quickstarts
- 4o Image: https://docs.kie.ai/4o-image-api/quickstart
- Flux Kontext: https://docs.kie.ai/flux-kontext-api/quickstart
- Veo 3.1: https://docs.kie.ai/veo3.1-api/quickstart
- Runway: https://docs.kie.ai/runway-api/quickstart
- Suno: https://docs.kie.ai/suno-api/quickstart

---

## ⚠️ Notes Importantes

### Ce que kie.ai N'offre PAS
- ❌ **LLM / Chat APIs** (pas de Claude, GPT)
- ❌ **Text generation**
- ❌ **Completion APIs**

**Solution**: Utiliser **Anthropic API directe** pour Claude:
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
```

### Avertissements
- ⚠️ Crédits peuvent "disparaître" selon certains avis
- ⚠️ Tester avec free trial avant engagement
- ⚠️ Support client variable selon témoignages

### Recommandation
✅ **Bon pour**: Images, vidéos, musique (usage modéré)
⚠️ **Précaution**: Monitorer crédits de près
❌ **Pas pour**: Génération de texte (utiliser Anthropic)

---

## 🎯 Stack Final Recommandé

```
┌─────────────────────────────────────────┐
│  STACK AUTOSCALE FACEBOOK AUTOMATION    │
└─────────────────────────────────────────┘

📝 Texte (Contenu Posts):
   → Anthropic Claude Sonnet 4.5 (API directe)
   → $12-15/mois

🖼️ Images (Posts Facebook):
   → DALL-E 3 (OpenAI) [Actuel]
   → 4o Image (kie.ai) [Test futur]
   → $30-50/mois ou $20-40/mois

🎬 Vidéos (Futur):
   → Veo 3.1 (kie.ai)
   → Runway (kie.ai)
   → $10-30/mois (usage modéré)

🎵 Musique (Futur):
   → Suno (kie.ai)
   → $5-15/mois (usage occasionnel)

💾 Backend:
   → Hetzner CX33: $6/mois
   → Supabase Pro: $0 (payé)

📊 TOTAL: $63-116/mois (MVP + Futur scale)
```

---

**Date**: 18 Novembre 2025
**Status**: ✅ Documentation complète
**Prochaine étape**: Test A/B images (optionnel)
