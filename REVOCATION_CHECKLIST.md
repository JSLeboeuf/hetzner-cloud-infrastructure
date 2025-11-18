# 🚨 CHECKLIST DE RÉVOCATION DES CREDENTIALS

## ⏰ À FAIRE IMMÉDIATEMENT

### 1. STRIPE (CRITIQUE - vérifier d'abord les transactions)
- [ ] Aller sur https://dashboard.stripe.com/test/apikeys (si test)
- [ ] Aller sur https://dashboard.stripe.com/apikeys (si live)
- [ ] Vérifier les paiements des dernières 24h
- [ ] Révoquer : `sk_live_51REXsxGjhCSzv4wl...`
- [ ] Générer nouvelle clé
- [ ] ✍️ Nouvelle clé : ___________________________________

### 2. SUPABASE - Projet BP EMONDAGE
- [ ] Aller sur https://supabase.com/dashboard/project/tddeimkdqpnsnhqwzlnx/settings/api
- [ ] Vérifier Activity logs
- [ ] Régénérer service_role key
- [ ] ✍️ Nouvelle service_role : ___________________________________

### 3. SUPABASE - Projet NEXUS
- [ ] Aller sur https://supabase.com/dashboard/project/phiduqxcufdmgjvdipyu/settings/api
- [ ] Vérifier Activity logs
- [ ] Régénérer service_role key
- [ ] ✍️ Nouvelle service_role : ___________________________________

### 4. SUPABASE - Projet AutoScale AI
- [ ] Aller sur https://supabase.com/dashboard/project/ymwaxkvwypknfumxqhzv/settings/api
- [ ] Vérifier Activity logs
- [ ] Régénérer service_role key
- [ ] ✍️ Nouvelle service_role : ___________________________________

### 5. OPENAI
- [ ] Aller sur https://platform.openai.com/api-keys
- [ ] Vérifier Usage (dernières 24h)
- [ ] Révoquer : `sk-proj-ly32eYECSkC4sKid...`
- [ ] Créer nouvelle clé avec limite de dépense
- [ ] ✍️ Nouvelle clé : ___________________________________

### 6. ANTHROPIC
- [ ] Aller sur https://console.anthropic.com/settings/keys
- [ ] Vérifier Usage
- [ ] Révoquer : `sk-ant-api03-uBzmhKVf...`
- [ ] Créer nouvelle clé
- [ ] ✍️ Nouvelle clé : ___________________________________

### 7. GITHUB
- [ ] Aller sur https://github.com/settings/tokens
- [ ] Révoquer : `ghp_TVVgXuLuariKHwVDrEam...`
- [ ] Créer nouveau token avec scopes minimaux
- [ ] Activer 2FA si pas déjà fait
- [ ] ✍️ Nouveau token : ___________________________________

### 8. TWILIO
- [ ] Aller sur https://console.twilio.com/
- [ ] Account > API keys & tokens
- [ ] Révoquer auth token actuel
- [ ] Générer nouveau token
- [ ] ✍️ Nouveau auth token : ___________________________________

### 9. VERCEL
- [ ] Aller sur https://vercel.com/account/tokens
- [ ] Révoquer : `8Co22RcOosGL8DVfV3NLxttT`
- [ ] Créer nouveau token
- [ ] ✍️ Nouveau token : ___________________________________

### 10. RESEND
- [ ] Aller sur https://resend.com/api-keys
- [ ] Révoquer : `re_J51MddNt_L9PeBzgDqyNUk6hT...`
- [ ] Créer nouvelle clé
- [ ] ✍️ Nouvelle clé : ___________________________________

## 📊 STATUT

- [ ] Toutes les clés critiques révoquées
- [ ] Nouvelles clés générées
- [ ] Nouvelles clés stockées en sécurité (1Password/Bitwarden)
- [ ] Fichier .env mis à jour avec NOUVELLES clés
- [ ] .env ajouté au .gitignore
- [ ] Tests de connexion avec nouvelles clés réussis

## ⏭️ APRÈS LA RÉVOCATION

Une fois TOUTES les clés révoquées et les nouvelles générées :
1. Stocker les nouvelles clés dans un gestionnaire de mots de passe
2. Créer le fichier .env avec les NOUVELLES clés
3. Tester que tout fonctionne
4. Activer le monitoring sur tous les services
5. Configurer des alertes de sécurité

---

**Date de révocation** : _______________
**Complété par** : _______________
**Temps total** : _______________ minutes
