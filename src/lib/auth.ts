import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import prisma from './prisma';

/**
 * Interface pour les données du token JWT
 */
export interface JWTPayload {
  userId: string;
  discordId: string;
  username: string;
}

/**
 * Interface pour les données utilisateur retournées
 */
export interface UserData {
  id: string;
  discordId: string;
  username: string;
  avatar: string;
  credits: bigint;
}

/**
 * Vérifie et décode un token JWT
 * @param token Le token JWT à vérifier
 * @returns Les données décodées ou null si invalide
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('Token invalide:', error);
    return null;
  }
}

/**
 * Crée un nouveau token JWT
 * @param payload Les données à encoder dans le token
 * @param expiresIn Durée de validité (défaut: 7 jours)
 * @returns Le token JWT signé
 */
export function createToken(payload: JWTPayload, expiresIn: string = '7d'): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn });
}

/**
 * Récupère l'utilisateur authentifié depuis les cookies
 * @returns Les données de l'utilisateur ou null si non authentifié
 */
export async function getAuthenticatedUser(): Promise<UserData | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return null;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        discordId: true,
        username: true,
        avatar: true,
        credits: true,
      },
    });

    return user;
  } catch (error) {
    console.error('Erreur récupération utilisateur authentifié:', error);
    return null;
  }
}

/**
 * Vérifie si un utilisateur est authentifié
 * @returns true si authentifié, false sinon
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getAuthenticatedUser();
  return user !== null;
}

/**
 * Récupère le token depuis les cookies
 * @returns Le token ou null si absent
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get('auth_token')?.value || null;
  } catch (error) {
    console.error('Erreur récupération token:', error);
    return null;
  }
}

/**
 * Vérifie un token depuis les headers Authorization
 * @param authHeader Le header Authorization (format: "Bearer TOKEN")
 * @returns Les données décodées ou null
 */
export function verifyAuthHeader(authHeader: string | null): JWTPayload | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  return verifyToken(token);
}
