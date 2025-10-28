import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = body.token;
    const betAmount = body.betAmount;
    const target = body.target;
    const rollOver = body.rollOver;

    if (!token || !betAmount || target === undefined || rollOver === undefined) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    if (betAmount <= 0) {
      return NextResponse.json({ error: 'Mise invalide' }, { status: 400 });
    }

    if (target < 1 || target > 99) {
      return NextResponse.json({ error: 'Target invalide' }, { status: 400 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    if (user.credits < BigInt(betAmount)) {
      return NextResponse.json({ error: 'Crédits insuffisants' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { credits: user.credits - BigInt(betAmount) },
    });

    const result = Math.floor(Math.random() * 10000) / 100;

    let isWin = false;
    if (rollOver) {
      isWin = result > target;
    } else {
      isWin = result < target;
    }

    let multiplier = 0;
    if (rollOver) {
      multiplier = (100 / (100 - target)) * 0.99;
    } else {
      multiplier = (100 / target) * 0.99;
    }

    const totalWin = isWin ? Math.floor(betAmount * multiplier) : 0;
    const profit = totalWin - betAmount;

    let newBalance = user.credits - BigInt(betAmount);
    
    if (totalWin > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: { credits: newBalance + BigInt(totalWin) },
      });
      newBalance = newBalance + BigInt(totalWin);
    }

    await prisma.casinoGame.create({
      data: {
        userId: user.id,
        gameType: 'dice',
        betAmount: BigInt(betAmount),
        winAmount: BigInt(totalWin),
        result: {
          result: result,
          target: target,
          rollOver: rollOver,
          isWin: isWin,
          multiplier: multiplier,
        },
      },
    });

    const stats = await prisma.casinoStats.findUnique({
      where: { userId: user.id },
    });

    if (stats) {
      await prisma.casinoStats.update({
        where: { userId: user.id },
        data: {
          totalGames: stats.totalGames + 1,
          totalWagered: stats.totalWagered + BigInt(betAmount),
          totalWon: stats.totalWon + BigInt(totalWin),
          biggestWin: totalWin > Number(stats.biggestWin) ? BigInt(totalWin) : stats.biggestWin,
        },
      });
    }

    return NextResponse.json({
      success: true,
      result: result,
      target: target,
      rollOver: rollOver,
      isWin: isWin,
      multiplier: multiplier.toFixed(2),
      winAmount: totalWin,
      profit: profit,
      balance: newBalance.toString(),
    });

  } catch (error: any) {
    console.error('Erreur dice:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}