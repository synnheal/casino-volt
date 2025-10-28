export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  email?: string;
}

export interface CasinoUser {
  id: string;
  discordId: string;
  username: string;
  credits: bigint;
  avatar?: string;
  casinoStats?: {
    level: number;
    xp: number;
    totalGames: number;
    totalWagered: bigint;
    totalWon: bigint;
    biggestWin: bigint;
  };
}

export interface Session {
  user: CasinoUser;
  token: string;
  expiresAt: Date;
}

// Ajouter cette interface pour JWT
export interface DecodedToken {
  userId: string;
}