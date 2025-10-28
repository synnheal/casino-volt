# 🔐 Configuration des Variables d'Environnement sur Pterodactyl

## ❌ Problème Actuel
```
Error: Environment variable not found: DATABASE_URL.
```

Cela signifie que Prisma ne trouve pas les variables d'environnement nécessaires.

---

## ✅ **SOLUTION : 2 Méthodes**

### **Méthode 1 : Fichier .env (RECOMMANDÉ)**

C'est la méthode la plus simple et la plus sécurisée.

#### **Étape 1 : Vérifier si le fichier .env existe**

Dans la console Pterodactyl :
```bash
ls -la .env
```

Si tu vois `No such file or directory`, le fichier n'existe pas.

#### **Étape 2 : Créer le fichier .env**

```bash
nano .env
```

#### **Étape 3 : Copier-coller cette configuration**

**⚠️ IMPORTANT : Remplace TOUTES les valeurs par les tiennes !**

```env
# Base de données PostgreSQL
# Format: postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL="postgresql://votre_user:votre_password@votre_host:5432/casino_volt?schema=public"

# JWT Secret (Générer un secret unique)
# Commande pour générer : openssl rand -base64 32
JWT_SECRET="METS_ICI_UN_SECRET_ALEATOIRE_TRES_LONG"

# Discord OAuth2 (Depuis https://discord.com/developers/applications)
DISCORD_CLIENT_ID="ton_client_id_discord"
DISCORD_CLIENT_SECRET="ton_client_secret_discord"
DISCORD_REDIRECT_URI="https://ton-domaine.com/api/auth/callback"

# URLs de l'application
NEXTAUTH_URL="https://ton-domaine.com"
CLIENT_URL="https://ton-domaine.com"

# Port du serveur Socket.io
SOCKET_PORT="3001"

# Environment
NODE_ENV="production"
```

#### **Étape 4 : Sauvegarder le fichier**

- Appuie sur `CTRL + X`
- Appuie sur `Y` (Yes)
- Appuie sur `ENTER`

#### **Étape 5 : Vérifier que le fichier existe**

```bash
ls -la .env
cat .env  # Affiche le contenu (⚠️ masque les secrets en public)
```

#### **Étape 6 : Vérifier la configuration**

```bash
bash check-env.sh
```

Tu devrais voir :
```
✅ Fichier .env trouvé
📋 Variables d'environnement chargées:
  ✓ DATABASE_URL (définie)
  ✓ JWT_SECRET (définie)
  ✓ DISCORD_CLIENT_ID (définie)
  ...
```

---

### **Méthode 2 : Variables d'environnement Pterodactyl Panel**

Si Pterodactyl ne charge pas le fichier `.env`, tu peux les définir dans le panel.

#### **Étape 1 : Aller dans le Panel Pterodactyl**

1. Ouvre ton panel Pterodactyl
2. Va dans l'onglet **Startup**
3. Scroll jusqu'à **Environment Variables**

#### **Étape 2 : Ajouter chaque variable**

Ajoute les variables suivantes (⚠️ avec tes vraies valeurs) :

| Variable | Valeur Exemple |
|----------|----------------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | `ton_secret_aleatoire` |
| `DISCORD_CLIENT_ID` | `123456789` |
| `DISCORD_CLIENT_SECRET` | `abc123secret` |
| `DISCORD_REDIRECT_URI` | `https://ton-domaine.com/api/auth/callback` |
| `NEXTAUTH_URL` | `https://ton-domaine.com` |
| `CLIENT_URL` | `https://ton-domaine.com` |
| `SOCKET_PORT` | `3001` |
| `NODE_ENV` | `production` |

#### **Étape 3 : Redémarrer le serveur**

Redémarre depuis le panel pour que les variables soient chargées.

---

## 🔧 **Commande Startup Corrigée**

### **Version avec vérification du .env**

Remplace ta startup command par celle-ci :

```bash
if [ ! -f .env ]; then echo "❌ ERREUR: Fichier .env manquant! Créez-le d'abord."; exit 1; fi && npm install && npx prisma generate && npx prisma migrate deploy && npm run build && pm2 delete all || true && pm2 start ecosystem.config.js && pm2 save
```

Cette commande :
1. ✅ Vérifie que le `.env` existe avant de continuer
2. ✅ Affiche un message d'erreur clair si absent
3. ✅ Continue normalement si tout est OK

---

## 🐛 **Résolution des Erreurs Communes**

### **Erreur : `DATABASE_URL not found`**

**Cause :** Le fichier `.env` n'existe pas ou est mal configuré.

**Solution :**
```bash
# Vérifier si .env existe
ls -la .env

# Si non, le créer
nano .env
# Copier la configuration du dessus

# Vérifier le contenu
cat .env
```

### **Erreur : `pm2: command not found`**

**Cause :** Le script s'arrête avant d'installer les dépendances (à cause de l'erreur .env).

**Solution :**
1. Créer d'abord le fichier `.env`
2. Relancer la startup command

### **Erreur : `Prisma migrate failed`**

**Cause :** La base de données n'est pas accessible.

**Solution :**
```bash
# Tester la connexion à la base de données
npx prisma db pull

# Si erreur, vérifier DATABASE_URL dans .env
```

---

## 🎯 **Guide Complet de Configuration - ÉTAPE PAR ÉTAPE**

### **1️⃣ Arrêter le serveur**
```bash
pm2 stop all || true
pm2 delete all || true
```

### **2️⃣ Créer le fichier .env**
```bash
nano .env
# Copier la configuration ci-dessus
# Sauvegarder avec CTRL+X, Y, ENTER
```

### **3️⃣ Vérifier la configuration**
```bash
bash check-env.sh
```

### **4️⃣ Installer les dépendances**
```bash
npm install
```

### **5️⃣ Générer Prisma**
```bash
npx prisma generate
```

### **6️⃣ Tester la connexion DB**
```bash
npx prisma db pull
# Si erreur, vérifier DATABASE_URL
```

### **7️⃣ Appliquer les migrations**
```bash
npx prisma migrate deploy
```

### **8️⃣ Build Next.js**
```bash
npm run build
```

### **9️⃣ Démarrer avec PM2**
```bash
pm2 start ecosystem.config.js
pm2 save
```

### **🔟 Vérifier le statut**
```bash
pm2 status
pm2 logs
```

---

## ✅ **Checklist Finale**

Avant de démarrer, vérifie :

- [ ] Le fichier `.env` existe (`ls -la .env`)
- [ ] Toutes les variables sont remplies (`cat .env`)
- [ ] `DATABASE_URL` est correcte (format PostgreSQL)
- [ ] `JWT_SECRET` est un secret aléatoire long
- [ ] Discord OAuth2 est configuré avec les bons IDs
- [ ] Les URLs correspondent à ton domaine
- [ ] La base de données PostgreSQL est accessible
- [ ] Les ports 8006 et 3001 sont alloués dans Pterodactyl

---

## 🆘 **Commandes de Debug**

```bash
# Vérifier si .env existe
ls -la .env

# Afficher le contenu de .env (⚠️ masquer les secrets)
cat .env

# Tester la connexion à la base de données
npx prisma db pull

# Vérifier les variables chargées
bash check-env.sh

# Voir les logs PM2
pm2 logs --lines 50

# Tester le serveur manuellement
node server/index.mjs
```

---

## 🎓 **Comment Générer un JWT_SECRET**

### **Option 1 : Avec OpenSSL (Linux/Mac)**
```bash
openssl rand -base64 32
```

### **Option 2 : Avec Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### **Option 3 : Générateur en ligne**
Visite : https://www.uuidgenerator.net/api/guid

---

## 📞 **Besoin d'Aide ?**

Si tu as toujours l'erreur après avoir créé le `.env` :

1. Vérifie que le fichier existe : `ls -la .env`
2. Vérifie le contenu : `cat .env`
3. Lance le check : `bash check-env.sh`
4. Envoie-moi les logs : `pm2 logs --err --lines 50`

---

**En résumé : CRÉE D'ABORD LE FICHIER .env, puis relance la startup command !** 🚀
