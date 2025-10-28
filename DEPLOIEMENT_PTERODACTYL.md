# 🚀 Déploiement sur Pterodactyl - Casino Volt

## 📋 Prérequis

- Node.js 18+ installé sur votre instance Pterodactyl
- PostgreSQL configuré et accessible
- Variables d'environnement configurées

---

## 🔧 Configuration Initiale

### 1. **Cloner/Uploader le projet**
```bash
# Si vous avez accès Git
git clone https://github.com/synnheal/casino-volt.git
cd casino-volt

# OU uploader via SFTP/Panel
```

### 2. **Configurer les variables d'environnement**
Créer le fichier `.env` à la racine du projet :

```bash
nano .env
```

Copier et remplir :
```env
# Base de données PostgreSQL
DATABASE_URL="postgresql://user:password@host:5432/casino_volt?schema=public"

# JWT Secret (générer avec: openssl rand -base64 32)
JWT_SECRET="votre_secret_jwt_tres_securise"

# Discord OAuth2
DISCORD_CLIENT_ID="votre_client_id"
DISCORD_CLIENT_SECRET="votre_client_secret"
DISCORD_REDIRECT_URI="https://votre-domaine.com/api/auth/callback"

# URL de l'application
NEXTAUTH_URL="https://votre-domaine.com"

# URL du client pour CORS (Socket.io)
CLIENT_URL="https://votre-domaine.com"

# Port du serveur Socket.io (doit être ouvert dans Pterodactyl)
SOCKET_PORT="3001"

# Environment
NODE_ENV="production"
```

### 3. **Installer les dépendances**
```bash
npm install
```

### 4. **Générer le client Prisma**
```bash
npx prisma generate
```

### 5. **Exécuter les migrations de base de données**
```bash
npx prisma migrate deploy
```

### 6. **Builder l'application Next.js**
```bash
npm run build
```

---

## 🎮 Démarrage avec PM2

### **Arrêter les anciens processus**
```bash
pm2 stop all
pm2 delete all
```

### **Démarrer avec ecosystem.config.js**
```bash
pm2 start ecosystem.config.js
```

### **Vérifier le statut**
```bash
pm2 status
```

Vous devriez voir :
```
┌────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬──────────┐
│ id │ name        │ mode    │ ↺       │ status   │ cpu    │ mem  │
├────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼──────────┤
│ 0  │ backend     │ fork    │ 0       │ online   │ 0%     │ 50mb │
│ 1  │ frontend    │ fork    │ 0       │ online   │ 0%     │ 120mb│
└────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴──────────┘
```

### **Voir les logs**
```bash
# Tous les logs
pm2 logs

# Logs du backend seulement
pm2 logs backend

# Logs du frontend seulement
pm2 logs frontend

# Dernières 50 lignes
pm2 logs --lines 50
```

### **Redémarrer après modifications**
```bash
# Redémarrer tout
pm2 restart all

# Redémarrer uniquement le backend
pm2 restart backend

# Redémarrer uniquement le frontend
pm2 restart frontend
```

---

## 🐛 Résolution des Erreurs Courantes

### **Erreur: "Cannot use import statement outside a module"**

**Cause**: PM2 essaie d'exécuter un fichier `.js` au lieu de `.mjs`

**Solution**:
```bash
# 1. Supprimer les anciens processus
pm2 delete all

# 2. Vérifier qu'il n'y a pas de server/start.js
rm -f server/start.js

# 3. Vérifier ecosystem.config.js (doit pointer vers index.mjs)
cat ecosystem.config.js

# 4. Relancer
pm2 start ecosystem.config.js
```

### **Erreur: "Too many unstable restarts"**

**Cause**: Le processus crash immédiatement au démarrage

**Solution**:
```bash
# 1. Voir les logs d'erreur
pm2 logs backend --err --lines 50

# 2. Vérifier les variables d'environnement
cat .env

# 3. Vérifier que Prisma est généré
npx prisma generate

# 4. Redémarrer proprement
pm2 stop all
pm2 delete all
pm2 start ecosystem.config.js
```

### **Erreur: Port déjà utilisé**

**Solution**:
```bash
# Trouver le processus qui utilise le port
lsof -i :8006  # Frontend
lsof -i :3001  # Backend Socket.io

# Tuer le processus
kill -9 <PID>

# Redémarrer PM2
pm2 restart all
```

### **Erreur: Prisma ne se connecte pas à la base de données**

**Solution**:
```bash
# Tester la connexion
npx prisma db pull

# Si erreur, vérifier DATABASE_URL dans .env
echo $DATABASE_URL

# Regénérer le client
npx prisma generate
```

---

## 🔄 Mise à Jour du Code

```bash
# 1. Arrêter les serveurs
pm2 stop all

# 2. Pull les dernières modifications
git pull origin main

# 3. Installer les nouvelles dépendances
npm install

# 4. Regénérer Prisma si nécessaire
npx prisma generate

# 5. Appliquer les migrations
npx prisma migrate deploy

# 6. Rebuild Next.js
npm run build

# 7. Redémarrer
pm2 restart all
```

---

## 📊 Monitoring

### **Dashboard PM2**
```bash
pm2 monit
```

### **Sauvegarder la configuration PM2**
```bash
pm2 save
pm2 startup
```

### **Vérifier l'utilisation des ressources**
```bash
pm2 status
pm2 describe backend
pm2 describe frontend
```

---

## 🔐 Ports Requis dans Pterodactyl

Assurez-vous que ces ports sont ouverts dans votre allocation Pterodactyl :

- **8006** : Frontend Next.js (principal)
- **3001** : Backend Socket.io (jeu Crash)

---

## 📝 Scripts Utiles

```bash
# Reconstruire tout
npm run build

# Lancer en développement (local uniquement)
npm run dev:all

# Lancer le serveur Socket.io seul
npm run server

# Migrations Prisma
npm run prisma:migrate

# Générer client Prisma
npm run prisma:generate
```

---

## 🆘 Commandes de Debug

```bash
# Vérifier les processus Node
ps aux | grep node

# Vérifier les ports utilisés
netstat -tulpn | grep LISTEN

# Voir tous les logs en temps réel
pm2 logs --raw

# Redémarrer en mode debug
pm2 restart backend --update-env
pm2 restart frontend --update-env

# Voir les variables d'environnement d'un process
pm2 env <id>
```

---

## ✅ Checklist Finale

- [ ] `.env` configuré avec toutes les variables
- [ ] `npm install` exécuté
- [ ] `npx prisma generate` exécuté
- [ ] `npx prisma migrate deploy` exécuté
- [ ] `npm run build` exécuté
- [ ] Ports 8006 et 3001 ouverts
- [ ] PM2 démarré avec `pm2 start ecosystem.config.js`
- [ ] Les deux processus (backend + frontend) sont "online"
- [ ] Accessible via https://votre-domaine.com

---

**En cas de problème persistant, vérifiez les logs avec `pm2 logs` !**
