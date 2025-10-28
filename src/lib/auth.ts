import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import prisma from './prisma';

/**
 * Interface pour les donn�es du token JWT
 */
export interface JWTPayload {
  userId: string;
  discordId: string;
  username: string;
}

/**
 * Interface pour les donn�es utilisateur retourn�es
 */
export interface UserData {
  id: string;
  discordId: string;
  username: string;
  avatar: string;
  credits: bigint;
}

/**
 * V�rifie et d�code un token JWT
 * @param token Le token JWT � v�rifier
 * @returns Les donn�es d�cod�es ou null si invalide
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
 * Cr�e un nouveau token JWT
 * @param payload Les donn�es � encoder dans le token
 * @param expiresIn Dur�e de validit� (d�faut: 7 jours)
 * @returns Le token JWT sign�
 */
export function createToken(payload: JWTPayload, expiresIn: string = '7d'): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn });
}

/**
 * R�cup�re l'utilisateur authentifi� depuis les cookies
 * @returns Les donn�es de l'utilisateur ou null si non authentifi�
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
    console.error('Erreur r�cup�ration utilisateur authentifi�:', error);
    return null;
  }
}

/**
 * V�rifie si un utilisateur est authentifi�
 * @returns true si authentifi�, false sinon
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getAuthenticatedUser();
  return user !== null;
}

/**
 * R�cup�re le token depuis les cookies
 * @returns Le token ou null si absent
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get('auth_token')?.value || null;
  } catch (error) {
    console.error('Erreur r�cup�ration token:', error);
    return null;
  }
}

/**
 * V�rifie un token depuis les headers Authorization
 * @param authHeader Le header Authorization (format: "Bearer TOKEN")
 * @returns Les donn�es d�cod�es ou null
 */
export function verifyAuthHeader(authHeader: string | null): JWTPayload | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  return verifyToken(token);
}
