import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

// Deck de cartes
const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

interface Card {
  suit: string;
  value: string;
  numericValue: number;
}

function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      let numericValue = 0;
      if (value === 'A') numericValue = 11;
      else if (['J', 'Q', 'K'].includes(value)) numericValue = 10;
      else numericValue = parseInt(value);
      
      deck.push({ suit, value, numericValue });
    }
  }
  return shuffle(deck);
}

function shuffle(array: any[]): any[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function calculateHandValue(hand: Card[]): number {
  let value = hand.reduce((sum, card) => sum + card.numericValue, 0);
  let aces = hand.filter(card => card.value === 'A').length;
  
  // Ajuster pour les As
  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }
  
  return value;
}

// Start game
export async function POST(request: NextRequest) {
  try {
    const { token, betAmount } = await request.json();

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

    // Retirer la mise
    await prisma.user.update({
      where: { id: user.id },
      data: { credits: user.credits - BigInt(betAmount) },
    });

    // Créer le deck et distribuer
    const deck = createDeck();
    const playerHand = [deck.pop()!, deck.pop()!];
    const dealerHand = [deck.pop()!, deck.pop()!];

    const playerValue = calculateHandValue(playerHand);
    const dealerValue = calculateHandValue([dealerHand[0]]);

    // Vérifier Blackjack naturel
    const playerBlackjack = playerValue === 21;

    const gameState = {
      deck,
      playerHand,
      dealerHand,
      betAmount,
      playerValue,
      dealerValue,
      isFinished: playerBlackjack,
    };

    return NextResponse.json({
      success: true,
      playerHand,
      dealerHand: [dealerHand[0]], // Ne montrer qu'une carte du dealer
      playerValue,
      playerBlackjack,
      gameState: JSON.stringify(gameState),
    });

  } catch (error: any) {
    console.error('Erreur Blackjack start:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}