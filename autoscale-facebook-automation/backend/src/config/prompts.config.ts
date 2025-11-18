/**
 * Configuration centralisée des prompts IA
 * Qualité maximale garantie
 */

export const CONTENT_PROMPTS: Record<string, string> = {
  case_study: `
Crée un post Facebook engageant présentant une étude de cas réelle d'une PME québécoise qui a amélioré sa gestion d'appels avec une réceptionniste IA 24/7.

Structure:
1. Hook: Problème initial du client (ex: "50% d'appels manqués")
2. Solution: Comment AutoScale AI a aidé (installation rapide, IA bilingue)
3. Résultats: Métriques concrètes (% amélioration, revenus générés, temps économisé)
4. CTA: Invitation douce à partager leur défi

Exemples de clients types:
- Plombier (urgences 24/7)
- Émondeur (saison haute débordée)
- Électricien (qualification leads)
- Entrepreneur général (multi-chantiers)

Ton: Professionnel mais accessible, empathique, québécois authentique
`,

  statistic: `
Crée un post Facebook basé sur une statistique percutante sur les appels manqués dans les PME québécoises.

Statistiques réelles à utiliser:
- 72% des PME québécoises utilisent déjà l'IA (CCIQ 2024)
- 30% d'appels manqués en moyenne dans services (industrie)
- 1 appel manqué = 200-500$ de revenu perdu (selon secteur)
- 85% des clients raccrochent après 3 sonneries

Structure:
1. Statistique choc (premier line)
2. Impact concret ("Ça représente X$/mois de perdu")
3. Question engageante ("Et vous, combien d'appels manquez-vous?")
4. Teaser solution subtil (pas vendeur)

Ton: Factuel, expert, interpellant sans être alarmiste
`,

  tip: `
Crée un post Facebook offrant un conseil pratique aux PME québécoises pour améliorer leur service client téléphonique.

Conseils possibles:
- Analyser heures de pointe d'appels
- Mesurer taux d'appels manqués (outil gratuit)
- Optimiser message vocal professionnel
- Qualifier questions importantes avant rappel
- Prioriser urgences vs demandes info

Structure:
1. Problème commun identifiable ("Vous recevez 20 appels pendant le lunch?")
2. Astuce concrète et actionnable (facile à implémenter)
3. Bénéfice mesurable ("= 15% de clients satisfaits en plus")
4. Bonus: Lien vers solution IA (optionnel, subtil)

Ton: Aidant, expert bienveillant, coach business
`,

  news: `
Crée un post Facebook sur une actualité récente dans le domaine de l'IA pour PME au Québec.

Actualités possibles:
- Nouvelles subventions gouvernementales IA (Québec/Canada)
- Tendances adoption IA PME 2025
- Innovations téléphonie IA (Azure, Google, etc.)
- Success stories locales
- Changements réglementaires

Structure:
1. News (quoi de neuf?)
2. Pourquoi c'est important pour PME québécoises
3. Comment s'en servir/se préparer
4. Positionnement AutoScale AI (naturel, pas forcé)

Ton: Informé, à jour, thought leader du secteur
`,

  testimonial: `
Crée un post Facebook mettant en avant un témoignage client authentique.

Format témoignage:
[Nom Entreprise], [Secteur], [Ville]
"Citation directe du propriétaire sur bénéfice principal"
- Avant: [Problème spécifique]
- Après: [Résultat mesurable]

Exemples de bénéfices à mettre en avant:
- Zéro appel manqué (même nuit/weekend)
- Qualification automatique leads (économie temps)
- Réponses instantanées 24/7 (satisfaction client)
- Revenu additionnel (appels convertis qu'ils manquaient avant)

Structure:
1. Intro: "Voici comment [Client] a transformé leur service client"
2. Citation témoignage (authentique, émotionnelle)
3. Résultats chiffrés (avant/après)
4. CTA: "Votre entreprise a un défi similaire?"

Ton: Inspirant, preuve sociale, crédible
`,

  default: `
Crée un post Facebook engageant pour AutoScale AI, réceptionniste IA téléphonique 24/7 pour PME québécoises.

Focus sur:
- Problème réel PME (appels manqués, surcharge, qualification)
- Solution simple et efficace
- Bénéfices concrets et mesurables
- Ton québécois authentique professionnel

Structure libre mais engageante. Maximum 180 caractères.
`,
};

/**
 * Prompts système par variation de style
 */
export const STYLE_MODIFIERS = {
  professional: `
Style: Professionnel basé sur données
- Commencer par statistique/fait concret
- Inclure chiffres et pourcentages
- Ton expert mais accessible
- CTA: proposition de valeur claire
`,

  storytelling: `
Style: Storytelling client
- Commencer par mini-histoire (2-3 phrases)
- Exemple concret entreprise québécoise
- Ton humain et authentique
- CTA: invitation à partager leur histoire
`,

  question: `
Style: Question engageante
- Commencer par question percutante
- Créer réflexion
- Pas de réponse directe (engagement)
- CTA: encourager commentaires/discussion
`,
};

/**
 * Validation des clichés IA à éviter
 */
export const AI_CLICHES_BLACKLIST = [
  'révolutionnaire',
  'game-changer',
  'game changer',
  'disruptif',
  'paysage changeant',
  'monde d\'aujourd\'hui',
  'à l\'ère du',
  'à l\'ère de la',
  'il est important de noter',
  'en conclusion',
  'dans un monde où',
  'aujourd\'hui plus que jamais',
  'sans précédent',
];

/**
 * Hashtags par type de contenu
 */
export const HASHTAGS_BY_TYPE: Record<string, string[]> = {
  case_study: ['#ÉtudeDeCas', '#ROI', '#Témoignage', '#SuccèsClient'],
  statistic: ['#Statistiques', '#Données', '#Insights', '#ÉtudeMarché'],
  tip: ['#Conseil', '#BonnesPratiques', '#Astuce', '#PMEQuébec'],
  news: ['#Actualité', '#Innovation', '#TechQuébec', '#IA2025'],
  testimonial: ['#Témoignage', '#ClientSatisfait', '#Succès', '#Résultats'],
};

/**
 * Hashtags de base (toujours inclus)
 */
export const BASE_HASHTAGS = [
  '#IAQuébec',
  '#PMEQuébec',
  '#AutomationTéléphonique',
  '#ServiceClient',
];
