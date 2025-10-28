#!/bin/bash
# Script de démarrage pour Pterodactyl - Casino Volt

set -e  # Arrête si une commande échoue

echo "🔧 Installation des dépendances..."
npm install

echo "🗄️  Génération du client Prisma..."
npx prisma generate

echo "📊 Application des migrations..."
npx prisma migrate deploy

echo "🏗️  Build de l'application Next.js..."
npm run build

echo "🧹 Nettoyage des anciens processus PM2..."
pm2 delete all || true

echo "🚀 Démarrage des serveurs..."
pm2 start ecosystem.config.js

echo "💾 Sauvegarde de la configuration PM2..."
pm2 save

echo "✅ Démarrage terminé !"
echo ""
echo "📊 Statut des serveurs :"
pm2 status

echo ""
echo "💡 Commandes utiles :"
echo "  - Voir les logs : pm2 logs"
echo "  - Statut : pm2 status"
echo "  - Redémarrer : pm2 restart all"
echo "  - Arrêter : pm2 stop all"
