# Guide Rapide: Whitelist IP Namecheap

## 🎯 Objectif
Ajouter l'IP `157.157.221.30` à ta liste d'IPs autorisées dans Namecheap

## 📋 Étapes (2 minutes)

### 1. Ouvre la page de gestion des IPs
🔗 **URL directe:** https://ap.www.namecheap.com/settings/tools/apiaccess/whitelisted-ips

### 2. Clique sur "Add New IP Address"
- Tu verras un formulaire avec deux champs

### 3. Remplis les informations
```
IP Address: 157.157.221.30
Name: AutoScale AI Claude Code Server
```

### 4. Clique sur "Add IP"
- L'IP sera ajoutée instantanément

### 5. Vérifie que l'IP apparaît dans la liste
- Tu devrais voir "2 of 20 IPs in Use" (tu avais déjà 142.169.187.248)

## ✅ Vérification

Une fois fait, exécute ce test dans ton terminal:

```bash
python3 ~/test_namecheap.py
```

**Résultat attendu:**
```
✅ Connection successful!
📋 Found X domain(s):
   🌐 Domain: autoscaleai.ca
```

## 🚀 Après le whitelist

Redémarre Claude Code pour activer les MCP servers, puis tu pourras:

```
"Liste mes domaines Namecheap"
"Crée un record A pour api.autoscaleai.ca"
"Montre les DNS de autoscaleai.ca"
```

---

## 📸 Captures d'écran de référence

### Page principale API Access
![Current state]
- API Key: 7c0976...9336 ✅
- IP whitelistée actuelle: 142.169.187.248

### Page Whitelisted IPs
- Bouton "Add New IP Address" en haut à droite
- Liste des IPs avec dates

### Après ajout
- IP: 157.157.221.30 ✅
- Name: AutoScale AI Claude Code Server
- Date: Nov 18, 2025
