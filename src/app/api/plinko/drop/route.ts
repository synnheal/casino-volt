import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

// Multiplicateurs selon le risque et les lignes
const MULTIPLIERS = {
  low: {
    8: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    10: [8.9, 3, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 3, 8.9],
    12: [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
    14: [7.1, 4, 1.9, 1.4, 1.3, 1.1, 1, 0.5, 1, 1.1, 1.3, 1.4, 1.9, 4, 7.1],
    16: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16]
  },
  medium: {
    8: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    10: [22, 5, 2, 1.4, 0.6, 0.4, 0.6, 1.4, 2, 5, 22],
    12: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
    14: [58, 15, 7, 4, 1.9, 1, 0.5, 0.2, 0.5, 1, 1.9, 4, 7, 15, 58],
    16: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110]
  },
  high: {
    8: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
    10: [43, 7, 2, 0.6, 0.2, 0.2, 0.2, 0.6, 2, 7, 43],
    12: [76, 10, 3, 0.9, 0.3, 0.2, 0.2, 0.2, 0.3, 0.9, 3, 10, 76],
    14: [170, 24, 8, 2, 0.7, 0.2, 0.2, 0.2, 0.2, 0.2, 0.7, 2, 8, 24, 170],
    16: [420, 56, 18, 5, 1.9, 0.3, 0.2, 0.2, 0.2, 0.2, 0.2, 0.3, 1.9, 5, 18, 56, 420]
  }
};

export async function POST(request: NextRequest) {
  try {
    const { token, betAmount, risk, rows } = await request.json();

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

    // Sélectionner les multiplicateurs appropriés
    const multipliers = MULTIPLIERS[risk as keyof typeof MULTIPLIERS][rows as keyof typeof MULTIPLIERS.low];

    // Simuler le chemin de la balle (binomial distribution)
    let position = rows / 2; // Start au milieu
    for (let i = 0; i < rows; i++) {
      // 50% chance de droite ou gauche
      position += Math.random() < 0.5 ? -0.5 : 0.5;
    }

    // Arrondir et borner la position
    const finalIndex = Math.max(0, Math.min(multipliers.length - 1, Math.round(position)));
    const multiplier = multipliers[finalIndex];

    // Calculer les gains
    const winAmount = Math.floor(betAmount * multiplier);
    const profit = winAmount - betAmount;

    // Ajouter les gains si > 0
    if (winAmount > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: { credits: user.credits - BigInt(betAmount) + BigInt(winAmount) },
      });
    }

    // Sauvegarder la partie
    await prisma.casinoGame.create({
      data: {
        userId: user.id,
        gameType: 'plinko',
        betAmount: BigInt(betAmount),
        winAmount: BigInt(winAmount),
        result: {
          risk,
          rows,
          multiplier,
          finalIndex,
          profit
        },
      },
    });

    // ✅ FIX: Mettre à jour les stats avec upsert
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
        totalWon: { increment: BigInt(winAmount) },
        biggestWin: winAmount > Number(currentStats?.biggestWin || 0) 
          ? BigInt(winAmount) 
          : currentStats?.biggestWin || BigInt(0),
        xp: newXp,
        level: newLevel,
      },
      create: {
        userId: user.id,
        totalGames: 1,
        totalWagered: BigInt(betAmount),
        totalWon: BigInt(winAmount),
        biggestWin: BigInt(winAmount),
        xp: xpGain,
        level: 1,
      },
    });

    // Récupérer la nouvelle balance
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { credits: true },
    });

    return NextResponse.json({
      success: true,
      multiplier,
      winAmount,
      profit,
      finalIndex,
      balance: updatedUser!.credits.toString(),
    });

  } catch (error: any) {
    console.error('Erreur Plinko:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}