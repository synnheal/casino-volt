'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Zap } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

interface UserData {
  token: string;
  userId: string;
  username: string;
  balance: string;
}

const SYMBOLS = [
  { emoji: '💎', name: 'Diamant', multiplier: 100, color: '#00D9C0' },
  { emoji: '🔥', name: 'Flamme', multiplier: 50, color: '#ff4444' },
  { emoji: '⚡', name: 'Éclair', multiplier: 25, color: '#ffff00' },
  { emoji: '💰', name: 'Argent', multiplier: 15, color: '#ffd700' },
  { emoji: '🍀', name: 'Trèfle', multiplier: 10, color: '#44ff44' },
  { emoji: '🎯', name: 'Cible', multiplier: 5, color: '#ff8844' },
];

export default function SlotsGameClient({ userData }: { userData: UserData }) {
  const [balance, setBalance] = useState(Number(userData.balance));
  const [betAmount, setBetAmount] = useState(100);
  const [isSpinning, setIsSpinning] = useState(false);
  const [reels, setReels] = useState([0, 0, 0]);
  const [displayReels, setDisplayReels] = useState([0, 0, 0]);
  const [showWin, setShowWin] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [winType, setWinType] = useState<string>('');
  const [lastWins, setLastWins] = useState<number[]>([]);
  const [message, setMessage] = useState('');
  const [showComingSoon, setShowComingSoon] = useState(false);
  
  // ⚡ NOUVEAU: Skip animation
  const [skipAnimation, setSkipAnimation] = useState(false);

  // Fonction de spin
  const spin = async () => {
    if (isSpinning || balance < betAmount) {
      setMessage(balance < betAmount ? '❌ Crédits insuffisants !' : '');
      return;
    }

    setIsSpinning(true);
    setShowWin(false);
    setMessage('');

    try {
      setBalance(prev => prev - betAmount);

      // Animation de défilement rapide pendant l'API call
      const spinInterval = setInterval(() => {
        setDisplayReels([
          Math.floor(Math.random() * SYMBOLS.length),
          Math.floor(Math.random() * SYMBOLS.length),
          Math.floor(Math.random() * SYMBOLS.length),
        ]);
      }, 100);

      // Appel API
      const response = await axios.post('/api/slots/spin', {
        token: userData.token,
        betAmount,
      });

      clearInterval(spinInterval);

      const { reels: finalReels, profit, totalWin, winType: type, balance: newBalance, multiplier } = response.data;

      // ⚡ Animation d'arrêt (instantanée si skip activé)
      if (skipAnimation) {
        setDisplayReels(finalReels);
      } else {
        for (let i = 0; i < 3; i++) {
          await new Promise(resolve => setTimeout(resolve, 300));
          setDisplayReels(prev => {
            const newReels = [...prev];
            newReels[i] = finalReels[i];
            return newReels;
          });
        }
      }

      setReels(finalReels);
      setBalance(Number(newBalance));

      // Gérer les gains
      if (totalWin > 0) {
        setWinAmount(totalWin);
        setWinType(type);
        setShowWin(true);
        setLastWins(prev => [totalWin, ...prev.slice(0, 9)]);
        
        setTimeout(() => setShowWin(false), skipAnimation ? 2000 : 4000);
      } else {
        setMessage('😢 Perdu ! Réessaie !');
        setTimeout(() => setMessage(''), 2000);
      }

    } catch (error: any) {
      console.error('Erreur spin:', error);
      setMessage('❌ ' + (error.response?.data?.error || 'Erreur'));
      setBalance(prev => prev + betAmount);
    }

    setIsSpinning(false);
  };

  const isJackpot = reels[0] === reels[1] && reels[1] === reels[2];

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00D9C0]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header avec bouton retour stylé */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <motion.button 
                whileHover={{ scale: 1.05, x: -5 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 bg-black/40 backdrop-blur-xl border border-gray-800 hover:border-[#00D9C0]/50 px-6 py-3 rounded-xl text-gray-400 hover:text-[#00D9C0] transition-all group shadow-lg"
              >
                <ArrowLeft className="group-hover:-translate-x-1 transition-transform" size={20} />
                <span className="font-semibold">Retour au menu</span>
              </motion.button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <span className="text-5xl animate-bounce">🎰</span>
                Slots Premium
              </h1>
              <p className="text-sm text-gray-400">Bienvenue {userData.username} !</p>
            </div>
          </div>

          <div className="bg-[#1a1a1a] px-6 py-3 rounded-xl border border-[#00D9C0]/30">
            <div className="text-xs text-gray-400 mb-1">Balance</div>
            <motion.div 
              key={balance}
              initial={{ scale: 1.2, color: '#00D9C0' }}
              animate={{ scale: 1, color: '#00D9C0' }}
              className="text-2xl font-bold"
            >
              {balance} 💰
            </motion.div>
          </div>
        </div>

        {/* Message */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="text-center mb-4"
            >
              <div className="inline-block bg-red-500/20 border border-red-500 text-red-400 px-6 py-3 rounded-lg font-bold">
                {message}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Game */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Slot Machine */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] rounded-2xl border-4 border-[#00D9C0]/30 p-8 relative overflow-hidden shadow-2xl">
              
              {/* Animated background glow */}
              <motion.div 
                className="absolute inset-0 bg-[#00D9C0]/5 blur-xl"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />

              {/* Reels Container */}
              <div className="relative bg-black/50 rounded-xl p-8 border-2 border-[#00D9C0]/20 backdrop-blur-sm">
                <div className="grid grid-cols-3 gap-6">
                  {displayReels.map((symbolIndex, reelIndex) => (
                    <motion.div
                      key={reelIndex}
                      className="aspect-square bg-gradient-to-b from-[#1a1a1a] to-black rounded-xl border-2 flex items-center justify-center relative overflow-hidden"
                      style={{
                        borderColor: !isSpinning && isJackpot ? SYMBOLS[symbolIndex].color : '#00D9C020',
                        boxShadow: !isSpinning && isJackpot ? `0 0 40px ${SYMBOLS[symbolIndex].color}` : `0 0 20px ${SYMBOLS[symbolIndex].color}40`
                      }}
                      animate={!isSpinning && isJackpot ? {
                        borderColor: [SYMBOLS[symbolIndex].color, '#ffffff', SYMBOLS[symbolIndex].color],
                      } : {}}
                      transition={{ duration: 0.5, repeat: isJackpot && !isSpinning ? Infinity : 0 }}
                    >
                      {/* Glow background */}
                      <motion.div 
                        className="absolute inset-0 opacity-20 blur-2xl"
                        style={{ backgroundColor: SYMBOLS[symbolIndex].color }}
                        animate={isSpinning ? { opacity: [0.1, 0.3, 0.1] } : {}}
                        transition={{ duration: 0.3, repeat: Infinity }}
                      />

                      {/* Symbol */}
                      <motion.div
                        className="text-9xl relative z-10 filter drop-shadow-lg"
                        animate={isSpinning ? { y: [-10, 10, -10] } : {}}
                        transition={{ duration: 0.2, repeat: Infinity }}
                      >
                        {SYMBOLS[symbolIndex].emoji}
                      </motion.div>
                    </motion.div>
                  ))}
                </div>

                {/* Jackpot Effect */}
                {!isSpinning && isJackpot && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <div className="text-6xl font-black text-yellow-400 animate-pulse drop-shadow-2xl">
                      🎉 JACKPOT! 🎉
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Win Popup */}
              <AnimatePresence>
                {showWin && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-20"
                  >
                    <div className="text-center">
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                        className="text-8xl mb-4"
                      >
                        🎉
                      </motion.div>
                      <div className="text-5xl font-black bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-2">
                        +{winAmount} 💰
                      </div>
                      <div className="text-2xl text-[#00D9C0] font-bold">
                        {winType}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Last Wins */}
            <div className="mt-6 bg-[#1a1a1a] rounded-xl border border-gray-800 p-4">
              <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                <span>📊</span> Derniers gains
              </h3>
              <div className="flex gap-2 flex-wrap">
                {lastWins.map((win, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500 text-green-400 px-4 py-2 rounded-lg font-bold"
                  >
                    +{win} 💰
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Mode Toggle */}
            <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
              <h3 className="text-white font-bold mb-4">🎮 Mode de jeu</h3>
              <div className="grid grid-cols-2 gap-2">
                <button className="py-3 rounded-lg font-bold bg-[#00D9C0] text-black">
                  Manuel
                </button>
                <button
                  onClick={() => {
                    setShowComingSoon(true);
                    setTimeout(() => setShowComingSoon(false), 3000);
                  }}
                  className="relative py-3 rounded-lg font-bold bg-gray-800 text-gray-400 hover:bg-gray-700"
                >
                  <span className="flex items-center justify-center gap-2">
                    Auto
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">
                      SOON
                    </span>
                  </span>
                </button>
              </div>
            </div>

            {/* ⚡ NOUVEAU: Skip Animation */}
            <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap size={20} className="text-yellow-400" />
                  <span className="text-white font-bold">Animation rapide</span>
                </div>
                <button
                  onClick={() => setSkipAnimation(!skipAnimation)}
                  className={`px-4 py-2 rounded-lg font-bold transition-all ${
                    skipAnimation 
                      ? 'bg-[#00D9C0] text-black' 
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {skipAnimation ? 'ON' : 'OFF'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {skipAnimation ? 'Résultat instantané ⚡' : 'Animation complète 🎬'}
              </p>
            </div>

            {/* Bet Amount */}
            <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
              <h3 className="text-white font-bold mb-4">💰 Mise</h3>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                disabled={isSpinning}
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-[#00D9C0] focus:outline-none disabled:opacity-50 mb-3"
                min="10"
              />
              <div className="grid grid-cols-3 gap-2">
                {[50, 100, 500].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setBetAmount(amount)}
                    disabled={isSpinning}
                    className="bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg font-bold disabled:opacity-50"
                  >
                    {amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Paytable */}
            <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
              <h3 className="text-white font-bold mb-4">💎 Table des gains</h3>
              <div className="space-y-2">
                {SYMBOLS.map((symbol, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{symbol.emoji}</span>
                      <span className="text-xs text-gray-400">{symbol.name}</span>
                    </div>
                    <div className="text-sm font-bold" style={{ color: symbol.color }}>
                      x{symbol.multiplier}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Spin Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={spin}
              disabled={isSpinning || balance < betAmount}
              className={`
                w-full py-6 rounded-xl font-black text-xl transition-all shadow-lg
                ${isSpinning 
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-[#00D9C0] to-purple-500 hover:from-[#00c4ad] hover:to-purple-600 text-black shadow-[#00D9C0]/30'
                }
              `}
            >
              {isSpinning ? '🎰 EN ROTATION...' : '🎰 SPIN'}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Coming Soon Popup */}
      <AnimatePresence>
        {showComingSoon && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowComingSoon(false)}
          >
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="bg-gradient-to-r from-orange-500 to-yellow-500 px-12 py-8 rounded-2xl shadow-2xl text-center border-4 border-yellow-300"
            >
              <div className="text-5xl mb-4">🚧</div>
              <div className="text-3xl font-black text-white mb-2">MODE AUTO</div>
              <div className="text-xl font-bold text-white">Prochainement disponible !</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}