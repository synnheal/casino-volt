import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Header Authorization manquant');
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

    console.log('✅ Token décodé:', decoded.userId);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        credits: true,
      },
    });

    if (!user) {
      console.error('❌ Utilisateur non trouvé:', decoded.userId);
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    console.log('✅ Balance récupérée:', user.credits.toString());

    return NextResponse.json({ 
      balance: user.credits.toString(),
      username: user.username,
    });
  } catch (error: any) {
    console.error('❌ Erreur API balance:', error.message);
    return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
  }
}