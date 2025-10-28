#!/bin/bash
# Script de vérification de l'environnement

echo "🔍 Vérification de l'environnement Casino Volt"
echo "================================================"
echo ""

# Vérifier Node.js
echo "✓ Version Node.js:"
node --version
echo ""

# Vérifier si .env existe
if [ -f ".env" ]; then
    echo "✅ Fichier .env trouvé"
    echo ""
    echo "📋 Variables d'environnement chargées:"
    # Afficher les variables sans leurs valeurs pour la sécurité
    grep -v '^#' .env | grep '=' | cut -d '=' -f1 | while read var; do
        if [ ! -z "${!var}" ]; then
            echo "  ✓ $var (définie)"
        else
            echo "  ❌ $var (NON définie)"
        fi
    done
else
    echo "❌ ERREUR : Fichier .env introuvable !"
    echo ""
    echo "🔧 Pour créer le fichier .env :"
    echo "   1. cp .env.example .env"
    echo "   2. nano .env"
    echo "   3. Remplir toutes les variables"
    exit 1
fi

echo ""
echo "📦 node_modules:"
if [ -d "node_modules" ]; then
    echo "  ✅ Installé"
else
    echo "  ❌ Non installé - Exécutez 'npm install'"
fi

echo ""
echo "🗄️  Prisma Client:"
if [ -d "node_modules/.prisma/client" ]; then
    echo "  ✅ Généré"
else
    echo "  ❌ Non généré - Exécutez 'npx prisma generate'"
fi

echo ""
echo "🏗️  Build Next.js:"
if [ -d ".next" ]; then
    echo "  ✅ Généré"
else
    echo "  ❌ Non généré - Exécutez 'npm run build'"
fi

echo ""
echo "================================================"
