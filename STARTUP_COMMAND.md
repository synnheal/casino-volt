# ⚡ Commande Startup pour Pterodactyl

## 🚨 Problèmes avec l'ancienne commande

### **Commande incorrecte :**
```bash
npm install && npx prisma generate && npx prisma db push --accept-data-loss && npm run build && npx --yes pm2@latest start ecosystem.config.js && npx pm2 logs
```

### **Problèmes identifiés :**

1. **❌ `npx prisma db push --accept-data-loss`**
   - Peut **supprimer des données** en production
   - `db push` est pour le développement uniquement
   - Pas de gestion de migrations propre

2. **⚠️ `npx --yes pm2@latest start`**
   - Télécharge PM2 à chaque fois (inutile)
   - PM2 est déjà installé localement via npm

3. **🔴 `npx pm2 logs` - CRITIQUE**
   - **Commande bloquante** qui ne se termine jamais
   - Pterodactyl attend que la commande se termine
   - Le serveur n'est jamais considéré comme "démarré"
   - Empêche les opérations suivantes

4. **❌ Pas de nettoyage des anciens processus**
   - Les anciens processus PM2 restent actifs
   - Peut causer des conflits de ports
   - Accumulation de processus zombies

---

## ✅ Commande Startup CORRIGÉE

### **Version Recommandée (Copier dans Pterodactyl Panel)**

```bash
npm install && npx prisma generate && npx prisma migrate deploy && npm run build && pm2 delete all || true && pm2 start ecosystem.config.js && pm2 save
```

---

## 📖 Explication détaillée

### **1. `npm install`**
- Installe toutes les dépendances depuis package.json
- Met à jour si nécessaire

### **2. `npx prisma generate`**
- Génère le client Prisma TypeScript
- Nécessaire pour que l'app puisse communiquer avec la DB

### **3. `npx prisma migrate deploy`** ✅
- **Applique les migrations en production**
- **Ne perd JAMAIS de données**
- Suit un historique de migrations
- Recommandé par Prisma pour la production

### **4. `npm run build`**
- Build l'application Next.js en mode production
- Optimise le code pour les performances

### **5. `pm2 delete all || true`**
- Supprime tous les anciens processus PM2
- `|| true` : continue même si aucun processus n'existe
- Évite les conflits de ports

### **6. `pm2 start ecosystem.config.js`**
- Démarre les 2 applications :
  - **backend** : Serveur Socket.io (port 3001)
  - **frontend** : Next.js (port 8006)

### **7. `pm2 save`**
- Sauvegarde la liste des processus
- Permet de restaurer après un redémarrage

---

## 🎛️ Configuration dans Pterodactyl Panel

### **Startup Command**
```bash
npm install && npx prisma generate && npx prisma migrate deploy && npm run build && pm2 delete all || true && pm2 start ecosystem.config.js && pm2 save
```

### **Stop Command**
```bash
pm2 stop all && pm2 save
```

### **Restart Command (optionnel)**
```bash
pm2 restart all
```

---

## 🔄 Autres variantes

### **Version développement (avec logs)**
⚠️ Ne PAS utiliser dans Pterodactyl startup !
```bash
npm install && npx prisma generate && npx prisma migrate dev && npm run build && pm2 delete all || true && pm2 start ecosystem.config.js && pm2 logs
```

### **Version ultra-rapide (si déjà installé)**
```bash
pm2 restart all || pm2 start ecosystem.config.js
```

### **Version avec reset DB (⚠️ DANGER - Perte de données)**
```bash
npm install && npx prisma generate && npx prisma migrate reset --force && npm run build && pm2 delete all || true && pm2 start ecosystem.config.js && pm2 save
```

### **Version avec script personnalisé**
```bash
bash startup.sh
```

---

## 🔍 Vérification après démarrage

### **1. Vérifier le statut PM2**
```bash
pm2 status
```

Résultat attendu :
```
┌────┬─────────────┬─────────┬─────────┬──────────┬────────┐
│ id │ name        │ mode    │ ↺       │ status   │ cpu    │
├────┼─────────────┼─────────┼─────────┼──────────┼────────┤
│ 0  │ backend     │ fork    │ 0       │ online   │ 0%     │
│ 1  │ frontend    │ fork    │ 0       │ online   │ 0%     │
└────┴─────────────┴─────────┴─────────┴──────────┴────────┘
```

### **2. Voir les logs**
```bash
pm2 logs --lines 50
```

### **3. Vérifier les ports**
```bash
netstat -tulpn | grep LISTEN
```

Vous devriez voir :
- `:8006` (Frontend Next.js)
- `:3001` (Backend Socket.io)

---

## 🐛 Dépannage

### **Si "backend" crash immédiatement**

1. **Voir les erreurs**
   ```bash
   pm2 logs backend --err --lines 50
   ```

2. **Causes communes :**
   - Variables d'environnement manquantes (`.env`)
   - Base de données inaccessible
   - Port 3001 déjà utilisé
   - Prisma client non généré

3. **Tester manuellement**
   ```bash
   node server/index.mjs
   ```

### **Si "frontend" crash**

1. **Voir les erreurs**
   ```bash
   pm2 logs frontend --err --lines 50
   ```

2. **Causes communes :**
   - Build Next.js échoué
   - Port 8006 déjà utilisé
   - Variables d'environnement manquantes

3. **Rebuild**
   ```bash
   npm run build
   pm2 restart frontend
   ```

### **Si "too many restarts"**

PM2 arrête l'app après trop de crashs.

```bash
# Voir la vraie erreur
pm2 logs backend --err --lines 100

# Augmenter la limite
pm2 stop all
pm2 delete all
# Éditer ecosystem.config.js : max_restarts: 20
pm2 start ecosystem.config.js
```

---

## ✅ Checklist de démarrage

- [ ] `.env` configuré avec toutes les variables
- [ ] Base de données PostgreSQL accessible
- [ ] Ports 8006 et 3001 alloués dans Pterodactyl
- [ ] `npm install` a fonctionné sans erreur
- [ ] `npx prisma generate` a fonctionné
- [ ] `npx prisma migrate deploy` a appliqué les migrations
- [ ] `npm run build` a build Next.js
- [ ] PM2 affiche les 2 apps en "online"
- [ ] Site accessible via l'URL configurée

---

## 📞 Support

Si problèmes persistent :

1. Récupérer les logs : `pm2 logs --lines 100 > logs.txt`
2. Vérifier la config : `cat ecosystem.config.js`
3. Vérifier le .env : `cat .env` (⚠️ masquer les secrets)
4. État PM2 : `pm2 status`

---

**La commande startup corrigée devrait résoudre tous les problèmes de démarrage !** 🚀
