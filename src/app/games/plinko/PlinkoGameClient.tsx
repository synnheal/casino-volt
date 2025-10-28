'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import Matter from 'matter-js';

interface UserData {
  token: string;
  userId: string;
  username: string;
  balance: string;
}

interface FloatingText {
  id: number;
  multiplier: number;
  x: number;
  y: number;
}

const MULTIPLIERS = {
  low: {
    8: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    12: [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
    16: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16]
  },
  medium: {
    8: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    12: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
    16: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110]
  },
  high: {
    8: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
    12: [76, 10, 3, 0.9, 0.3, 0.2, 0.2, 0.2, 0.3, 0.9, 3, 10, 76],
    16: [420, 56, 18, 5, 1.9, 0.3, 0.2, 0.2, 0.2, 0.2, 0.2, 0.3, 1.9, 5, 18, 56, 420]
  }
};

function getMultiplierColor(mult: number): string {
  if (mult >= 50) return '#a855f7'; // purple
  if (mult >= 10) return '#ef4444'; // red
  if (mult >= 3) return '#f97316'; // orange
  if (mult >= 1) return '#22c55e'; // green
  return '#3b82f6'; // blue
}

export default function PlinkoGameClient({ userData }: { userData: UserData }) {
  const [betAmount, setBetAmount] = useState(100);
  const [risk, setRisk] = useState<'low' | 'medium' | 'high'>('medium');
  const [rows, setRows] = useState<8 | 12 | 16>(12);
  const [balance, setBalance] = useState(Number(userData.balance));
  const [history, setHistory] = useState<any[]>([]);
  const [totalProfit, setTotalProfit] = useState(0);
  
  // 🔥 NOUVEAU: Multi-balles
  const [activeBalls, setActiveBalls] = useState(0);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const lastDropTime = useRef(0);
  const nextFloatingId = useRef(0);
  
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);

  const currentMultipliers = MULTIPLIERS[risk][rows];

  // Initialiser Matter.js
  useEffect(() => {
    if (!sceneRef.current) return;

    const width = 800;
    const height = 600;

    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 1, scale: 0.001 }
    });
    engineRef.current = engine;

    const render = Matter.Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width,
        height,
        wireframes: false,
        background: 'rgba(10, 10, 10, 0.5)',
      },
    });
    renderRef.current = render;

    // Créer les pins
    const pins: Matter.Body[] = [];
    const pinRadius = 5;
    const spacing = 60;
    const startY = 120;

    for (let row = 0; row < rows; row++) {
      const pinsInRow = row + 3;
      const rowWidth = pinsInRow * spacing;
      const startX = (width - rowWidth) / 2 + spacing / 2;

      for (let col = 0; col < pinsInRow; col++) {
        const pin = Matter.Bodies.circle(
          startX + col * spacing,
          startY + row * spacing,
          pinRadius,
          {
            isStatic: true,
            restitution: 0.9,
            render: {
              fillStyle: '#00D9C0',
              strokeStyle: '#00fff5',
              lineWidth: 2
            },
          }
        );
        pins.push(pin);
      }
    }

    // Créer les slots en bas
    const slots: Matter.Body[] = [];
    const slotWidth = width / currentMultipliers.length;
    const slotHeight = 60;
    const slotY = height - slotHeight / 2;

    currentMultipliers.forEach((mult, i) => {
      const slotX = i * slotWidth + slotWidth / 2;
      const color = getMultiplierColor(mult);
      
      const slot = Matter.Bodies.rectangle(slotX, slotY, slotWidth - 2, slotHeight, {
        isStatic: true,
        render: {
          fillStyle: color + '40',
          strokeStyle: color,
          lineWidth: 2
        },
      });
      slots.push(slot);
    });

    // Murs et sol
    const ground = Matter.Bodies.rectangle(width / 2, height + 25, width, 50, {
      isStatic: true,
      render: { fillStyle: '#1a1a1a' },
    });

    const leftWall = Matter.Bodies.rectangle(-5, height / 2, 10, height, {
      isStatic: true,
      render: { fillStyle: '#1a1a1a' },
    });

    const rightWall = Matter.Bodies.rectangle(width + 5, height / 2, 10, height, {
      isStatic: true,
      render: { fillStyle: '#1a1a1a' },
    });

    Matter.Composite.add(engine.world, [...pins, ...slots, ground, leftWall, rightWall]);

    Matter.Render.run(render);
    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);

    return () => {
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
      Matter.Engine.clear(engine);
      if (render.canvas) {
        render.canvas.remove();
      }
      if (render.textures) {
        render.textures = {};
      }
    };
  }, [rows, currentMultipliers.length]);

  // 🔥 Drop une seule balle (avec cooldown 200ms)
  const dropSingleBall = async () => {
    const now = Date.now();
    if (now - lastDropTime.current < 200) return; // Cooldown 200ms
    if (balance < betAmount || !engineRef.current) return;

    lastDropTime.current = now;
    setActiveBalls(prev => prev + 1);

    const width = 800;
    const height = 600;

    // Créer la balle
    const ball = Matter.Bodies.circle(
      width / 2 + (Math.random() - 0.5) * 30,
      50,
      10,
      {
        restitution: 0.8,
        friction: 0.05,
        density: 0.04,
        render: {
          fillStyle: '#FFD700',
          strokeStyle: '#FFA500',
          lineWidth: 2
        },
      }
    );

    Matter.Composite.add(engineRef.current.world, ball);

    // Attendre que la balle arrive en bas
    await new Promise<void>(resolve => {
      const checkBall = setInterval(() => {
        if (ball.position.y > height - 100) {
          clearInterval(checkBall);
          resolve();
        }
      }, 100);
    });

    await new Promise(resolve => setTimeout(resolve, 300));

    // Calculer le slot
    const slotWidth = width / currentMultipliers.length;
    let finalIndex = Math.floor(ball.position.x / slotWidth);
    finalIndex = Math.max(0, Math.min(currentMultipliers.length - 1, finalIndex));

    // Retirer la balle
    Matter.Composite.remove(engineRef.current.world, ball);

    // API call
    try {
      const response = await axios.post('/api/plinko/drop', {
        token: userData.token,
        betAmount,
        risk,
        rows,
      });

      const { multiplier, winAmount, profit, balance: newBalance } = response.data;

      setBalance(Number(newBalance));
      setTotalProfit(prev => prev + profit);

      // 💫 Ajouter texte flottant
      const id = nextFloatingId.current++;
      setFloatingTexts(prev => [...prev, {
        id,
        multiplier,
        x: finalIndex * slotWidth + slotWidth / 2,
        y: height - 80
      }]);

      // Retirer le texte après 2s
      setTimeout(() => {
        setFloatingTexts(prev => prev.filter(t => t.id !== id));
      }, 2000);

      // Historique
      setHistory(prev => [{
        multiplier,
        winAmount,
        profit,
        time: new Date().toLocaleTimeString()
      }, ...prev.slice(0, 19)]);

    } catch (error) {
      console.error('Erreur drop:', error);
    }

    setActiveBalls(prev => prev - 1);
  };

  // 📦 Lancer plusieurs balles
  const dropMultipleBalls = async (count: number) => {
    for (let i = 0; i < count; i++) {
      await dropSingleBall();
      await new Promise(resolve => setTimeout(resolve, 250)); // 250ms entre chaque
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial from-[#00D9C0]/5 via-transparent to-transparent"></div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
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
                <span className="text-5xl">🎴</span>
                Plinko
              </h1>
              <p className="text-sm text-gray-400">Bienvenue {userData.username} !</p>
            </div>
          </div>
          
          <div className="bg-[#1a1a1a] px-6 py-3 rounded-xl border border-[#00D9C0]/30">
            <div className="text-xs text-gray-400 mb-1">Balance</div>
            <div className="text-2xl font-bold text-[#00D9C0]">{balance} 💰</div>
          </div>
        </div>

        {/* Main Game */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Plinko Board */}
          <div className="lg:col-span-2">
            <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-4 relative">
              {/* Canvas */}
              <div ref={sceneRef} className="rounded-xl overflow-hidden" />

              {/* 💫 Textes flottants */}
              <AnimatePresence>
                {floatingTexts.map(text => (
                  <motion.div
                    key={text.id}
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 0, y: -100 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2 }}
                    className="absolute pointer-events-none text-2xl font-black"
                    style={{
                      left: text.x,
                      top: text.y,
                      color: getMultiplierColor(text.multiplier)
                    }}
                  >
                    x{text.multiplier}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Stats live */}
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="bg-black/40 backdrop-blur-xl rounded-xl p-3 border border-gray-800">
                  <div className="text-xs text-gray-400">Balles actives</div>
                  <div className="text-2xl font-bold text-yellow-400">{activeBalls}</div>
                </div>
                <div className="bg-black/40 backdrop-blur-xl rounded-xl p-3 border border-gray-800">
                  <div className="text-xs text-gray-400">Profit session</div>
                  <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {totalProfit >= 0 ? '+' : ''}{totalProfit}
                  </div>
                </div>
                <div className="bg-black/40 backdrop-blur-xl rounded-xl p-3 border border-gray-800">
                  <div className="text-xs text-gray-400">Parties</div>
                  <div className="text-2xl font-bold text-[#00D9C0]">{history.length}</div>
                </div>
              </div>

              {/* Multipliers Display */}
              <div className="mt-4 flex gap-1">
                {currentMultipliers.map((mult, i) => (
                  <div
                    key={i}
                    className="flex-1 text-center py-2 rounded-lg font-bold text-sm"
                    style={{
                      backgroundColor: getMultiplierColor(mult) + '20',
                      color: getMultiplierColor(mult),
                      border: `2px solid ${getMultiplierColor(mult)}`
                    }}
                  >
                    {mult}x
                  </div>
                ))}
              </div>
            </div>

            {/* History */}
            <div className="mt-6 bg-[#1a1a1a] rounded-xl border border-gray-800 p-4">
              <h3 className="text-white font-bold mb-3">📊 Historique</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {history.map((item, i) => (
                  <div key={i} className="flex justify-between items-center bg-black/40 px-3 py-2 rounded-lg">
                    <span className="text-sm text-gray-400">{item.time}</span>
                    <span className="font-bold" style={{ color: getMultiplierColor(item.multiplier) }}>
                      x{item.multiplier}
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
            <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
              <h3 className="text-white font-bold mb-4">💰 Mise</h3>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-[#00D9C0] focus:outline-none mb-3"
                min="10"
              />
              <div className="grid grid-cols-3 gap-2">
                {[50, 100, 500].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setBetAmount(amount)}
                    className="bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg font-bold"
                  >
                    {amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Risk */}
            <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
              <h3 className="text-white font-bold mb-4">⚠️ Risque</h3>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRisk(r)}
                    className={`py-3 rounded-lg font-bold transition-all ${
                      risk === r 
                        ? 'bg-[#00D9C0] text-black' 
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {r === 'low' ? 'Bas' : r === 'medium' ? 'Moyen' : 'Élevé'}
                  </button>
                ))}
              </div>
            </div>

            {/* Rows */}
            <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
              <h3 className="text-white font-bold mb-4">📏 Lignes</h3>
              <div className="grid grid-cols-3 gap-2">
                {([8, 12, 16] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRows(r)}
                    className={`py-3 rounded-lg font-bold transition-all ${
                      rows === r 
                        ? 'bg-[#00D9C0] text-black' 
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* 🔥 Lancer les balles */}
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={dropSingleBall}
                disabled={balance < betAmount}
                className="w-full bg-gradient-to-r from-[#00D9C0] to-blue-500 hover:from-[#00c4ad] hover:to-blue-600 text-black font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#00D9C0]/30"
              >
                🎴 LANCER UNE BALLE
              </motion.button>

              {/* 📦 Lancer en masse */}
              <div className="grid grid-cols-3 gap-2">
                {[10, 20, 50].map((count) => (
                  <button
                    key={count}
                    onClick={() => dropMultipleBalls(count)}
                    disabled={balance < betAmount * count}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {count}x
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 text-center">
                💡 Spam le bouton ou lance en masse !
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}