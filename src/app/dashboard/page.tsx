import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import UserAvatar from '@/components/UserAvatar';

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

export default async function DashboardPage() {
  const user = await getUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a0a2e] to-[#0a0a0a] relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-[#00D9C0]/20 rounded-full blur-3xl -top-48 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse delay-1000"></div>
        <div className="absolute w-64 h-64 bg-pink-500/20 rounded-full blur-3xl top-1/2 left-1/2 animate-pulse delay-500"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Hero Header */}
        <div className="relative mb-12 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#00D9C0]/20 via-purple-500/20 to-pink-500/20 blur-3xl"></div>
          <div className="relative bg-black/40 backdrop-blur-xl rounded-3xl p-8 border border-[#00D9C0]/30 shadow-2xl shadow-[#00D9C0]/20">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              {/* User Info */}
              <div className="flex items-center gap-6">
                <UserAvatar 
                  discordId={user.discordId}
                  avatar={user.avatar}
                  username={user.username}
                  level={user.casinoStats?.level || 1}
                />
                
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-4xl font-black bg-gradient-to-r from-[#00D9C0] via-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {user.username}
                    </h1>
                    <span className="text-3xl animate-bounce">👑</span>
                  </div>
                  <p className="text-gray-400 text-lg">Bienvenue dans ton empire du jeu !</p>
                  
                  {/* XP Bar */}
                  <div className="mt-3 w-64">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Niveau {user.casinoStats?.level || 1}</span>
                      <span>{user.casinoStats?.xp || 0} XP</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#00D9C0] to-purple-500 rounded-full transition-all duration-1000"
                        style={{ width: `${((user.casinoStats?.xp || 0) % 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Balance */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 blur-2xl"></div>
                <div className="relative bg-gradient-to-br from-yellow-500/10 to-orange-500/10 backdrop-blur-xl rounded-2xl p-6 border border-yellow-500/30">
                  <div className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                    <span>💎</span>
                    Solde disponible
                  </div>
                  <div className="text-5xl font-black bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent flex items-center gap-3">
                    {user.credits.toString()}
                    <span className="text-4xl">💰</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
          {/* Total Games */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00D9C0]/20 to-blue-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
            <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-[#00D9C0]/30 hover:border-[#00D9C0]/60 transition-all">
              <div className="text-4xl mb-2">🎮</div>
              <div className="text-gray-400 text-sm mb-1">Parties jouées</div>
              <div className="text-3xl font-black text-white">{user.casinoStats?.totalGames || 0}</div>
            </div>
          </div>

          {/* Total Won */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
            <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-green-500/30 hover:border-green-500/60 transition-all">
              <div className="text-4xl mb-2">💵</div>
              <div className="text-gray-400 text-sm mb-1">Total gagné</div>
              <div className="text-3xl font-black text-green-400">
                {user.casinoStats?.totalWon.toString() || '0'}
              </div>
            </div>
          </div>

          {/* Biggest Win */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
            <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-yellow-500/30 hover:border-yellow-500/60 transition-all">
              <div className="text-4xl mb-2">🏆</div>
              <div className="text-gray-400 text-sm mb-1">Plus gros gain</div>
              <div className="text-3xl font-black text-yellow-400">
                {user.casinoStats?.biggestWin.toString() || '0'}
              </div>
            </div>
          </div>
        </div>

        {/* Games Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="text-4xl">🎰</div>
            <div>
              <h2 className="text-3xl font-black text-white">Nos Jeux</h2>
              <p className="text-gray-400">Choisis ton jeu et deviens une légende</p>
            </div>
          </div>
        </div>

        {/* Games Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Crash */}
          <Link href="/games/crash" className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00D9C0]/30 to-blue-500/30 rounded-3xl blur-2xl group-hover:blur-3xl transition-all opacity-0 group-hover:opacity-100"></div>
            <div className="relative bg-black/40 backdrop-blur-xl rounded-3xl overflow-hidden border border-[#00D9C0]/30 group-hover:border-[#00D9C0]/60 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#00D9C0]/20 to-transparent rounded-bl-full"></div>
              
              <div className="p-8">
                <div className="text-7xl mb-4 group-hover:scale-110 transition-transform">📈</div>
                <h3 className="text-2xl font-black text-white mb-2">Crash Game</h3>
                <p className="text-gray-400 text-sm mb-6">
                  Cashout avant le crash et multiplie tes gains jusqu'à 100x !
                </p>
                
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-[#00D9C0]/20 px-3 py-1 rounded-full text-[#00D9C0] text-xs font-bold">
                    ⚡ Rapide
                  </div>
                  <div className="bg-orange-500/20 px-3 py-1 rounded-full text-orange-400 text-xs font-bold">
                    🔥 Populaire
                  </div>
                </div>

                <button className="w-full bg-gradient-to-r from-[#00D9C0] to-blue-500 hover:from-[#00c4ad] hover:to-blue-600 text-black font-black py-4 rounded-xl transition-all shadow-lg shadow-[#00D9C0]/30 group-hover:shadow-[#00D9C0]/50 group-hover:scale-105">
                  Jouer maintenant
                </button>
              </div>
            </div>
          </Link>

          {/* Slots */}
          <Link href="/games/slots" className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00D9C0]/30 to-purple-500/30 rounded-3xl blur-2xl group-hover:blur-3xl transition-all opacity-0 group-hover:opacity-100"></div>
            <div className="relative bg-black/40 backdrop-blur-xl rounded-3xl overflow-hidden border border-[#00D9C0]/30 group-hover:border-[#00D9C0]/60 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-transparent rounded-bl-full"></div>
              
              <div className="p-8">
                <div className="text-7xl mb-4 group-hover:scale-110 transition-transform">🎰</div>
                <h3 className="text-2xl font-black text-white mb-2">Slots Premium</h3>
                <p className="text-gray-400 text-sm mb-6">
                  Aligne les symboles et décroche le jackpot légendaire !
                </p>
                
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-purple-500/20 px-3 py-1 rounded-full text-purple-400 text-xs font-bold">
                    💎 Classique
                  </div>
                  <div className="bg-yellow-500/20 px-3 py-1 rounded-full text-yellow-400 text-xs font-bold">
                    🎁 Jackpot
                  </div>
                </div>

                <button className="w-full bg-gradient-to-r from-[#00D9C0] to-purple-500 hover:from-[#00c4ad] hover:to-purple-600 text-black font-black py-4 rounded-xl transition-all shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 group-hover:scale-105">
                  Jouer maintenant
                </button>
              </div>
            </div>
          </Link>

          {/* Blackjack */}
          <Link href="/games/blackjack" className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/30 to-emerald-500/30 rounded-3xl blur-2xl group-hover:blur-3xl transition-all opacity-0 group-hover:opacity-100"></div>
            <div className="relative bg-black/40 backdrop-blur-xl rounded-3xl overflow-hidden border border-green-500/30 group-hover:border-green-500/60 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/20 to-transparent rounded-bl-full"></div>
              
              <div className="p-8">
                <div className="text-7xl mb-4 group-hover:scale-110 transition-transform">🃏</div>
                <h3 className="text-2xl font-black text-white mb-2">Blackjack</h3>
                <p className="text-gray-400 text-sm mb-6">
                  Bats le croupier sans dépasser 21. Stratégie et chance !
                </p>
                
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-green-500/20 px-3 py-1 rounded-full text-green-400 text-xs font-bold">
                    🎴 Stratégie
                  </div>
                  <div className="bg-blue-500/20 px-3 py-1 rounded-full text-blue-400 text-xs font-bold">
                    🧠 Skill
                  </div>
                </div>

                <button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-green-500/30 group-hover:shadow-green-500/50 group-hover:scale-105">
                  Jouer maintenant
                </button>
              </div>
            </div>
          </Link>

          {/* Plinko */}
          <Link href="/games/plinko" className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-3xl blur-2xl group-hover:blur-3xl transition-all opacity-0 group-hover:opacity-100"></div>
            <div className="relative bg-black/40 backdrop-blur-xl rounded-3xl overflow-hidden border border-purple-500/30 group-hover:border-purple-500/60 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-500/20 to-transparent rounded-bl-full"></div>
              
              <div className="p-8">
                <div className="text-7xl mb-4 group-hover:scale-110 transition-transform">🎴</div>
                <h3 className="text-2xl font-black text-white mb-2">Plinko</h3>
                <p className="text-gray-400 text-sm mb-6">
                  Lâche la balle et regarde-la rebondir vers la fortune !
                </p>
                
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-pink-500/20 px-3 py-1 rounded-full text-pink-400 text-xs font-bold">
                    🎲 Chance
                  </div>
                  <div className="bg-purple-500/20 px-3 py-1 rounded-full text-purple-400 text-xs font-bold">
                    🌟 Visuel
                  </div>
                </div>

                <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 group-hover:scale-105">
                  Jouer maintenant
                </button>
              </div>
            </div>
          </Link>

          {/* Roulette - Prochaine mise à jour */}
          <div className="group relative cursor-not-allowed">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/30 to-orange-500/30 rounded-3xl blur-2xl opacity-50"></div>
            <div className="relative bg-black/40 backdrop-blur-xl rounded-3xl overflow-hidden border border-red-500/30 opacity-60">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/20 to-transparent rounded-bl-full"></div>
              
              {/* Badge "Prochaine MàJ" */}
              <div className="absolute top-4 right-4 z-10">
                <div className="bg-gradient-to-r from-orange-500 to-yellow-500 px-3 py-1 rounded-full border-2 border-yellow-300 animate-pulse">
                  <span className="text-white text-xs font-black">🚧 PROCHAINE MÀJ</span>
                </div>
              </div>
              
              <div className="p-8">
                <div className="text-7xl mb-4 grayscale">🎯</div>
                <h3 className="text-2xl font-black text-white mb-2">Roulette</h3>
                <p className="text-gray-400 text-sm mb-6">
                  Rouge ou noir ? Le destin tourne avec la roue !
                </p>
                
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-red-500/20 px-3 py-1 rounded-full text-red-400 text-xs font-bold">
                    🎰 Casino
                  </div>
                  <div className="bg-yellow-500/20 px-3 py-1 rounded-full text-yellow-400 text-xs font-bold">
                    👑 Prestige
                  </div>
                </div>

                <button disabled className="w-full bg-gray-800 text-gray-500 font-black py-4 rounded-xl cursor-not-allowed">
                  🔒 Bientôt disponible
                </button>
              </div>
            </div>
          </div>

          {/* Dice - Maintenance */}
          <div className="group relative opacity-60 cursor-not-allowed">
            <div className="relative bg-black/40 backdrop-blur-xl rounded-3xl overflow-hidden border border-gray-700">
              <div className="absolute top-4 right-4 z-10">
                <div className="bg-orange-500 text-white text-xs px-3 py-1 rounded-full font-bold animate-pulse">
                  🔧 MAINTENANCE
                </div>
              </div>
              
              <div className="p-8">
                <div className="text-7xl mb-4 grayscale">🎲</div>
                <h3 className="text-2xl font-black text-gray-400 mb-2">Dice</h3>
                <p className="text-gray-600 text-sm mb-6">
                  Lance les dés et parie sur le résultat. Bientôt disponible !
                </p>
                
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-gray-800 px-3 py-1 rounded-full text-gray-600 text-xs font-bold">
                    ⏳ Bientôt
                  </div>
                </div>

                <button className="w-full bg-gray-800 text-gray-600 font-black py-4 rounded-xl cursor-not-allowed">
                  En maintenance
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA Section */}
        <div className="mt-12 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[#00D9C0]/20 via-purple-500/20 to-pink-500/20 blur-3xl"></div>
          <div className="relative bg-black/40 backdrop-blur-xl rounded-3xl p-8 border border-[#00D9C0]/30 text-center">
            <div className="text-6xl mb-4">🎊</div>
            <h3 className="text-3xl font-black text-white mb-3">Prêt à devenir une légende ?</h3>
            <p className="text-gray-400 mb-6">
              Rejoins des milliers de joueurs et tente ta chance pour gagner gros !
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/dashboard/stats">
                <button className="px-8 py-4 bg-gradient-to-r from-[#00D9C0] to-purple-500 rounded-xl text-black font-black hover:scale-105 transition-transform shadow-lg shadow-[#00D9C0]/30">
                  📊 Voir mes statistiques
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}