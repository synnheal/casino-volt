'use client';

import { useState } from 'react';
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

// Layout de la roulette européenne
const ROULETTE_LAYOUT = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5,
  24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

function getNumberColor(num: number): string {
  if (num === 0) return 'green';
  return RED_NUMBERS.includes(num) ? 'red' : 'black';
}

export default function RouletteGameClient({ userData }: { userData: UserData }) {
  // 🔧 FIX: Conversion sécurisée de la balance
  const [balance, setBalance] = useState(Number(userData.balance) || 0);
  const [chipValue, setChipValue] = useState(10);
  const [bets, setBets] = useState<any>({});
  const [isSpinning, setIsSpinning] = useState(false);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [showComingSoon, setShowComingSoon] = useState(false);

  const totalBet = Object.values(bets).reduce((sum: number, bet: any) => {
    if (typeof bet === 'number') return sum + bet;
    if (typeof bet === 'object') {
      return sum + Object.values(bet).reduce((s: number, v: any) => s + v, 0);
    }
    return sum;
  }, 0);

  const placeBet = (type: string, value?: number) => {
    // 🔧 FIX: Vérification correcte du solde
    if (balance < chipValue) return;

    setBets((prev: any) => {
      const newBets = { ...prev };
      
      if (value !== undefined) {
        if (!newBets.straight) newBets.straight = {};
        newBets.straight[value] = (newBets.straight[value] || 0) + chipValue;
      } else {
        newBets[type] = (newBets[type] || 0) + chipValue;
      }
      
      return newBets;
    });
  };

  const clearBets = () => {
    setBets({});
  };

  const spin = async () => {
    if (isSpinning || totalBet === 0) return;

    setIsSpinning(true);
    setWinningNumber(null);
    setResult(null);

    try {
      const response = await axios.post('/api/roulette/spin', {
        token: userData.token,
        bets,
      });

      const { winningNumber: num, winningColor, totalWin, profit, balance: newBalance } = response.data;

      // Animation de rotation
      const targetIndex = ROULETTE_LAYOUT.indexOf(num);
      const degreesPerSlot = 360 / ROULETTE_LAYOUT.length;
      const targetRotation = 360 * 5 + (targetIndex * degreesPerSlot);
      
      setRotation(targetRotation);

      // Attendre la fin de l'animation
      await new Promise(resolve => setTimeout(resolve, 4000));

      setWinningNumber(num);
      // 🔧 FIX: Conversion sécurisée de la nouvelle balance
      setBalance(Number(newBalance) || 0);
      setResult({ num, color: winningColor, totalWin, profit });

      setHistory(prev => [{
        number: num,
        color: winningColor,
        bet: totalBet,
        win: totalWin,
        profit,
        time: new Date().toLocaleTimeString()
      }, ...prev.slice(0, 19)]);

      setTimeout(() => {
        setIsSpinning(false);
        setBets({});
        setResult(null);
      }, 3000);

    } catch (error: any) {
      console.error('Erreur:', error);
      setIsSpinning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a0505] to-[#0a0a0a]">
      {/* Header avec bouton retour stylé */}
      <div className="border-b border-gray-800 bg-black/50 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/dashboard">
            <motion.button 
              whileHover={{ scale: 1.05, x: -5 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 bg-black/40 backdrop-blur-xl border border-gray-800 hover:border-red-500/50 px-6 py-3 rounded-xl text-gray-400 hover:text-red-500 transition-all group shadow-lg"
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
              <h1 className="text-6xl font-bold bg-gradient-to-r from-red-500 via-yellow-500 to-red-500 bg-clip-text text-transparent mb-2">
                🎯 ROULETTE
              </h1>
              <p className="text-gray-400">Place your bets and spin the wheel!</p>
            </div>

            {/* Roulette Wheel */}
            <div className="relative bg-gradient-to-br from-red-900/20 to-black rounded-3xl border-2 border-red-700/30 p-12 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-yellow-500/10 animate-pulse"></div>
              
              <div className="relative w-full aspect-square max-w-[600px] mx-auto">
                {/* Ball Indicator Arrow */}
                <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30">
                  <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[30px] border-t-yellow-400 drop-shadow-2xl"></div>
                </div>

                {/* Outer Ring */}
                <div className="absolute inset-0 rounded-full" style={{
                  background: 'conic-gradient(from 0deg, #8B4513 0deg, #A0522D 45deg, #8B4513 90deg, #654321 135deg, #8B4513 180deg, #A0522D 225deg, #8B4513 270deg, #654321 315deg, #8B4513 360deg)',
                  boxShadow: 'inset 0 0 60px rgba(0,0,0,0.8), 0 0 80px rgba(212, 175, 55, 0.4)'
                }}>
                  <div className="absolute inset-4 rounded-full border-8 border-yellow-600" style={{
                    boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.8), 0 4px 20px rgba(212, 175, 55, 0.6)'
                  }}></div>
                </div>

                {/* Rotating Wheel */}
                <motion.div
                  className="absolute inset-12 rounded-full"
                  animate={{ rotate: rotation }}
                  transition={{
                    duration: 4,
                    ease: [0.45, 0, 0.15, 1],
                  }}
                  style={{
                    transformStyle: 'preserve-3d',
                  }}
                >
                  <div className="absolute inset-0 rounded-full" style={{
                    background: 'radial-gradient(circle, #2a1810 0%, #1a0f0a 100%)',
                    boxShadow: 'inset 0 0 100px rgba(0,0,0,0.9)',
                  }}>
                    {/* ✨ NOUVEAU: Affichage amélioré des numéros */}
                    {ROULETTE_LAYOUT.map((num, idx) => {
                      const angle = (idx * 360) / ROULETTE_LAYOUT.length;
                      const color = getNumberColor(num);
                      const isWinning = winningNumber === num;
                      
                      return (
                        <div
                          key={idx}
                          className="absolute top-1/2 left-1/2 origin-center"
                          style={{
                            transform: `rotate(${angle}deg) translateY(-120px)`,
                          }}
                        >
                          <div 
                            className={`
                              w-12 h-12 rounded-lg flex items-center justify-center
                              font-bold text-white text-lg shadow-2xl
                              border-2 transition-all duration-300
                              ${isWinning ? 'scale-125 animate-pulse' : ''}
                              ${color === 'red' ? 'bg-gradient-to-br from-red-600 to-red-800 border-red-400' : ''}
                              ${color === 'black' ? 'bg-gradient-to-br from-gray-900 to-black border-gray-600' : ''}
                              ${color === 'green' ? 'bg-gradient-to-br from-green-600 to-green-800 border-green-400' : ''}
                            `}
                            style={{
                              transform: `rotate(-${angle}deg)`,
                              boxShadow: isWinning 
                                ? '0 0 30px rgba(255, 215, 0, 0.8)' 
                                : '0 4px 15px rgba(0,0,0,0.6)'
                            }}
                          >
                            {num}
                          </div>
                        </div>
                      );
                    })}

                    {/* Center Logo */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-3xl shadow-2xl border-4 border-yellow-300">
                      🎰
                    </div>
                  </div>
                </motion.div>

                {/* Winning Number Display */}
                <AnimatePresence>
                  {winningNumber !== null && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40"
                    >
                      <div className={`
                        px-8 py-6 rounded-2xl text-center shadow-2xl border-4
                        ${getNumberColor(winningNumber) === 'red' ? 'bg-gradient-to-br from-red-600 to-red-800 border-red-400' : ''}
                        ${getNumberColor(winningNumber) === 'black' ? 'bg-gradient-to-br from-gray-900 to-black border-gray-600' : ''}
                        ${getNumberColor(winningNumber) === 'green' ? 'bg-gradient-to-br from-green-600 to-green-800 border-green-400' : ''}
                      `}>
                        <div className="text-6xl font-black text-white mb-2">{winningNumber}</div>
                        <div className="text-xl text-white/80 uppercase tracking-wider">
                          {getNumberColor(winningNumber)}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Betting Table */}
            <div className="bg-gradient-to-br from-green-900/30 to-black rounded-2xl border-2 border-green-700/30 p-6">
              <h3 className="text-2xl font-bold text-white mb-4">🎲 Table de paris</h3>
              
              {/* Numbers Grid */}
              <div className="grid grid-cols-13 gap-1 mb-4">
                {/* 0 */}
                <button
                  onClick={() => placeBet('straight', 0)}
                  disabled={isSpinning}
                  className="col-span-1 aspect-square bg-gradient-to-br from-green-600 to-green-800 hover:from-green-500 hover:to-green-700 rounded-lg font-bold text-white shadow-lg disabled:opacity-50 transition-all"
                >
                  0
                </button>
                
                {/* 1-36 */}
                {Array.from({ length: 36 }, (_, i) => i + 1).map(num => (
                  <button
                    key={num}
                    onClick={() => placeBet('straight', num)}
                    disabled={isSpinning}
                    className={`
                      aspect-square rounded-lg font-bold text-white shadow-lg disabled:opacity-50 transition-all
                      ${RED_NUMBERS.includes(num) 
                        ? 'bg-gradient-to-br from-red-600 to-red-800 hover:from-red-500 hover:to-red-700' 
                        : 'bg-gradient-to-br from-gray-900 to-black hover:from-gray-800 hover:to-gray-900'
                      }
                    `}
                  >
                    {num}
                  </button>
                ))}
              </div>

              {/* Outside Bets */}
              <div className="grid grid-cols-6 gap-2">
                {[
                  { type: 'red', label: 'Rouge', color: 'from-red-600 to-red-800' },
                  { type: 'black', label: 'Noir', color: 'from-gray-900 to-black' },
                  { type: 'even', label: 'Pair', color: 'from-blue-600 to-blue-800' },
                  { type: 'odd', label: 'Impair', color: 'from-purple-600 to-purple-800' },
                  { type: 'low', label: '1-18', color: 'from-yellow-600 to-yellow-800' },
                  { type: 'high', label: '19-36', color: 'from-orange-600 to-orange-800' },
                ].map(bet => (
                  <button
                    key={bet.type}
                    onClick={() => placeBet(bet.type)}
                    disabled={isSpinning}
                    className={`
                      py-4 rounded-lg font-bold text-white shadow-lg disabled:opacity-50 transition-all
                      bg-gradient-to-br ${bet.color} hover:scale-105
                    `}
                  >
                    {bet.label}
                  </button>
                ))}
              </div>
            </div>

            {/* History */}
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-gray-800 p-6">
              <h3 className="text-xl font-bold text-white mb-4">📊 Historique</h3>
              <div className="flex gap-2 flex-wrap">
                {history.map((item, i) => (
                  <div
                    key={i}
                    className={`
                      px-4 py-2 rounded-lg font-bold text-white shadow-lg
                      ${item.color === 'red' ? 'bg-gradient-to-br from-red-600 to-red-800' : ''}
                      ${item.color === 'black' ? 'bg-gradient-to-br from-gray-900 to-black' : ''}
                      ${item.color === 'green' ? 'bg-gradient-to-br from-green-600 to-green-800' : ''}
                    `}
                  >
                    {item.number}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Controls */}
          <div className="space-y-6">
            {/* Mode Toggle (Auto soon) */}
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-gray-800 p-6">
              <h3 className="text-xl font-bold text-white mb-4">🎮 Mode de jeu</h3>
              <div className="grid grid-cols-2 gap-2">
                <button className="py-3 rounded-lg font-bold bg-red-600 text-white">
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

            {/* Chip Value */}
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-gray-800 p-6">
              <h3 className="text-xl font-bold text-white mb-4">🪙 Valeur du jeton</h3>
              <div className="grid grid-cols-3 gap-2">
                {[10, 50, 100, 500, 1000, 5000].map(value => (
                  <button
                    key={value}
                    onClick={() => setChipValue(value)}
                    disabled={isSpinning}
                    className={`
                      py-3 rounded-lg font-bold transition-all disabled:opacity-50
                      ${chipValue === value 
                        ? 'bg-gradient-to-br from-yellow-500 to-orange-500 text-white shadow-lg shadow-yellow-500/30' 
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }
                    `}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Bets */}
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-gray-800 p-6">
              <h3 className="text-xl font-bold text-white mb-4">💰 Paris en cours</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-gray-400">
                  <span>Total misé:</span>
                  <span className="text-white font-bold">{totalBet} 💰</span>
                </div>
                {result && (
                  <>
                    <div className="flex justify-between text-gray-400">
                      <span>Total gagné:</span>
                      <span className="text-green-400 font-bold">{result.totalWin} 💰</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Profit:</span>
                      <span className={`font-bold ${result.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {result.profit >= 0 ? '+' : ''}{result.profit} 💰
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={spin}
                disabled={isSpinning || totalBet === 0}
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-600/30"
              >
                {isSpinning ? '🎰 EN ROTATION...' : '🎯 LANCER LA ROULETTE'}
              </motion.button>

              <button
                onClick={clearBets}
                disabled={isSpinning || totalBet === 0}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
              >
                🗑️ Effacer les paris
              </button>
            </div>
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