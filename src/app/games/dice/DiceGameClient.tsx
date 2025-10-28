'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import Link from 'next/link';

interface UserData {
  token: string;
  userId: string;
  username: string;
  balance: string;
}

export default function DiceGameClient({ userData }: { userData: UserData }) {
  const [betAmount, setBetAmount] = useState<string>('100');
  const [balance, setBalance] = useState(userData.balance);
  const [target, setTarget] = useState(50);
  const [rollOver, setRollOver] = useState(true);
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [diceRotation, setDiceRotation] = useState(0);

  const winChance = rollOver ? (100 - target).toFixed(2) : target.toFixed(2);
  const multiplier = rollOver 
    ? ((100 / (100 - target)) * 0.99).toFixed(2)
    : ((100 / target) * 0.99).toFixed(2);
  const potentialWin = (parseInt(betAmount) * parseFloat(multiplier)).toFixed(0);

  const roll = async () => {
    if (isRolling || parseInt(balance) < parseInt(betAmount)) return;

    setIsRolling(true);
    setResult(null);

    // Animation du dé
    const rotations = 5;
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setDiceRotation(prev => prev + (360 * rotations) / 10);
    }

    try {
      const response = await axios.post('/api/dice/roll', {
        token: userData.token,
        betAmount: parseInt(betAmount),
        target,
        rollOver,
      });

      const { result: rollResult, isWin, multiplier: mult, winAmount, profit, balance: newBalance } = response.data;

      setResult({ result: rollResult, isWin, multiplier: mult, winAmount, profit });
      setBalance(newBalance);

      // Ajouter à l'historique
      setHistory(prev => [{
        result: rollResult,
        target,
        rollOver,
        isWin,
        bet: parseInt(betAmount),
        profit,
        time: new Date().toLocaleTimeString()
      }, ...prev.slice(0, 19)]);

      setTimeout(() => {
        setIsRolling(false);
      }, 2000);

    } catch (error: any) {
      console.error('Erreur:', error);
      alert(error.response?.data?.error || 'Erreur lors du roll');
      setIsRolling(false);
    }
  };

  return (
    <>
      <style jsx global>{`
        input[type='range']::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          border: 3px solid #3b82f6;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
        }
        
        input[type='range']::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          border: 3px solid #3b82f6;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
        }
      `}</style>
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0a1a2e] to-[#0a0a0a]">
      {/* Header */}
      <div className="border-b border-gray-800 bg-black/50 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
            ← Retour
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
              <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
                🎲 DICE
              </h1>
              <p className="text-gray-400">Roll under or over to win!</p>
            </div>

            {/* Dice Display */}
            <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 rounded-3xl border-2 border-blue-700/30 p-12 relative overflow-hidden">
              {/* Background effects */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-500/10 animate-pulse"></div>

              {/* 3D Dice */}
              <div className="relative flex items-center justify-center mb-8 h-64">
                <motion.div
                  className="relative w-32 h-32"
                  animate={{ rotate: diceRotation }}
                  transition={{ duration: 0.1, ease: "linear" }}
                  style={{
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* Dice cube */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-2xl border-4 border-blue-400"
                    style={{
                      boxShadow: '0 20px 60px rgba(59, 130, 246, 0.6), inset 0 0 40px rgba(59, 130, 246, 0.3)'
                    }}
                  >
                    {/* Dots pattern */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      {result ? (
                        <div className="text-6xl font-black text-white">
                          {result.result.toFixed(2)}
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-3 p-4">
                          {[...Array(9)].map((_, i) => (
                            <div key={i} className="w-3 h-3 rounded-full bg-white shadow-lg"></div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Result Display */}
              <AnimatePresence>
                {result && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-10 rounded-3xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      className={`p-16 rounded-3xl shadow-2xl text-center ${
                        result.isWin ? 'bg-gradient-to-br from-green-600 to-emerald-600' :
                        'bg-gradient-to-br from-red-600 to-orange-600'
                      }`}
                      initial={{ scale: 0.5, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
                    >
                      <p className="text-8xl font-black text-white mb-6">
                        {result.result.toFixed(2)}
                      </p>
                      <p className="text-4xl text-white/90 font-bold mb-4">
                        {result.isWin ? '🎉 YOU WIN!' : '😢 YOU LOSE'}
                      </p>
                      {result.isWin && (
                        <p className="text-5xl text-white font-black">
                          +{result.winAmount} 💰
                        </p>
                      )}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Target Slider */}
              <div className="relative">
                <div className="text-center mb-4">
                  <p className="text-gray-400 text-sm mb-2">
                    {rollOver ? 'ROLL OVER' : 'ROLL UNDER'}
                  </p>
                  <p className="text-5xl font-black text-white">{target.toFixed(2)}</p>
                </div>

                {/* Visual Slider */}
                <div className="relative h-20 bg-gradient-to-r from-red-600 via-yellow-500 to-green-600 rounded-xl overflow-hidden border-2 border-gray-700">
                  {/* Target indicator */}
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl z-10"
                    style={{ left: `${target}%` }}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border-4 border-blue-500 shadow-xl"></div>
                  </div>

                  {/* Win/Lose zones */}
                  <div className="absolute inset-0 flex items-center justify-between px-4 text-white font-bold">
                    <span className={!rollOver ? 'text-2xl' : 'text-lg opacity-50'}>WIN</span>
                    <span className={rollOver ? 'text-2xl' : 'text-lg opacity-50'}>WIN</span>
                  </div>
                </div>

                {/* Slider Input */}
                <input
                  type="range"
                  min="1"
                  max="99"
                  step="0.01"
                  value={target}
                  onChange={(e) => setTarget(parseFloat(e.target.value))}
                  disabled={isRolling}
                  className="w-full mt-4 appearance-none cursor-pointer disabled:opacity-50"
                  style={{
                    height: '8px',
                    borderRadius: '4px',
                    background: `linear-gradient(to right, 
                      ${rollOver ? '#ef4444' : '#22c55e'} 0%, 
                      ${rollOver ? '#ef4444' : '#22c55e'} ${target}%, 
                      ${rollOver ? '#22c55e' : '#ef4444'} ${target}%, 
                      ${rollOver ? '#22c55e' : '#ef4444'} 100%)`,
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Stats Display */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-4 text-center">
                <p className="text-gray-400 text-sm mb-1">Win Chance</p>
                <p className="text-2xl font-bold text-green-400">{winChance}%</p>
              </div>
              <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-4 text-center">
                <p className="text-gray-400 text-sm mb-1">Multiplier</p>
                <p className="text-2xl font-bold text-yellow-400">{multiplier}x</p>
              </div>
              <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-4 text-center">
                <p className="text-gray-400 text-sm mb-1">Potential Win</p>
                <p className="text-2xl font-bold text-cyan-400">{potentialWin} 💰</p>
              </div>
            </div>

            {/* History */}
            <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
              <h3 className="text-white font-bold mb-4">📊 Recent Rolls</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {history.map((entry, idx) => (
                  <motion.div
                    key={idx}
                    className="flex items-center justify-between bg-black/30 rounded-lg p-3"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${entry.isWin ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-sm text-gray-400">{entry.time}</span>
                      <span className={`text-lg font-bold ${entry.isWin ? 'text-green-400' : 'text-red-400'}`}>
                        {entry.result.toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {entry.rollOver ? '>' : '<'} {entry.target}
                      </span>
                    </div>
                    <span className={`font-bold ${entry.profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {entry.profit > 0 ? '+' : ''}{entry.profit}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Bet Amount */}
            <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
              <label className="text-sm text-gray-400 mb-2 block">Bet Amount</label>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                disabled={isRolling}
                className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white font-bold text-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="grid grid-cols-4 gap-2">
                {[10, 50, 100, 500].map((value) => (
                  <button
                    key={value}
                    onClick={() => setBetAmount(value.toString())}
                    disabled={isRolling}
                    className="py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-bold transition-colors disabled:opacity-50"
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            {/* Roll Over/Under Toggle */}
            <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
              <label className="text-sm text-gray-400 mb-3 block">Prediction</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setRollOver(false)}
                  disabled={isRolling}
                  className={`py-4 rounded-xl font-bold transition-all ${
                    !rollOver
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
                  }`}
                >
                  ROLL UNDER
                </button>
                <button
                  onClick={() => setRollOver(true)}
                  disabled={isRolling}
                  className={`py-4 rounded-xl font-bold transition-all ${
                    rollOver
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
                  }`}
                >
                  ROLL OVER
                </button>
              </div>
            </div>

            {/* Roll Button */}
            <button
              onClick={roll}
              disabled={isRolling || parseInt(balance) < parseInt(betAmount)}
              className={`w-full py-5 rounded-xl font-bold text-xl transition-all ${
                isRolling || parseInt(balance) < parseInt(betAmount)
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/50'
              }`}
            >
              {isRolling ? '🎲 ROLLING...' : '🎲 ROLL DICE'}
            </button>

            {/* Stats */}
            <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
              <h3 className="text-white font-bold mb-4">📈 Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Rolls</span>
                  <span className="font-bold text-white">{history.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Wins</span>
                  <span className="font-bold text-green-400">
                    {history.filter(h => h.isWin).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Losses</span>
                  <span className="font-bold text-red-400">
                    {history.filter(h => !h.isWin).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Net Profit</span>
                  <span className={`font-bold ${history.reduce((sum, h) => sum + h.profit, 0) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {history.reduce((sum, h) => sum + h.profit, 0)} 💰
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}