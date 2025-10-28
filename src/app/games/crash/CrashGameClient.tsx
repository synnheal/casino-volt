'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

interface UserData {
  token: string;
  userId: string;
  username: string;
  balance: string;
}

export default function CrashGameClient({ userData }: { userData: UserData }) {
  const [multiplier, setMultiplier] = useState(1.00);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasCrashed, setHasCrashed] = useState(false);
  const [betAmount, setBetAmount] = useState(100);
  const [isBetting, setIsBetting] = useState(false);
  const [profit, setProfit] = useState(0);
  const [showWin, setShowWin] = useState(false);
  const [balance, setBalance] = useState(Number(userData.balance));
  const [history, setHistory] = useState<number[]>([]);
  const [countdown, setCountdown] = useState(0);
  const [activeBets, setActiveBets] = useState(0);
  
  // 🤖 MODE AUTO - Désactivé pour l'instant
  const [autoMode] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const isBettingRef = useRef(false);

  // WebSocket connection
  useEffect(() => {
    socketRef.current = io('http://localhost:3001');

    socketRef.current.on('connect', () => {
      console.log('✅ Connecté au serveur WebSocket');
    });

    socketRef.current.on('game:state', (data) => {
      setIsPlaying(data.isPlaying);
      setMultiplier(data.multiplier);
      setHistory(data.history || []);
    });

    socketRef.current.on('game:waiting', (data) => {
      setCountdown(data.countdown);
      setIsPlaying(false);
      setHasCrashed(false);
    });

    socketRef.current.on('game:started', () => {
      setIsPlaying(true);
      setHasCrashed(false);
      setCountdown(0);
      setMultiplier(1.00);
    });

    socketRef.current.on('game:tick', (data) => {
      setMultiplier(data.multiplier);
    });

    socketRef.current.on('game:crashed', (data) => {
      setHasCrashed(true);
      setIsPlaying(false);
      setMultiplier(data.crashPoint);
      setHistory(prev => [data.crashPoint, ...prev.slice(0, 19)]);
      
      if (isBettingRef.current) {
        setTimeout(() => {
          setIsBetting(false);
          isBettingRef.current = false;
          setHasCrashed(false);
        }, 2000);
      }
    });

    socketRef.current.on('player:bet', (data) => {
      setActiveBets(data.totalBets);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [betAmount]);

  const placeBet = async () => {
    if (isBettingRef.current || isPlaying) return;
    
    try {
      const response = await axios.post('http://localhost:3001/api/crash/bet', {
        token: userData.token,
        amount: betAmount,
      });
      
      setIsBetting(true);
      isBettingRef.current = true;
      setBalance(parseInt(response.data.balance));
    } catch (error: any) {
      console.error('Erreur pari:', error);
    }
  };

  const cashOut = async () => {
    if (!isBettingRef.current || hasCrashed || !isPlaying) return;
    
    try {
      const response = await axios.post('http://localhost:3001/api/crash/cashout', {
        token: userData.token,
      });
      
      const data = response.data;
      const profitAmount = parseInt(data.profit);
      setProfit(profitAmount);
      setBalance(parseInt(data.balance));
      setIsBetting(false);
      isBettingRef.current = false;
      setShowWin(true);
      setTimeout(() => setShowWin(false), 3000);
    } catch (error: any) {
      console.error('Erreur cashout:', error);
    }
  };

  // Animation du graphique
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(0, 217, 192, 0.1)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.moveTo(0, (canvas.height / 10) * i);
        ctx.lineTo(canvas.width, (canvas.height / 10) * i);
        ctx.stroke();
      }

      if (isPlaying || hasCrashed) {
        const progress = Math.min((multiplier - 1) / 9, 1);
        const y = canvas.height - (progress * canvas.height * 0.8);
        
        ctx.strokeStyle = hasCrashed ? '#ef4444' : '#00D9C0';
        ctx.lineWidth = 4;
        ctx.shadowBlur = 20;
        ctx.shadowColor = hasCrashed ? '#ef4444' : '#00D9C0';
        
        ctx.beginPath();
        ctx.moveTo(0, canvas.height);
        ctx.quadraticCurveTo(canvas.width * 0.3, canvas.height * 0.7, canvas.width * 0.8, y);
        ctx.stroke();

        if (!hasCrashed) {
          for (let i = 0; i < 8; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 3;
            
            ctx.fillStyle = 'rgba(0, 217, 192, 0.5)';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      requestAnimationFrame(animate);
    };

    animate();
  }, [multiplier, isPlaying, hasCrashed]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial from-[#00D9C0]/5 via-transparent to-transparent"></div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Bouton Retour */}
        <Link href="/dashboard">
          <motion.button 
            whileHover={{ scale: 1.05, x: -5 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 bg-black/40 backdrop-blur-xl border border-gray-800 hover:border-[#00D9C0]/50 px-6 py-3 rounded-xl text-gray-400 hover:text-[#00D9C0] transition-all mb-6 group shadow-lg"
          >
            <ArrowLeft className="group-hover:-translate-x-1 transition-transform" size={20} />
            <span className="font-semibold">Retour au menu</span>
          </motion.button>
        </Link>

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#00D9C0] rounded-full flex items-center justify-center shadow-lg shadow-[#00D9C0]/50">
              <span className="text-2xl">📈</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Crash Game</h1>
              <p className="text-sm text-gray-400">Bienvenue {userData.username} !</p>
            </div>
          </div>
          
          <div className="bg-[#1a1a1a] px-6 py-3 rounded-xl border border-[#00D9C0]/30">
            <div className="text-xs text-gray-400 mb-1">Balance</div>
            <div className="text-2xl font-bold text-[#00D9C0]">{balance} 💰</div>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Graph */}
          <div className="lg:col-span-2">
            <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-6 relative overflow-hidden">
              
              {/* Countdown */}
              <AnimatePresence>
                {countdown > 0 && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30"
                  >
                    <div className="text-center">
                      <div className="text-8xl font-black text-[#00D9C0] mb-4">
                        {countdown}
                      </div>
                      <div className="text-xl text-gray-400">Partie dans...</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Multiplier Display */}
              <div className="relative z-20 mb-4 text-center">
                <motion.div
                  animate={{ 
                    scale: isPlaying ? [1, 1.1, 1] : 1,
                    color: hasCrashed ? '#ef4444' : '#00D9C0'
                  }}
                  transition={{ repeat: isPlaying ? Infinity : 0, duration: 0.5 }}
                  className="text-6xl font-black"
                >
                  {multiplier.toFixed(2)}x
                </motion.div>
                {hasCrashed && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-red-500 text-3xl font-bold mt-2"
                  >
                    💥 CRASHED!
                  </motion.div>
                )}
              </div>

              {/* Canvas */}
              <canvas 
                ref={canvasRef} 
                className="w-full h-96 rounded-xl"
              />

              {/* Win Popup */}
              <AnimatePresence>
                {showWin && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30"
                  >
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-12 py-8 rounded-2xl shadow-2xl text-center">
                      <div className="text-5xl mb-4">🎉</div>
                      <div className="text-3xl font-black text-white mb-2">CASHOUT!</div>
                      <div className="text-4xl font-black text-white">+{profit} 💰</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Coming Soon Popup */}
              <AnimatePresence>
                {showComingSoon && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30"
                  >
                    <div className="bg-gradient-to-r from-orange-500 to-yellow-500 px-12 py-8 rounded-2xl shadow-2xl text-center border-4 border-yellow-300">
                      <div className="text-5xl mb-4">🚧</div>
                      <div className="text-3xl font-black text-white mb-2">MODE AUTO</div>
                      <div className="text-xl font-bold text-white">Prochainement disponible !</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Players Betting */}
              <div className="mt-4 text-center text-sm text-gray-400">
                {activeBets} joueur{activeBets !== 1 ? 's' : ''} en jeu
              </div>
            </div>

            {/* History */}
            <div className="mt-6 bg-[#1a1a1a] rounded-xl border border-gray-800 p-4">
              <h3 className="text-white font-bold mb-3">📊 Historique</h3>
              <div className="flex gap-2 flex-wrap">
                {history.map((mult, i) => (
                  <div
                    key={i}
                    className={`px-3 py-1 rounded-lg font-bold text-sm ${
                      mult >= 2 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {mult.toFixed(2)}x
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Mode Toggle */}
            <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setAutoMode(false);
                    setRoundsPlayed(0);
                    setAutoProfit(0);
                  }}
                  disabled={isBetting}
                  className={`py-3 rounded-lg font-bold transition-all disabled:opacity-50 ${
                    !autoMode 
                      ? 'bg-[#00D9C0] text-black' 
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  🎮 Manuel
                </button>
                <button
                  onClick={() => {
                    setShowComingSoon(true);
                    setTimeout(() => setShowComingSoon(false), 3000);
                  }}
                  disabled={isBetting}
                  className="relative py-3 rounded-lg font-bold transition-all disabled:opacity-50 bg-gray-800 text-gray-400 hover:bg-gray-700"
                >
                  <span className="flex items-center justify-center gap-2">
                    🤖 Auto
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">
                      SOON
                    </span>
                  </span>
                </button>
              </div>
            </div>

            {/* Bet Amount */}
            <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
              <h3 className="text-white font-bold mb-4">💰 Mise</h3>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                disabled={isBetting || autoMode}
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-[#00D9C0] focus:outline-none disabled:opacity-50 mb-3"
                min="10"
              />
              <div className="grid grid-cols-3 gap-2">
                {[50, 100, 500].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setBetAmount(amount)}
                    disabled={isBetting || autoMode}
                    className="bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg font-bold disabled:opacity-50 text-sm"
                  >
                    {amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto Settings */}
            {autoMode && (
              <>
                <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
                  <h3 className="text-white font-bold mb-4">🎯 Auto Cashout</h3>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="number"
                      value={autoCashoutAt}
                      onChange={(e) => setAutoCashoutAt(Number(e.target.value))}
                      step="0.1"
                      min="1.01"
                      className="flex-1 bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-[#00D9C0] focus:outline-none"
                    />
                    <div className="bg-black border border-gray-700 rounded-lg px-4 py-3 text-[#00D9C0] font-bold">
                      x
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[1.5, 2.0, 3.0, 5.0].map((mult) => (
                      <button
                        key={mult}
                        onClick={() => setAutoCashoutAt(mult)}
                        className="bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg text-sm font-bold"
                      >
                        {mult}x
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
                  <h3 className="text-white font-bold mb-4">🔢 Nombre de tours</h3>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button
                      onClick={() => setAutoRounds(10)}
                      className={`py-2 rounded-lg font-bold ${
                        autoRounds === 10 ? 'bg-[#00D9C0] text-black' : 'bg-gray-800 text-white'
                      }`}
                    >
                      10
                    </button>
                    <button
                      onClick={() => setAutoRounds(25)}
                      className={`py-2 rounded-lg font-bold ${
                        autoRounds === 25 ? 'bg-[#00D9C0] text-black' : 'bg-gray-800 text-white'
                      }`}
                    >
                      25
                    </button>
                    <button
                      onClick={() => setAutoRounds(50)}
                      className={`py-2 rounded-lg font-bold ${
                        autoRounds === 50 ? 'bg-[#00D9C0] text-black' : 'bg-gray-800 text-white'
                      }`}
                    >
                      50
                    </button>
                    <button
                      onClick={() => setAutoRounds('infinite')}
                      className={`py-2 rounded-lg font-bold ${
                        autoRounds === 'infinite' ? 'bg-[#00D9C0] text-black' : 'bg-gray-800 text-white'
                      }`}
                    >
                      ∞
                    </button>
                  </div>
                  <div className="text-sm text-gray-400 text-center">
                    {roundsPlayed} / {autoRounds === 'infinite' ? '∞' : autoRounds} tours
                  </div>
                </div>

                {/* Auto Stats */}
                <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
                  <h3 className="text-white font-bold mb-4">📊 Session Auto</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Profit total:</span>
                      <span className={`font-bold ${autoProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {autoProfit >= 0 ? '+' : ''}{autoProfit} 💰
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tours joués:</span>
                      <span className="text-white font-bold">{roundsPlayed}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Actions */}
            <div className="space-y-3">
              {!isBetting ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={placeBet}
                  disabled={countdown > 0 || isPlaying}
                  className="w-full bg-gradient-to-r from-[#00D9C0] to-blue-500 hover:from-[#00c4ad] hover:to-blue-600 text-black font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#00D9C0]/30"
                >
                  {countdown > 0 ? `Attente ${countdown}s` : isPlaying ? 'En cours...' : 'Placer le pari'}
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={cashOut}
                  disabled={!isPlaying || hasCrashed}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/30"
                >
                  💰 CASHOUT {multiplier.toFixed(2)}x
                </motion.button>
              )}
            </div>

            {/* Current Bet Info */}
            {isBetting && (
              <div className="bg-[#1a1a1a] rounded-xl border border-[#00D9C0]/30 p-4">
                <div className="text-gray-400 text-sm mb-2">Pari en cours</div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-xs text-gray-500">Mise</div>
                    <div className="text-white font-bold">{betAmount} 💰</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Gain potentiel</div>
                    <div className="text-[#00D9C0] font-bold">
                      {Math.floor(betAmount * multiplier)} 💰
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}