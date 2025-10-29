# 🔄 Fix : Pterodactyl Redémarre en Boucle

## 🚨 Problème

Pterodactyl redémarre constamment le serveur parce que :
1. Le script startup se termine après avoir lancé PM2
2. Pterodactyl détecte que le processus principal est terminé
3. Pterodactyl pense que c'est un crash
4. Pterodactyl relance automatiquement → **Boucle infinie**

---

## ✅ SOLUTION : Attacher PM2 au foreground

Il faut que le dernier processus **ne se termine jamais** pour que Pterodactyl sache que le serveur tourne.

### **Méthode 1 : Utiliser `pm2 logs` (RECOMMANDÉ)**

```bash
npm install && npx prisma generate && npx prisma db push --skip-generate && npm run build && npx pm2 delete all || true && npx pm2 start ecosystem.config.js && npx pm2 save && npx pm2 logs --raw
```

**Ajout à la fin :**
```bash
&& npx pm2 logs --raw
```

**Pourquoi ça marche ?**
- `pm2 logs` affiche les logs en temps réel
- C'est une commande **bloquante** (ne se termine jamais)
- Pterodactyl voit que le processus tourne toujours
- Les logs s'affichent directement dans la console Pterodactyl

---

### **Méthode 2 : Utiliser `pm2-runtime`**

```bash
npm install && npx prisma generate && npx prisma db push --skip-generate && npm run build && npx pm2-runtime start ecosystem.config.js
```

**Différences :**
- `pm2-runtime` est spécialement fait pour les containers/Pterodactyl
- Lance PM2 en mode **foreground** (ne daemonise pas)
- Pas besoin de `pm2 save`
- Plus simple, mais moins de contrôle

---

### **Méthode 3 : Boucle infinie (alternative)**

```bash
npm install && npx prisma generate && npx prisma db push --skip-generate && npm run build && npx pm2 delete all || true && npx pm2 start ecosystem.config.js && npx pm2 save && tail -f /dev/null
```

**Ajout à la fin :**
```bash
&& tail -f /dev/null
```

**Pourquoi ça marche ?**
- `tail -f /dev/null` est une commande qui ne se termine jamais
- Pterodactyl pense que le serveur tourne
- Pas de logs affichés (plus propre si tu veux)

---

## 🎯 Commande Recommandée pour Pterodactyl

### **OPTION A : Avec logs visibles (meilleure pour debug)**

```bash
npm install && npx prisma generate && npx prisma db push --skip-generate && npm run build && npx pm2 delete all || true && npx pm2 start ecosystem.config.js && npx pm2 save && npx pm2 logs --raw
```

**Avantages :**
- ✅ Voir les logs en temps réel dans Pterodactyl
- ✅ Facile de débugger
- ✅ Pterodactyl ne redémarre pas

**Inconvénient :**
- Les logs peuvent remplir la console

---

### **OPTION B : Sans logs (plus propre)**

```bash
npm install && npx prisma generate && npx prisma db push --skip-generate && npm run build && npx pm2 delete all || true && npx pm2 start ecosystem.config.js && npx pm2 save && tail -f /dev/null
```

**Avantages :**
- ✅ Console propre
- ✅ Pterodactyl ne redémarre pas
- ✅ Toujours accès aux logs avec `npx pm2 logs`

**Inconvénient :**
- Pas de logs visibles directement

---

### **OPTION C : Utiliser pm2-runtime (le plus simple)**

```bash
npm install && npx prisma generate && npx prisma db push --skip-generate && npm run build && npx pm2-runtime start ecosystem.config.js
```

**Avantages :**
- ✅ Le plus simple
- ✅ Fait pour les containers
- ✅ Logs automatiquement affichés
- ✅ Gestion propre des signaux (stop/restart)

**Inconvénient :**
- Pas de `pm2 save` (mais pas nécessaire avec pm2-runtime)

---

## 📊 Comparaison

| Méthode | Complexité | Logs visibles | Contrôle PM2 | Recommandé |
|---------|-----------|---------------|--------------|------------|
| `pm2 logs --raw` | Moyenne | ✅ Oui | ✅ Complet | ✅ Dev/Debug |
| `tail -f /dev/null` | Moyenne | ❌ Non | ✅ Complet | ✅ Production |
| `pm2-runtime` | Simple | ✅ Oui | ⚠️ Limité | ✅ Simplicité |

---

## 🔧 Configuration dans Pterodactyl Panel

### **Startup Command (Option A - Recommandée pour toi)**

```bash
npm install && npx prisma generate && npx prisma db push --skip-generate && npm run build && npx pm2 delete all || true && npx pm2 start ecosystem.config.js && npx pm2 save && npx pm2 logs --raw
```

### **Stop Command**

```bash
npx pm2 stop all
```

**Important :** Avec `pm2 logs --raw`, le stop sera géré automatiquement par Pterodactyl.

---

## 🆘 Dépannage

### **Le serveur redémarre toujours ?**

Vérifie que ta startup command **se termine bien par** :
- `&& npx pm2 logs --raw`
- OU `&& tail -f /dev/null`
- OU utilise `pm2-runtime`

### **Comment voir les logs si j'utilise `tail -f /dev/null` ?**

Ouvre une console SSH et tape :
```bash
npx pm2 logs
```

### **Comment arrêter proprement ?**

Depuis le panel Pterodactyl, clique sur **STOP**.

Ou en SSH :
```bash
npx pm2 stop all
```

---

## 🎯 Recommandation Finale

**Pour toi, utilise OPTION A** (avec `pm2 logs --raw`) :
```bash
npm install && npx prisma generate && npx prisma db push --skip-generate && npm run build && npx pm2 delete all || true && npx pm2 start ecosystem.config.js && npx pm2 save && npx pm2 logs --raw
```

**Pourquoi ?**
- ✅ Tu vois les logs en temps réel dans Pterodactyl
- ✅ Facile de débugger si problème
- ✅ Pterodactyl ne redémarre plus
- ✅ Tu peux surveiller le backend et frontend

---

## 📝 Ce qui va s'afficher dans Pterodactyl

```
[PM2] App [backend] launched
[PM2] App [frontend] launched
┌────┬─────────────┬──────────┐
│ id │ name        │ status   │
├────┼─────────────┼──────────┤
│ 0  │ backend     │ online   │
│ 1  │ frontend    │ online   │
└────┴─────────────┴──────────┘

0|backend  | 🚀 Serveur Crash Game lancé sur http://localhost:3001
1|frontend | ✓ Ready in 5.4s
1|frontend | ○ Compiling / ...
```

Et ça continue indéfiniment (jusqu'à ce que tu stoppes).

---

**Applique cette modification et ton serveur ne redémarrera plus en boucle !** 🚀
