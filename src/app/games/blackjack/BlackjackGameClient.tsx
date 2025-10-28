'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

interface UserData {
  token: string;
  userId: string;
  username: string;
  balance: string;
}

interface Card {
  suit: string;
  value: string;
  numericValue: number;
}

function getCardColor(suit: string): string {
  return ['♥', '♦'].includes(suit) ? 'text-red-500' : 'text-gray-900';
}

// 🎭 Cartes pour la démo
const DEMO_CARDS: Card[] = [
  { suit: '♠', value: 'A', numericValue: 11 },
  { suit: '♥', value: 'K', numericValue: 10 },
  { suit: '♦', value: 'Q', numericValue: 10 },
  { suit: '♣', value: 'J', numericValue: 10 },
  { suit: '♠', value: '10', numericValue: 10 },
  { suit: '♥', value: '9', numericValue: 9 },
  { suit: '♦', value: '8', numericValue: 8 },
  { suit: '♣', value: '7', numericValue: 7 },
];

function getRandomCards(count: number): Card[] {
  const cards: Card[] = [];
  for (let i = 0; i < count; i++) {
    cards.push(DEMO_CARDS[Math.floor(Math.random() * DEMO_CARDS.length)]);
  }
  return cards;
}

function calculateHandValue(cards: Card[]): number {
  let value = cards.reduce((sum, card) => sum + card.numericValue, 0);
  let aces = cards.filter(c => c.value === 'A').length;
  
  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }
  
  return value;
}

export default function BlackjackGameClient({ userData }: { userData: UserData }) {
  const [betAmount, setBetAmount] = useState(100);
  const [balance, setBalance] = useState(Number(userData.balance));
  const [gameActive, setGameActive] = useState(false);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [playerValue, setPlayerValue] = useState(0);
  const [dealerValue, setDealerValue] = useState(0);
  const [gameState, setGameState] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [history, setHistory] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 🎭 Mode démo
  const [demoMode, setDemoMode] = useState(true);
  const [demoPlayerHand, setDemoPlayerHand] = useState<Card[]>([]);
  const [demoDealerHand, setDemoDealerHand] = useState<Card[]>([]);
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);

  // 🎬 Démo automatique au démarrage
  useEffect(() => {
    if (demoMode && !gameActive) {
      runDemo();
    }
  }, [demoMode]);

  // 🔄 Timer d'inactivité
  const resetInactivityTimer = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    
    // Reprendre la démo après 10 secondes d'inactivité
    inactivityTimer.current = setTimeout(() => {
      if (!gameActive) {
        setDemoMode(true);
      }
    }, 10000);
  };

  // 🎭 Animation de démo
  const runDemo = async () => {
    // Distribuer les cartes
    const pCards = getRandomCards(2);
    const dCards = getRandomCards(2);
    
    setDemoPlayerHand([pCards[0]]);
    setDemoDealerHand([dCards[0]]);
    
    await new Promise(r => setTimeout(r, 500));
    setDemoPlayerHand([pCards[0], pCards[1]]);
    
    await new Promise(r => setTimeout(r, 500));
    setDemoDealerHand([dCards[0], dCards[1]]);
    
    // Attendre un peu
    await new Promise(r => setTimeout(r, 2000));
    
    // Peut-être tirer une carte supplémentaire
    if (Math.random() > 0.5 && calculateHandValue(pCards) < 17) {
      const newCard = getRandomCards(1)[0];
      setDemoPlayerHand([...pCards, newCard]);
      await new Promise(r => setTimeout(r, 1500));
    }
    
    // Révéler la main du dealer
    await new Promise(r => setTimeout(r, 1000));
    
    // Recommencer la démo
    await new Promise(r => setTimeout(r, 2000));
    if (demoMode && !gameActive) {
      runDemo();
    }
  };

  const startGame = async () => {
    if (balance < betAmount) return;

    // 🎬 Arrêter la démo
    setDemoMode(false);
    resetInactivityTimer();
    
    setIsProcessing(true);
    setResult('');

    try {
      const response = await axios.post('/api/blackjack/start', {
        token: userData.token,
        betAmount,
      });

      const { playerHand, dealerHand, playerValue, playerBlackjack, gameState: newGameState } = response.data;

      setPlayerHand(playerHand);
      setDealerHand(dealerHand);
      setPlayerValue(playerValue);
      setDealerValue(0);
      setGameState(newGameState);
      setGameActive(true);
      setBalance(Number(response.data.balance) || balance);

      if (playerBlackjack) {
        await handleAction('stand');
      }

    } catch (error: any) {
      console.error('Erreur:', error);
    }

    setIsProcessing(false);
  };

  const handleAction = async (action: 'hit' | 'stand') => {
    if (!gameActive || isProcessing) return;

    setIsProcessing(true);
    resetInactivityTimer();

    try {
      const response = await axios.post('/api/blackjack/action', {
        token: userData.token,
        action,
        gameState,
      });

      const {
        playerHand: newPlayerHand,
        dealerHand: newDealerHand,
        playerValue: newPlayerValue,
        dealerValue: newDealerValue,
        isFinished,
        result: gameResult,
        winAmount,
        profit,
        balance: newBalance,
        gameState: newGameState,
      } = response.data;

      setPlayerHand(newPlayerHand);
      setDealerHand(newDealerHand);
      setPlayerValue(newPlayerValue);
      
      if (newDealerValue !== undefined) {
        setDealerValue(newDealerValue);
      }

      if (isFinished) {
        setDealerValue(newDealerValue);
        await new Promise(resolve => setTimeout(resolve, 1800));
        setResult(gameResult);
        setGameActive(false);
        setBalance(Number(newBalance));

        setHistory(prev => [{
          bet: betAmount,
          result: gameResult,
          profit,
          time: new Date().toLocaleTimeString()
        }, ...prev.slice(0, 9)]);
        
        // Reprendre la démo après la partie
        resetInactivityTimer();
      } else {
        setGameState(newGameState);
      }

    } catch (error: any) {
      console.error('Erreur:', error);
    }

    setIsProcessing(false);
  };

  const getResultColor = (res: string) => {
    if (res === 'win') return 'from-green-500 to-emerald-500';
    if (res === 'lose' || res === 'bust') return 'from-red-500 to-orange-500';
    return 'from-blue-500 to-cyan-500';
  };

  const getResultText = (res: string) => {
    if (res === 'win') return '🎉 YOU WIN!';
    if (res === 'bust') return '💥 BUST!';
    if (res === 'lose') return '😢 YOU LOSE';
    if (res === 'push') return '🤝 PUSH';
    return '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0a2e1a] to-[#0a0a0a]">
      {/* Header */}
      <div className="border-b border-gray-800 bg-black/50 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/dashboard">
            <motion.button 
              whileHover={{ scale: 1.05, x: -5 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 bg-black/40 backdrop-blur-xl border border-gray-800 hover:border-green-500/50 px-6 py-3 rounded-xl text-gray-400 hover:text-green-500 transition-all group shadow-lg"
            >
              <ArrowLeft className="group-hover:-translate-x-1 transition-transform" size={20} />
              <span className="font-semibold">Retour au menu</span>
            </motion.button>
          </Link>
          <div>
            <p className="text-sm text-gray-400">Balance</p>
            <p className="text-2xl font-bold text-[#00D9C0]">{balance} 💰</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div className="text-center">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-green-400 bg-clip-text text-transparent mb-2">
                🃏 BLACKJACK
              </h1>
              <p className="text-gray-400">Beat the dealer to 21!</p>
            </div>

            {/* Game Table */}
            <div className="bg-gradient-to-br from-green-900/20 to-green-800/20 rounded-2xl border-2 border-green-700/30 p-8 relative min-h-[600px]">
              {/* 🎭 Mode démo */}
              {demoMode && !gameActive && (
                <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10">
                  <div className="text-center bg-black/60 backdrop-blur-md px-8 py-4 rounded-xl border border-green-500/30">
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-2xl text-green-400 font-bold mb-2"
                    >
                      🎬 MODE DÉMO
                    </motion.div>
                    <p className="text-gray-400 text-sm">Placez une mise pour commencer à jouer</p>
                  </div>
                </div>
              )}

              {/* Dealer Hand */}
              <div className="mb-16">
                <div className="text-center mb-4">
                  <p className="text-gray-400 mb-2">Dealer</p>
                  {!demoMode && dealerValue > 0 && (
                    <p className="text-2xl font-bold text-white">{dealerValue}</p>
                  )}
                </div>
                <div className="flex justify-center gap-4 flex-wrap">
                  {(demoMode ? demoDealerHand : dealerHand).map((card, idx) => (
                    <motion.div
                      key={idx}
                      className="w-24 h-36 bg-white rounded-xl shadow-2xl flex flex-col items-center justify-center"
                      initial={{ rotateY: 180, y: -100 }}
                      animate={{ rotateY: 0, y: 0 }}
                      transition={{ delay: idx * 0.2, duration: 0.5 }}
                    >
                      <p className={`text-4xl font-bold ${getCardColor(card.suit)}`}>
                        {card.value}
                      </p>
                      <p className={`text-3xl ${getCardColor(card.suit)}`}>
                        {card.suit}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Player Hand */}
              <div>
                <div className="text-center mb-4">
                  <p className="text-gray-400 mb-2">You</p>
                  {!demoMode && playerValue > 0 && (
                    <p className="text-2xl font-bold text-[#00D9C0]">{playerValue}</p>
                  )}
                </div>
                <div className="flex justify-center gap-4 flex-wrap">
                  {(demoMode ? demoPlayerHand : playerHand).map((card, idx) => (
                    <motion.div
                      key={idx}
                      className="w-24 h-36 bg-white rounded-xl shadow-2xl flex flex-col items-center justify-center"
                      initial={{ rotateY: 180, y: 100 }}
                      animate={{ rotateY: 0, y: 0 }}
                      transition={{ delay: idx * 0.2, duration: 0.5 }}
                    >
                      <p className={`text-4xl font-bold ${getCardColor(card.suit)}`}>
                        {card.value}
                      </p>
                      <p className={`text-3xl ${getCardColor(card.suit)}`}>
                        {card.suit}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Result Popup */}
              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                  >
                    <div className={`bg-gradient-to-r ${getResultColor(result)} px-16 py-10 rounded-2xl text-center shadow-2xl`}>
                      <p className="text-5xl font-black text-white mb-4">
                        {getResultText(result)}
                      </p>
                      {history[0]?.profit !== undefined && (
                        <p className="text-3xl font-bold text-white">
                          {history[0].profit >= 0 ? '+' : ''}{history[0].profit} 💰
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* History */}
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-gray-800 p-6">
              <h3 className="text-xl font-bold text-white mb-4">📊 Historique</h3>
              <div className="space-y-2">
                {history.map((item, i) => (
                  <div key={i} className="flex justify-between items-center bg-black/40 px-4 py-3 rounded-lg">
                    <span className="text-sm text-gray-400">{item.time}</span>
                    <span className="text-sm text-gray-400">Mise: {item.bet}</span>
                    <span className={`font-bold ${
                      item.result === 'win' ? 'text-green-400' : 
                      item.result === 'push' ? 'text-blue-400' : 'text-red-400'
                    }`}>
                      {item.result === 'win' ? 'WIN' : item.result === 'push' ? 'PUSH' : 'LOSE'}
                    </span>
                    <span className={`font-bold ${item.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {item.profit >= 0 ? '+' : ''}{item.profit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Bet Amount */}
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-gray-800 p-6">
              <h3 className="text-xl font-bold text-white mb-4">💰 Mise</h3>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                disabled={gameActive}
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-[#00D9C0] focus:outline-none disabled:opacity-50 mb-3"
                min="10"
              />
              <div className="grid grid-cols-3 gap-2">
                {[50, 100, 500].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setBetAmount(amount)}
                    disabled={gameActive}
                    className="bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg font-bold disabled:opacity-50"
                  >
                    {amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            {!gameActive ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startGame}
                disabled={isProcessing || balance < betAmount}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-600/30"
              >
                {isProcessing ? '⏳ Démarrage...' : '🎴 DEAL'}
              </motion.button>
            ) : (
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAction('hit')}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 shadow-lg"
                >
                  🃏 HIT
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAction('stand')}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 shadow-lg"
                >
                  ✋ STAND
                </motion.button>
              </div>
            )}

            {/* Rules */}
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-gray-800 p-6">
              <h3 className="text-xl font-bold text-white mb-4">📖 Règles</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• Blackjack paie 3:2</li>
                <li>• Le dealer tire jusqu'à 17</li>
                <li>• L'as vaut 1 ou 11</li>
                <li>• Figures valent 10</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}