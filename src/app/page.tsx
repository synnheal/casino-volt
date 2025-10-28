'use client';

import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Users, Clock, Zap, ArrowRight, Crown, Flame, Star } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { scrollY } = useScroll();
  
  // Parallax effects
  const y1 = useTransform(scrollY, [0, 500], [0, 150]);
  const y2 = useTransform(scrollY, [0, 500], [0, -150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.8]);

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ 
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100 
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const games = [
    {
      icon: '🎰',
      title: 'Machines à sous',
      desc: 'Jackpots progressifs et gains explosifs',
      color: 'from-purple-500 to-pink-500',
      delay: 0
    },
    {
      icon: '🎯',
      title: 'Roulette',
      desc: 'Misez sur vos numéros chanceux',
      color: 'from-red-500 to-orange-500',
      delay: 0.1
    },
    {
      icon: '🃏',
      title: 'Blackjack',
      desc: 'Défiez le croupier jusqu\'à 21',
      color: 'from-green-500 to-emerald-500',
      delay: 0.2
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-hidden relative">
      {/* Background animé avec texte géant */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Texte géant en background */}
        <motion.div 
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20vw] font-black text-white/5 whitespace-nowrap select-none"
          style={{ y: y1 }}
        >
          VOLT CASINO
        </motion.div>
        <motion.div 
          className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 text-[15vw] font-black text-[#00D9C0]/5 whitespace-nowrap select-none"
          style={{ y: y2 }}
        >
          COMMUNITY #1
        </motion.div>

        {/* Gradient orbs animés */}
        <motion.div 
          className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#00D9C0]/20 rounded-full blur-[100px]"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[120px]"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-pink-500/20 rounded-full blur-[100px]"
          animate={{
            x: [0, 50, -50, 0],
            y: [0, -50, 50, 0],
            scale: [1, 1.1, 0.9, 1],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Particules flottantes */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-[#00D9C0] rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header ultra stylé */}
        <motion.nav 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex justify-between items-center mb-20 backdrop-blur-xl bg-black/20 rounded-2xl px-8 py-4 border border-white/10"
        >
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
          >
            <motion.div 
              className="relative w-12 h-12"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#00D9C0] to-purple-500 rounded-full blur-md opacity-75"></div>
              <div className="relative w-12 h-12 bg-gradient-to-br from-[#00D9C0] to-purple-500 rounded-full flex items-center justify-center shadow-lg shadow-[#00D9C0]/50">
                <span className="text-2xl">⚡</span>
              </div>
            </motion.div>
            <h1 className="text-3xl font-black">
              <span className="bg-gradient-to-r from-white via-[#00D9C0] to-white bg-clip-text text-transparent">
                Volt
              </span>
              {' '}
              <span className="bg-gradient-to-r from-[#00D9C0] via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Casino
              </span>
            </h1>
          </motion.div>
          
          <Link href="/api/auth/discord">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(88, 101, 242, 0.5)" }}
              whileTap={{ scale: 0.95 }}
              className="relative bg-gradient-to-r from-[#5865F2] to-[#7289DA] text-white px-8 py-3 rounded-xl font-bold overflow-hidden group"
            >
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
              <span className="relative z-10 flex items-center gap-2">
                <Zap size={20} />
                Se connecter avec Discord
              </span>
            </motion.button>
          </Link>
        </motion.nav>

        {/* Hero Section ÉPIQUE */}
        <div className="text-center mb-32 relative">
          <motion.div 
            className="mb-12 flex justify-center"
            style={{ opacity, scale }}
          >
            <motion.div 
              className="relative"
              animate={{ 
                y: [0, -20, 0],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              {/* Cercles concentriques animés */}
              <motion.div 
                className="absolute inset-0 -m-8"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="w-full h-full border-4 border-[#00D9C0] rounded-full"></div>
              </motion.div>
              <motion.div 
                className="absolute inset-0 -m-4"
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              >
                <div className="w-full h-full border-4 border-purple-500 rounded-full"></div>
              </motion.div>
              
              <motion.div 
                className="relative w-40 h-40 bg-gradient-to-br from-[#00D9C0] via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <motion.span 
                  className="text-8xl"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  ⚡
                </motion.span>
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            <motion.h2 
              className="text-8xl md:text-9xl font-black mb-6 leading-none"
              style={{
                backgroundImage: 'linear-gradient(45deg, #00D9C0, #a855f7, #ec4899, #00D9C0)',
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            >
              VOLT
            </motion.h2>
            
            <motion.div 
              className="flex items-center justify-center gap-4 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Crown className="text-yellow-400" size={40} />
              </motion.div>
              <h3 className="text-5xl font-black text-white">
                CASINO
              </h3>
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: 0.5 }}
              >
                <Flame className="text-orange-400" size={40} />
              </motion.div>
            </motion.div>

            <motion.div
              className="inline-block bg-gradient-to-r from-red-500 to-orange-500 px-6 py-2 rounded-full mb-8"
              animate={{ 
                boxShadow: [
                  '0 0 20px rgba(239, 68, 68, 0.5)',
                  '0 0 40px rgba(239, 68, 68, 0.8)',
                  '0 0 20px rgba(239, 68, 68, 0.5)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <p className="text-3xl font-black text-white flex items-center gap-2">
                <Flame size={24} />
                FR #1
                <Flame size={24} />
              </p>
            </motion.div>

            <p className="text-2xl text-gray-300 mb-4 max-w-3xl mx-auto font-medium">
              De la <span className="text-[#00D9C0] font-bold">communauté</span> au{' '}
              <span className="text-purple-400 font-bold">concret</span>
            </p>
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
              Des jeux excitants • Des gains réels • Une expérience unique
            </p>
          </motion.div>

          {/* CTA Buttons avec animations folles */}
          <motion.div 
            className="flex flex-wrap gap-6 justify-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Link href="/api/auth/discord">
              <motion.button
                whileHover={{ scale: 1.1, rotate: [0, -2, 2, 0] }}
                whileTap={{ scale: 0.95 }}
                className="relative group"
              >
                <motion.div 
                  className="absolute -inset-1 bg-gradient-to-r from-[#00D9C0] via-purple-500 to-pink-500 rounded-2xl blur-lg opacity-75 group-hover:opacity-100"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
                <div className="relative bg-gradient-to-r from-[#00D9C0] to-purple-500 text-black px-10 py-5 rounded-xl font-black text-xl flex items-center gap-3">
                  <Zap className="animate-pulse" size={24} />
                  Rejoins-Nous !
                  <span className="text-3xl">🎲</span>
                </div>
              </motion.button>
            </Link>
            
            <Link href="#games">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative border-2 border-[#00D9C0] bg-[#00D9C0]/10 backdrop-blur-xl hover:bg-[#00D9C0]/20 text-[#00D9C0] px-10 py-5 rounded-xl font-black text-xl transition-all flex items-center gap-3 group overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
                <span className="relative">Voir les jeux</span>
                <ArrowRight className="relative group-hover:translate-x-2 transition-transform" size={24} />
              </motion.button>
            </Link>
          </motion.div>
        </div>

        {/* Games Section avec cartes 3D */}
        <motion.div 
          id="games" 
          className="mb-32"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          <motion.h3 
            className="text-5xl font-black text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="bg-gradient-to-r from-[#00D9C0] via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Nos Jeux Légendaires
            </span>
          </motion.h3>

          <div className="grid md:grid-cols-3 gap-8">
            {games.map((game, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: game.delay, duration: 0.6 }}
                whileHover={{ 
                  y: -20,
                  rotateX: 5,
                  rotateY: 5,
                }}
                className="relative group"
                style={{ perspective: '1000px' }}
              >
                {/* Glow effect */}
                <motion.div 
                  className={`absolute -inset-1 bg-gradient-to-r ${game.color} rounded-3xl blur-xl opacity-0 group-hover:opacity-75 transition-opacity duration-500`}
                />
                
                <div className="relative bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] p-8 rounded-2xl border-2 border-gray-800 group-hover:border-transparent transition-all duration-300 overflow-hidden">
                  {/* Animated background */}
                  <motion.div 
                    className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                  />
                  
                  <motion.div 
                    className="text-7xl mb-6 relative z-10"
                    whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    {game.icon}
                  </motion.div>
                  
                  <h3 className="text-2xl font-black text-white mb-3 relative z-10">
                    {game.title}
                  </h3>
                  <p className="text-gray-400 relative z-10">
                    {game.desc}
                  </p>

                  {/* Hover indicator */}
                  <motion.div
                    className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                    whileHover={{ x: 5 }}
                  >
                    <ArrowRight className="text-[#00D9C0]" size={24} />
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stats Section ultra stylée */}
        <motion.div 
          className="relative mb-20"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#00D9C0]/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-3xl"></div>
          
          <div className="relative bg-black/40 backdrop-blur-2xl border-2 border-[#00D9C0]/30 rounded-3xl p-12 overflow-hidden">
            {/* Animated grid */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: 'linear-gradient(#00D9C0 1px, transparent 1px), linear-gradient(90deg, #00D9C0 1px, transparent 1px)',
                backgroundSize: '50px 50px'
              }} />
            </div>

            <motion.h3 
              className="text-4xl md:text-5xl font-black text-center mb-12 relative"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Pourquoi jouer sur{' '}
              <span className="bg-gradient-to-r from-[#00D9C0] to-purple-400 bg-clip-text text-transparent">
                Volt Casino
              </span>
              {' '}?
            </motion.h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative">
              {[
                { icon: <Users size={40} />, value: '1000+', label: 'Joueurs actifs', color: 'from-blue-500 to-cyan-500' },
                { icon: <TrendingUp size={40} />, value: '500K+', label: 'Crédits distribués', color: 'from-green-500 to-emerald-500' },
                { icon: <Clock size={40} />, value: '24/7', label: 'Disponible', color: 'from-orange-500 to-red-500' },
                { icon: <Star size={40} />, value: '15K+', label: 'Subscribers', color: 'from-purple-500 to-pink-500' }
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ scale: 1.1, y: -10 }}
                  className="text-center relative group"
                >
                  <motion.div
                    className={`inline-block p-4 rounded-2xl bg-gradient-to-br ${stat.color} mb-4`}
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="text-white">
                      {stat.icon}
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className={`text-5xl md:text-6xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}
                    whileHover={{ scale: 1.1 }}
                  >
                    {stat.value}
                  </motion.div>
                  <div className="text-gray-400 font-semibold">{stat.label}</div>

                  {/* Animated underline */}
                  <motion.div 
                    className={`h-1 bg-gradient-to-r ${stat.color} mt-2 mx-auto rounded-full`}
                    initial={{ width: 0 }}
                    whileInView={{ width: '60%' }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 + 0.3 }}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center py-20"
        >
          <motion.h4 
            className="text-5xl font-black mb-6"
            animate={{
              backgroundImage: [
                'linear-gradient(45deg, #00D9C0, #a855f7)',
                'linear-gradient(45deg, #a855f7, #ec4899)',
                'linear-gradient(45deg, #ec4899, #00D9C0)',
              ],
            }}
            transition={{ duration: 5, repeat: Infinity }}
            style={{
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Prêt à devenir une légende ?
          </motion.h4>
          
          <Link href="/api/auth/discord">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="relative group"
            >
              <motion.div 
                className="absolute -inset-2 bg-gradient-to-r from-[#00D9C0] via-purple-500 to-pink-500 rounded-2xl blur-xl"
                animate={{ 
                  opacity: [0.5, 1, 0.5],
                  scale: [1, 1.1, 1],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <div className="relative bg-gradient-to-r from-[#00D9C0] to-purple-500 text-black px-12 py-6 rounded-xl font-black text-2xl">
                Commencer l'aventure ⚡
              </div>
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}