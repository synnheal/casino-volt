import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

interface Card {
  suit: string;
  value: string;
  numericValue: number;
}

function calculateHandValue(hand: Card[]): number {
  let value = hand.reduce((sum, card) => sum + card.numericValue, 0);
  let aces = hand.filter(card => card.value === 'A').length;
  
  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }
  
  return value;
}

export async function POST(request: NextRequest) {
  try {
    const { token, action, gameState: gameStateStr } = await request.json();

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const gameState = JSON.parse(gameStateStr);
    let { deck, playerHand, dealerHand, betAmount } = gameState;

    if (action === 'hit') {
      // Tirer une carte pour le joueur
      playerHand.push(deck.pop());
      const playerValue = calculateHandValue(playerHand);

      if (playerValue > 21) {
        // Bust - joueur perd
        await saveGameResult(user.id, betAmount, 0, 'bust', playerHand, dealerHand);
        
        return NextResponse.json({
          success: true,
          playerHand,
          dealerHand,
          playerValue,
          dealerValue: calculateHandValue(dealerHand),
          result: 'bust',
          winAmount: 0,
          balance: user.credits.toString(),
          isFinished: true,
        });
      }

      return NextResponse.json({
        success: true,
        playerHand,
        dealerHand: [dealerHand[0]],
        playerValue,
        isFinished: false,
        gameState: JSON.stringify({ deck, playerHand, dealerHand, betAmount }),
      });
    }

    if (action === 'stand') {
      // Dealer joue
      let dealerValue = calculateHandValue(dealerHand);
      
      while (dealerValue < 17) {
        dealerHand.push(deck.pop());
        dealerValue = calculateHandValue(dealerHand);
      }

      const playerValue = calculateHandValue(playerHand);

      let result = '';
      let winAmount = 0;

      if (dealerValue > 21) {
        result = 'win';
        winAmount = betAmount * 2;
      } else if (playerValue > dealerValue) {
        result = 'win';
        winAmount = betAmount * 2;
      } else if (playerValue === dealerValue) {
        result = 'push';
        winAmount = betAmount;
      } else {
        result = 'lose';
        winAmount = 0;
      }

      // Ajouter les gains
      if (winAmount > 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: { credits: user.credits + BigInt(winAmount) },
        });
      }

      await saveGameResult(user.id, betAmount, winAmount, result, playerHand, dealerHand);

      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { credits: true },
      });

      return NextResponse.json({
        success: true,
        playerHand,
        dealerHand,
        playerValue,
        dealerValue,
        result,
        winAmount,
        profit: winAmount - betAmount,
        balance: updatedUser!.credits.toString(),
        isFinished: true,
      });
    }

    return NextResponse.json({ error: 'Action invalide' }, { status: 400 });

  } catch (error: any) {
    console.error('Erreur Blackjack action:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function saveGameResult(
  userId: string,
  betAmount: number,
  winAmount: number,
  result: string,
  playerHand: Card[],
  dealerHand: Card[]
) {
  await prisma.casinoGame.create({
    data: {
      userId,
      gameType: 'blackjack',
      betAmount: BigInt(betAmount),
      winAmount: BigInt(winAmount),
      result: {
        result,
        playerHand,
        dealerHand,
        playerValue: calculateHandValue(playerHand),
        dealerValue: calculateHandValue(dealerHand),
      },
    },
  });

  // ✅ FIX: Mettre à jour les stats avec upsert
  const currentStats = await prisma.casinoStats.findUnique({
    where: { userId },
  });

  const xpGain = Math.floor(betAmount / 10);
  const newXp = (currentStats?.xp || 0) + xpGain;
  const newLevel = Math.floor(newXp / 100) + 1;

  await prisma.casinoStats.upsert({
    where: { userId },
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
      userId,
      totalGames: 1,
      totalWagered: BigInt(betAmount),
      totalWon: BigInt(winAmount),
      biggestWin: BigInt(winAmount),
      xp: xpGain,
      level: 1,
    },
  });
}