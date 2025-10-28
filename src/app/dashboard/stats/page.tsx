import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { ArrowLeft } from 'lucide-react';

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    redirect('/?error=not_authenticated');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      discordId: string;
      username: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        casinoStats: true,
      },
    });

    if (!user) {
      redirect('/?error=user_not_found');
    }

    return user;
  } catch (error) {
    redirect('/?error=invalid_token');
  }
}

export default async function StatsPage() {
  const user = await getUser();
  
  const stats = user.casinoStats;
  const totalGames = stats?.totalGames || 0;
  const totalWon = Number(stats?.totalWon || 0);
  const biggestWin = Number(stats?.biggestWin || 0);
  
  // Calculs supplémentaires
  const averageWin = totalGames > 0 ? (totalWon / totalGames).toFixed(0) : '0';
  const gamesPerLevel = stats?.level ? (totalGames / stats.level).toFixed(0) : '0';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a0a2e] to-[#0a0a0a] relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-[#00D9C0]/20 rounded-full blur-3xl -top-48 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Back Button */}
        <Link href="/dashboard">
          <button className="flex items-center gap-2 text-gray-400 hover:text-[#00D9C0] transition-colors mb-6 group">
            <ArrowLeft className="group-hover:-translate-x-1 transition-transform" />
            <span>Retour au dashboard</span>
          </button>
        </Link>

        {/* Header */}
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-gradient-to-r from-[#00D9C0]/20 via-purple-500/20 to-pink-500/20 blur-3xl"></div>
          <div className="relative bg-black/40 backdrop-blur-xl rounded-3xl p-8 border border-[#00D9C0]/30">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-6xl">📊</div>
              <div>
                <h1 className="text-4xl font-black bg-gradient-to-r from-[#00D9C0] to-purple-400 bg-clip-text text-transparent">
                  Statistiques de {user.username}
                </h1>
                <p className="text-gray-400 text-lg">Analyse détaillée de tes performances</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Stats Grid - 5 cartes au lieu de 6 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Total Games */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00D9C0]/20 to-blue-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
            <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-8 border border-[#00D9C0]/30 hover:border-[#00D9C0]/60 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="text-5xl">🎮</div>
                <div className="bg-[#00D9C0]/20 px-3 py-1 rounded-full">
                  <span className="text-[#00D9C0] text-xs font-bold">TOTAL</span>
                </div>
              </div>
              <div className="text-gray-400 text-sm mb-2">Parties jouées</div>
              <div className="text-5xl font-black text-white mb-2">{totalGames}</div>
              <div className="text-xs text-gray-500">
                Moyenne: {gamesPerLevel} parties/niveau
              </div>
            </div>
          </div>

          {/* Total Won */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
            <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-8 border border-green-500/30 hover:border-green-500/60 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="text-5xl">💵</div>
                <div className="bg-green-500/20 px-3 py-1 rounded-full">
                  <span className="text-green-400 text-xs font-bold">GAINS</span>
                </div>
              </div>
              <div className="text-gray-400 text-sm mb-2">Total gagné</div>
              <div className="text-5xl font-black text-green-400 mb-2">
                {totalWon}
                <span className="text-2xl ml-2">💰</span>
              </div>
              <div className="text-xs text-gray-500">
                Moyenne: {averageWin} crédits/partie
              </div>
            </div>
          </div>

          {/* Biggest Win */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
            <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-8 border border-yellow-500/30 hover:border-yellow-500/60 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="text-5xl">🏆</div>
                <div className="bg-yellow-500/20 px-3 py-1 rounded-full">
                  <span className="text-yellow-400 text-xs font-bold">RECORD</span>
                </div>
              </div>
              <div className="text-gray-400 text-sm mb-2">Plus gros gain</div>
              <div className="text-5xl font-black text-yellow-400 mb-2">
                {biggestWin}
                <span className="text-2xl ml-2">✨</span>
              </div>
              <div className="text-xs text-gray-500">
                {biggestWin > 0 ? `${((biggestWin / totalWon) * 100).toFixed(1)}% du total` : 'Aucun gain encore'}
              </div>
            </div>
          </div>

          {/* Level & XP */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
            <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-8 border border-blue-500/30 hover:border-blue-500/60 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="text-5xl">⚡</div>
                <div className="bg-blue-500/20 px-3 py-1 rounded-full">
                  <span className="text-blue-400 text-xs font-bold">NIVEAU</span>
                </div>
              </div>
              <div className="text-gray-400 text-sm mb-2">Niveau actuel</div>
              <div className="text-5xl font-black text-blue-400 mb-2">{stats?.level || 1}</div>
              <div className="text-xs text-gray-500 mb-2">
                XP: {stats?.xp || 0} / 100
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${((stats?.xp || 0) % 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Current Balance */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00D9C0]/20 to-green-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
            <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-8 border border-[#00D9C0]/30 hover:border-[#00D9C0]/60 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="text-5xl">💎</div>
                <div className="bg-[#00D9C0]/20 px-3 py-1 rounded-full">
                  <span className="text-[#00D9C0] text-xs font-bold">SOLDE</span>
                </div>
              </div>
              <div className="text-gray-400 text-sm mb-2">Crédits disponibles</div>
              <div className="text-5xl font-black bg-gradient-to-r from-[#00D9C0] to-green-400 bg-clip-text text-transparent mb-2">
                {user.credits.toString()}
              </div>
              <div className="text-xs text-gray-500">
                Prêt à jouer ! 🎰
              </div>
            </div>
          </div>
        </div>

        {/* Performance Analysis */}
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-2xl"></div>
          <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-8 border border-purple-500/30">
            <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
              <span className="text-3xl">🎯</span>
              Analyse de performance
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              {/* Performance Level */}
              <div className="bg-black/30 rounded-xl p-6 border border-gray-800">
                <div className="text-sm text-gray-400 mb-2">Niveau de performance</div>
                <div className="text-3xl font-black mb-3">
                  {totalGames === 0 ? (
                    <span className="text-gray-500">🆕 Débutant</span>
                  ) : totalGames < 10 ? (
                    <span className="text-blue-400">🌱 Novice</span>
                  ) : totalGames < 50 ? (
                    <span className="text-green-400">⚡ Actif</span>
                  ) : totalGames < 100 ? (
                    <span className="text-purple-400">🔥 Expert</span>
                  ) : (
                    <span className="text-yellow-400">👑 Légende</span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  Basé sur {totalGames} parties
                </div>
              </div>

              {/* Favorite Game (placeholder) */}
              <div className="bg-black/30 rounded-xl p-6 border border-gray-800">
                <div className="text-sm text-gray-400 mb-2">Jeu favori</div>
                <div className="text-3xl font-black text-[#00D9C0] mb-3">
                  🎰 Bientôt
                </div>
                <div className="text-xs text-gray-500">
                  Statistiques par jeu à venir
                </div>
              </div>

              {/* Activity Status */}
              <div className="bg-black/30 rounded-xl p-6 border border-gray-800">
                <div className="text-sm text-gray-400 mb-2">Statut d'activité</div>
                <div className="text-3xl font-black text-green-400 mb-3">
                  🟢 Actif
                </div>
                <div className="text-xs text-gray-500">
                  Dernière connexion: Maintenant
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Achievements Preview */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 blur-2xl"></div>
          <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-8 border border-yellow-500/30">
            <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
              <span className="text-3xl">🏅</span>
              Succès débloqués
            </h2>
            
            <div className="grid md:grid-cols-4 gap-4">
              {/* First Win */}
              <div className={`bg-black/30 rounded-xl p-6 border ${biggestWin > 0 ? 'border-green-500/50' : 'border-gray-800'} text-center`}>
                <div className={`text-5xl mb-3 ${biggestWin > 0 ? '' : 'grayscale opacity-30'}`}>🎊</div>
                <div className={`text-sm font-bold ${biggestWin > 0 ? 'text-green-400' : 'text-gray-600'}`}>
                  Premier gain
                </div>
              </div>

              {/* 10 Games */}
              <div className={`bg-black/30 rounded-xl p-6 border ${totalGames >= 10 ? 'border-blue-500/50' : 'border-gray-800'} text-center`}>
                <div className={`text-5xl mb-3 ${totalGames >= 10 ? '' : 'grayscale opacity-30'}`}>🎮</div>
                <div className={`text-sm font-bold ${totalGames >= 10 ? 'text-blue-400' : 'text-gray-600'}`}>
                  10 parties
                </div>
              </div>

              {/* Level 5 */}
              <div className={`bg-black/30 rounded-xl p-6 border ${(stats?.level || 0) >= 5 ? 'border-purple-500/50' : 'border-gray-800'} text-center`}>
                <div className={`text-5xl mb-3 ${(stats?.level || 0) >= 5 ? '' : 'grayscale opacity-30'}`}>⚡</div>
                <div className={`text-sm font-bold ${(stats?.level || 0) >= 5 ? 'text-purple-400' : 'text-gray-600'}`}>
                  Niveau 5
                </div>
              </div>

              {/* Big Win */}
              <div className={`bg-black/30 rounded-xl p-6 border ${biggestWin >= 1000 ? 'border-yellow-500/50' : 'border-gray-800'} text-center`}>
                <div className={`text-5xl mb-3 ${biggestWin >= 1000 ? '' : 'grayscale opacity-30'}`}>💎</div>
                <div className={`text-sm font-bold ${biggestWin >= 1000 ? 'text-yellow-400' : 'text-gray-600'}`}>
                  Gros gain
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button Bottom */}
        <div className="mt-12 text-center">
          <Link href="/dashboard">
            <button className="px-8 py-4 bg-gradient-to-r from-[#00D9C0] to-purple-500 rounded-xl text-black font-black hover:scale-105 transition-transform shadow-lg shadow-[#00D9C0]/30">
              ← Retour au dashboard
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}