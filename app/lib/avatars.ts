export const AVATAR_MAP: Record<string, string> = {
  SURATMI: "/avatars/SURATMI.jpeg",
  "PEBRIANTI PAUDI": "/avatars/PEBRIANTI-PAUDI.jpeg",
  "RENY VIOLETA ASOKAWATY": "/avatars/RENY-VIOLETA-ASOKAWATY.png",
  "NUGROHO WISNU MURTI":"/avatars/NUGROHO-WISNU-MURTI.png",
  "KHOTIBUL UMAMI":"/avatars/KHOTIBUL-UMAMI.png",
  "MUHAMMADSALAM":"/avatars/MUHAMMAD-SALAM.png",
  "MUHAMAD ZAKARIA":"/avatars/MUHAMAD-ZAKARIA.png",
  "AHMAD FAQIH AL FATHIN":"/avatars/AHMAD-FAQIH-AL-FATHIN.png",
  "MUHAMMAD VIKA WAVA":"/avatars/MUHAMMAD-VIKA-WAVA.png",
  "LESTARI UTAMI ALBAB":"/avatars/LESTARI-UTAMI-ALBAB.png",
  "TIESNA VIRGIANA WATI":"/avatars/TIESNA-VIRGIANA-WATI.png",
  "FEBBY AGUNG SETYAWAN":"/avatars/FEBBY-AGUNG-SETYAWAN.png",
  "MAULANA SANJAY PAHLEVI":"/avatars/MAULANA-SANJAY-PAHLEVI.png",
  "SYLVANTO BUDI UTOMO":"/avatars/SYLVANTO-BUDI-UTOMO.png",
  "DIXY DHYANTI PRILLYANING SARASWATI":"/avatars/DIXY-DHYANTI-PRILLYANING-SARASWATI.png",
  "AFNI TIANA ROSA":"/avatars/AFNI-TIANA-ROSA.png",

};

export function getAvatarUrl(name: string) {
  const key = name.trim().toUpperCase();
  return AVATAR_MAP[key] ?? null;
}
