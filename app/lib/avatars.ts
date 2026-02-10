export const AVATAR_MAP: Record<string, string> = {
  "SURATMI": "/avatars/SURATMI.jpeg",
  "CHIESA ZAHROTUNNISA": "/avatars/CHIESA-ZAHROTUNNISA.jpeg",
  "PEBRIANTI PAUDI": "/avatars/PEBRIANTI-PAUDI.jpeg",
  "RENY VIOLETA": "/avatars/RENY-VIOLETA.jpeg"
};

export function getAvatarUrl(name: string) {
  const key = name.trim().toUpperCase();
  return AVATAR_MAP[key] ?? null;
}

