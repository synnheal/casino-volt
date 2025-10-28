import { NextRequest, NextResponse } from 'next/server';

// Redirige vers Discord OAuth2
export async function GET(request: NextRequest) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: 'Configuration Discord manquante' },
      { status: 500 }
    );
  }

  // URL d'autorisation Discord
  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=identify%20email`;

  // Redirection vers Discord
  return NextResponse.redirect(discordAuthUrl);
}