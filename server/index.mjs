import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import jwt from 'jsonwebtoken';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
});

const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// État du jeu
let gameState: {
  isPlaying: boolean;
  multiplier: number;
  crashPoint: number;
  startTime: number | null;
  bets: Map<string, { userId: string; amount: bigint; cashedOut: boolean; cashoutMultiplier?: number }>;
  history: number[];
} = {
  isPlaying: false,
  multiplier: 1.0,
  crashPoint: 0,
  startTime: null,
  bets: new Map(),
  history: [],
};

// Génération du crash point (provably fair)
function generateCrashPoint(): number {
  const rand = Math.random();
  
  // Distribution CASINO (la maison gagne) :
  // 75% entre 1.00-1.30x (crash rapide = la plupart des joueurs perdent)
  if (rand < 0.75) {
    return Number((1.00 + Math.random() * 0.30).toFixed(2));
  }
  
  // 15% entre 1.30-2.00x (petit gain possible)
  if (rand < 0.90) {
    return Number((1.30 + Math.random() * 0.70).toFixed(2));
  }
  
  // 8% entre 2.00-5.00x (gain moyen - rare)
  if (rand < 0.98) {
    return Number((2.00 + Math.random() * 3.00).toFixed(2));
  }
  
  // 2% entre 5.00-20.00x (jackpot ultra rare pour attirer les joueurs)
  return Number((5.00 + Math.random() * 15.00).toFixed(2));
}

// Démarrer une nouvelle partie
function startNewRound() {
  gameState.isPlaying = false;
  gameState.multiplier = 1.0;
  gameState.crashPoint = 0;
  gameState.startTime = null;
  // NE PAS effacer les paris ici ! Ils doivent rester pendant le countdown
  
  io.emit('game:waiting', { countdown: 5 });
  
  // Countdown de 5 secondes
  let countdown = 5;
  const countdownInterval = setInterval(() => {
    countdown--;
    io.emit('game:waiting', { countdown });
    
    if (countdown === 0) {
      clearInterval(countdownInterval);
      startGame();
    }
  }, 1000);
}

// Lancer le jeu
function startGame() {
  gameState.isPlaying = true;
  gameState.multiplier = 1.0;
  gameState.crashPoint = generateCrashPoint();
  gameState.startTime = Date.now();
  
  console.log('🎮 Partie démarrée avec', gameState.bets.size, 'paris actifs');
  console.log('📊 Paris:', Array.from(gameState.bets.entries()).map(([userId, bet]) => ({
    userId,
    amount: bet.amount.toString(),
    cashedOut: bet.cashedOut
  })));
  
  io.emit('game:started', { crashPoint: gameState.crashPoint });
  
  // Boucle du multiplicateur
  const gameLoop = setInterval(() => {
    if (!gameState.isPlaying) {
      clearInterval(gameLoop);
      return;
    }
    
    gameState.multiplier += 0.01;
    gameState.multiplier = Number(gameState.multiplier.toFixed(2));
    
    io.emit('game:tick', { multiplier: gameState.multiplier });
    
    // Vérifier si crash
    if (gameState.multiplier >= gameState.crashPoint) {
      gameState.isPlaying = false;
      
      console.log('💥 Crash ! Traitement des paris...');
      
      // Traiter les paris perdus
      gameState.bets.forEach((bet, userId) => {
        if (!bet.cashedOut) {
          console.log('😢 Pari perdu pour', userId);
          // Enregistrer la perte
          saveCasinoGame(userId, bet.amount, BigInt(0), 'loss', gameState.crashPoint);
        }
      });
      
      io.emit('game:crashed', { 
        crashPoint: gameState.crashPoint,
        multiplier: gameState.multiplier 
      });
      
      // Ajouter à l'historique
      gameState.history.unshift(gameState.crashPoint);
      if (gameState.history.length > 20) gameState.history.pop();
      
      // Effacer les paris APRÈS le crash
      gameState.bets.clear();
      
      clearInterval(gameLoop);
      
      // Nouvelle partie dans 3 secondes
      setTimeout(() => {
        startNewRound();
      }, 3000);
    }
  }, 50);
}

// Sauvegarder une partie dans la BDD
async function saveCasinoGame(
  userId: string,
  betAmount: bigint,
  winAmount: bigint,
  result: string,
  crashPoint: number
) {
  try {
    await prisma.casinoGame.create({
      data: {
        userId,
        gameType: 'crash',
        betAmount,
        winAmount,
        result: {
          type: result,
          crashPoint,
          cashoutMultiplier: result === 'win' ? Number(winAmount) / Number(betAmount) : 0,
        },
      },
    });

    // Mettre à jour les stats
    const stats = await prisma.casinoStats.findUnique({
      where: { userId },
    });

    if (stats) {
      await prisma.casinoStats.update({
        where: { userId },
        data: {
          totalGames: stats.totalGames + 1,
          totalWagered: stats.totalWagered + betAmount,
          totalWon: stats.totalWon + winAmount,
          biggestWin: winAmount > stats.biggestWin ? winAmount : stats.biggestWin,
        },
      });
    }
  } catch (error) {
    console.error('Erreur sauvegarde partie:', error);
  }
}

// Middleware pour vérifier le token
function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    return decoded;
  } catch {
    return null;
  }
}

// API: Placer un pari
app.post('/api/crash/bet', async (req, res) => {
  const { token, amount } = req.body;
  
  console.log('📥 Pari reçu:', { amount, isPlaying: gameState.isPlaying });
  
  const user = verifyToken(token);
  if (!user) {
    console.log('❌ Token invalide');
    return res.status(401).json({ error: 'Non authentifié' });
  }
  
  if (gameState.isPlaying) {
    console.log('❌ Partie déjà en cours');
    return res.status(400).json({ error: 'Partie déjà en cours, attends la prochaine !' });
  }
  
  if (gameState.bets.has(user.userId)) {
    console.log('❌ Déjà parié');
    return res.status(400).json({ error: 'Tu as déjà parié pour cette partie' });
  }
  
  // Vérifier les crédits
  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
  });
  
  if (!dbUser || dbUser.credits < BigInt(amount)) {
    console.log('❌ Crédits insuffisants');
    return res.status(400).json({ error: 'Crédits insuffisants' });
  }
  
  console.log('💰 Retrait des crédits:', amount);
  
  // Retirer les crédits
  await prisma.user.update({
    where: { id: user.userId },
    data: { credits: dbUser.credits - BigInt(amount) },
  });
  
  // Ajouter le pari
  gameState.bets.set(user.userId, {
    userId: user.userId,
    amount: BigInt(amount),
    cashedOut: false,
  });
  
  console.log('✅ Pari enregistré');
  
  io.emit('player:bet', { 
    userId: user.userId,
    amount,
    totalBets: gameState.bets.size 
  });
  
  const newBalance = (dbUser.credits - BigInt(amount)).toString();
  res.json({ success: true, balance: newBalance });
});

// API: Cashout
app.post('/api/crash/cashout', async (req, res) => {
  const { token } = req.body;
  
  console.log('💰 Cashout demandé, isPlaying:', gameState.isPlaying);
  
  const user = verifyToken(token);
  if (!user) {
    console.log('❌ Token invalide');
    return res.status(401).json({ error: 'Non authentifié' });
  }
  
  const bet = gameState.bets.get(user.userId);
  console.log('📊 Pari trouvé:', bet);
  
  if (!bet) {
    console.log('❌ Pas de pari actif');
    return res.status(400).json({ error: 'Pas de pari actif' });
  }
  
  if (bet.cashedOut) {
    console.log('❌ Déjà cashedOut');
    return res.status(400).json({ error: 'Déjà cashout' });
  }
  
  if (!gameState.isPlaying) {
    console.log('❌ Partie non active');
    return res.status(400).json({ error: 'Partie non active' });
  }
  
  console.log('🎯 Cashout à', gameState.multiplier);
  
  // Calculer les gains
  const winAmount = BigInt(Math.floor(Number(bet.amount) * gameState.multiplier));
  
  // Ajouter les crédits
  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
  });
  
  if (dbUser) {
    await prisma.user.update({
      where: { id: user.userId },
      data: { credits: dbUser.credits + winAmount },
    });
  }
  
  // Marquer comme cashedOut
  bet.cashedOut = true;
  bet.cashoutMultiplier = gameState.multiplier;
  
  // Sauvegarder la partie
  await saveCasinoGame(user.userId, bet.amount, winAmount, 'win', gameState.multiplier);
  
  console.log('✅ Cashout réussi, gains:', winAmount.toString());
  
  io.emit('player:cashout', {
    userId: user.userId,
    multiplier: gameState.multiplier,
    winAmount: winAmount.toString(),
  });
  
  const profit = winAmount - bet.amount;
  res.json({ 
    success: true, 
    multiplier: gameState.multiplier,
    winAmount: winAmount.toString(),
    profit: profit.toString(),
    balance: (dbUser!.credits + winAmount).toString(),
  });
});

// API: Obtenir l'état du jeu + mon pari
app.post('/api/crash/state', (req, res) => {
  const { token } = req.body;
  
  let myBet = null;
  if (token) {
    const user = verifyToken(token);
    if (user) {
      const bet = gameState.bets.get(user.userId);
      if (bet) {
        myBet = {
          amount: bet.amount.toString(),
          cashedOut: bet.cashedOut,
          cashoutMultiplier: bet.cashoutMultiplier,
        };
      }
    }
  }
  
  res.json({
    isPlaying: gameState.isPlaying,
    multiplier: gameState.multiplier,
    history: gameState.history,
    activeBets: gameState.bets.size,
    myBet,
  });
});

// WebSocket
io.on('connection', (socket) => {
  console.log('Client connecté:', socket.id);
  
  // Envoyer l'état actuel
  socket.emit('game:state', {
    isPlaying: gameState.isPlaying,
    multiplier: gameState.multiplier,
    history: gameState.history,
  });
  
  socket.on('disconnect', () => {
    console.log('Client déconnecté:', socket.id);
  });
});

// Démarrer le serveur
const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Serveur Crash Game lancé sur http://localhost:${PORT}`);
  
  // Démarrer la première partie
  startNewRound();
});