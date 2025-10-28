import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

const SYMBOLS = [
  { emoji: '💎', multiplier: 100, weight: 1 },   // Ultra rare
  { emoji: '🔥', multiplier: 50, weight: 2 },    // Très rare
  { emoji: '⚡', multiplier: 25, weight: 5 },    // Rare
  { emoji: '💰', multiplier: 15, weight: 10 },   // Peu commun
  { emoji: '🍀', multiplier: 10, weight: 20 },   // Commun
  { emoji: '🎯', multiplier: 5, weight: 62 },    // Très commun
];

// Fonction pour tirer un symbole pondéré
function getRandomSymbol(): number {
  const totalWeight = SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < SYMBOLS.length; i++) {
    random -= SYMBOLS[i].weight;
    if (random <= 0) return i;
  }
  
  return SYMBOLS.length - 1;
}

export async function POST(request: NextRequest) {
  try {
    const { token, betAmount } = await request.json();

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Vérifier les crédits
    if (user.credits < BigInt(betAmount)) {
      return NextResponse.json({ error: 'Crédits insuffisants' }, { status: 400 });
    }

    // Retirer la mise
    await prisma.user.update({
      where: { id: user.id },
      data: { credits: user.credits - BigInt(betAmount) },
    });

    // Générer les résultats (3 rouleaux)
    const reels = [
      getRandomSymbol(),
      getRandomSymbol(),
      getRandomSymbol(),
    ];

    // Calculer les gains
    let winMultiplier = 0;
    let winType = 'loss';

    console.log('🎰 Reels:', reels, 'Symboles:', reels.map(i => SYMBOLS[i].emoji));

    // 3 symboles identiques (JACKPOT)
    if (reels[0] === reels[1] && reels[1] === reels[2]) {
      winMultiplier = SYMBOLS[reels[0]].multiplier;
      winType = 'jackpot';
      console.log('🎉 JACKPOT! Multiplicateur:', winMultiplier);
    }
    // 2 symboles identiques
    else if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
      const matchingIndex = reels[0] === reels[1] ? reels[0] : 
                           reels[1] === reels[2] ? reels[1] : reels[0];
      winMultiplier = SYMBOLS[matchingIndex].multiplier / 10;
      winType = 'win';
      console.log('✨ WIN! Symbole:', SYMBOLS[matchingIndex].emoji, 'Multiplicateur:', winMultiplier);
    } else {
      console.log('😢 Perdu');
    }

    // Le gain total = mise × multiplicateur
    const totalWin = Math.floor(betAmount * winMultiplier);
    
    console.log('💰 Mise:', betAmount, '× Mult:', winMultiplier, '= Gain total:', totalWin);
    
    // La balance finale = balance actuelle - mise + gain total
    let newBalance = user.credits - BigInt(betAmount);
    
    if (totalWin > 0) {
      // Ajouter le gain total (pas juste le profit)
      await prisma.user.update({
        where: { id: user.id },
        data: { credits: newBalance + BigInt(totalWin) },
      });
      newBalance += BigInt(totalWin);
    }

    // Le profit net (pour l'affichage)
    const profit = totalWin - betAmount;
    
    console.log('💵 Balance finale:', newBalance.toString(), 'Profit:', profit);

    // Sauvegarder la partie
    await prisma.casinoGame.create({
      data: {
        userId: user.id,
        gameType: 'slots',
        betAmount: BigInt(betAmount),
        winAmount: BigInt(totalWin),
        result: {
          reels,
          symbols: reels.map(i => SYMBOLS[i].emoji),
          winType,
          multiplier: winMultiplier,
        },
      },
    });

    // ✅ FIX: Mettre à jour les stats avec upsert (créer si n'existe pas)
    const currentStats = await prisma.casinoStats.findUnique({
      where: { userId: user.id },
    });

    const xpGain = Math.floor(betAmount / 10);
    const newXp = (currentStats?.xp || 0) + xpGain;
    const newLevel = Math.floor(newXp / 100) + 1;

    await prisma.casinoStats.upsert({
      where: { userId: user.id },
      update: {
        totalGames: { increment: 1 },
        totalWagered: { increment: BigInt(betAmount) },
        totalWon: { increment: BigInt(totalWin) },
        biggestWin: totalWin > Number(currentStats?.biggestWin || 0) 
          ? BigInt(totalWin) 
          : currentStats?.biggestWin || BigInt(0),
        xp: newXp,
        level: newLevel,
      },
      create: {
        userId: user.id,
        totalGames: 1,
        totalWagered: BigInt(betAmount),
        totalWon: BigInt(totalWin),
        biggestWin: BigInt(totalWin),
        xp: xpGain,
        level: 1,
      },
    });

    return NextResponse.json({
      success: true,
      reels,
      symbols: reels.map(i => SYMBOLS[i].emoji),
      totalWin,
      profit,
      winType,
      multiplier: winMultiplier,
      balance: newBalance.toString(),
    });

  } catch (error: any) {
    console.error('Erreur slots:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}