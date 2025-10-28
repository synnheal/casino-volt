'use client';

import { useState } from 'react';

interface UserAvatarProps {
  discordId: string;
  avatar: string | null;
  username: string;
  level: number;
}

export default function UserAvatar({ discordId, avatar, username, level }: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);

  const avatarUrl = avatar 
    ? `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.png?size=128`
    : `https://cdn.discordapp.com/embed/avatars/${parseInt(discordId) % 5}.png`;

  const fallbackUrl = `https://cdn.discordapp.com/embed/avatars/${parseInt(discordId) % 5}.png`;

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-[#00D9C0] to-purple-500 rounded-full blur-xl opacity-75 animate-pulse"></div>
      <div className="relative w-24 h-24 rounded-full overflow-hidden shadow-2xl border-4 border-[#00D9C0]">
        <img 
          src={imgError ? fallbackUrl : avatarUrl}
          alt={username}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
      <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full px-3 py-1 text-xs font-bold text-black shadow-lg">
        VIP {level}
      </div>
    </div>
  );
}