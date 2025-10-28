# 🔄 Configuration pour Base de Données Partagée

## 📋 Situation

Tu utilises la **MÊME base de données PostgreSQL** pour :
- ✅ Bot Discord (gestion des crédits/utilisateurs)
- ✅ Site Web Casino Volt (interface web)

**C'est parfaitement normal !** Les deux utilisent le même schéma Prisma.

---

## ⚠️ Problème avec `prisma migrate deploy`

```
Error: P3005
The database schema is not empty.
```

**Pourquoi ?**
- `prisma migrate deploy` est fait pour les bases de données **vides**
- Ta base contient déjà les tables créées par le bot Discord
- Prisma refuse d'appliquer des migrations sur une base non vide

---

## ✅ **SOLUTION : Utiliser `prisma db push`**

### **Nouvelle Startup Command (pour base de données existante)**

```bash
npm install && npx prisma generate && npx prisma db push --skip-generate && npm run build && pm2 delete all || true && pm2 start ecosystem.config.js && pm2 save
```

### **Différence :**
- ❌ `prisma migrate deploy` → Pour bases vides + gestion de migrations
- ✅ `prisma db push` → Synchronise le schéma avec la base existante

### **Options :**
- `--skip-generate` : Évite de régénérer le client (déjà fait avant)

---

## 🔄 **Alternative : Créer une Migration Baseline**

Si tu veux quand même utiliser le système de migrations :

### **Étape 1 : Créer le dossier migrations**
```bash
mkdir -p prisma/migrations
```

### **Étape 2 : Créer une migration baseline**
```bash
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/0_init/migration.sql
```

### **Étape 3 : Marquer comme appliquée**
```bash
npx prisma migrate resolve --applied 0_init
```

### **Étape 4 : Utiliser migrate deploy**
```bash
npx prisma migrate deploy
```

**Mais pour toi, `db push` est plus simple !**

---

## 🎯 **Commandes Startup Recommandées**

### **Pour Base de Données EXISTANTE (TON CAS)**
```bash
npm install && npx prisma generate && npx prisma db push --skip-generate && npm run build && pm2 delete all || true && pm2 start ecosystem.config.js && pm2 save
```

### **Pour Base de Données VIDE (si tu réinitialises)**
```bash
npm install && npx prisma generate && npx prisma migrate deploy && npm run build && pm2 delete all || true && pm2 start ecosystem.config.js && pm2 save
```

### **Pour RESET complet (⚠️ DANGER - PERTE DE DONNÉES)**
```bash
npm install && npx prisma generate && npx prisma migrate reset --force && npm run build && pm2 delete all || true && pm2 start ecosystem.config.js && pm2 save
```

---

## 📖 **Explication : `db push` vs `migrate deploy`**

| Commande | Quand l'utiliser | Garde l'historique | Sûr en prod |
|----------|------------------|-------------------|-------------|
| `db push` | Dev + Base existante | ❌ Non | ⚠️ Avec prudence |
| `migrate deploy` | Production | ✅ Oui | ✅ Oui |
| `migrate dev` | Développement | ✅ Oui | ❌ Non |

**Pour ton cas (base partagée bot + site) :**
- ✅ `db push` fonctionne parfaitement
- ✅ Synchronise le schéma sans créer de migrations
- ✅ Ne touche pas aux données existantes

---

## 🔍 **Que fait `db push` exactement ?**

1. ✅ Compare le schéma Prisma avec la base de données
2. ✅ Ajoute les tables/colonnes manquantes
3. ✅ Modifie les colonnes si nécessaire
4. ✅ **Ne supprime RIEN** (sauf si explicitement demandé)
5. ✅ Garde toutes tes données

**Exemple :**
- Si la table `User` existe déjà → Ne fait rien
- Si une colonne manque → L'ajoute
- Si une colonne est en trop → La laisse (ne supprime pas)

---

## ⚙️ **Configuration dans Pterodactyl Panel**

### **Startup Command**
```bash
npm install && npx prisma generate && npx prisma db push --skip-generate && npm run build && pm2 delete all || true && pm2 start ecosystem.config.js && pm2 save
```

### **Stop Command**
```bash
pm2 stop all && pm2 save
```

---

## ✅ **Workflow Recommandé**

### **1. Bot Discord + Site partagent la même DB**

**Bot Discord :**
- Crée/gère les utilisateurs
- Gère les crédits
- Utilise le même schéma Prisma

**Site Web :**
- Lit les utilisateurs créés par le bot
- Gère les jeux (slots, crash, etc.)
- Utilise le même schéma Prisma

**Configuration :**
- Les deux utilisent la MÊME `DATABASE_URL`
- Les deux utilisent le même fichier `prisma/schema.prisma`
- Les deux génèrent le client avec `npx prisma generate`

### **2. Déploiement**

**Premier déploiement (base existante) :**
```bash
npx prisma db push
```

**Mises à jour du schéma :**
```bash
npx prisma db push
```

**Si tu veux passer aux migrations (optionnel) :**
```bash
npx prisma migrate dev --name init
npx prisma migrate deploy
```

---

## 🆘 **Dépannage**

### **Erreur : "The database schema is not empty"**
✅ **Solution :** Utilise `db push` au lieu de `migrate deploy`

### **Erreur : "Column already exists"**
✅ **Solution :** Normal, `db push` gère ça automatiquement

### **Erreur : "Cannot drop column (data loss)"**
⚠️ **Solution :** Utilise `--accept-data-loss` (⚠️ DANGER)
```bash
npx prisma db push --accept-data-loss
```

### **Vérifier l'état de la base**
```bash
npx prisma db pull  # Voir le schéma actuel
npx prisma studio   # Interface graphique (local)
```

---

## 📞 **Besoin d'Aide ?**

Si tu veux :
1. Synchroniser le schéma → `db push` ✅
2. Créer des migrations → Demande-moi, je t'aide
3. Vérifier que tout est OK → `npx prisma validate`

---

**En résumé : Utilise `db push` au lieu de `migrate deploy` et tout fonctionnera !** 🚀
