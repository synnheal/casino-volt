import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import BlackjackGameClient from './BlackjackGameClient';

async function getUserData() {
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
      select: {
        id: true,
        username: true,
        credits: true,
      },
    });

    if (!user) {
      redirect('/?error=user_not_found');
    }

    return {
      token,
      userId: user.id,
      username: user.username,
      balance: user.credits.toString(),
    };
  } catch (error) {
    redirect('/?error=invalid_token');
  }
}

export default async function BlackjackGamePage() {
  const userData = await getUserData();
  return <BlackjackGameClient userData={userData} />;
}