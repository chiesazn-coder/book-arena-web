import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "BOOK ARENA",
    template: "%s · BOOK ARENA",
  },
  description: "Balancia Book Arena Leaderboard",
  icons: {
    icon: "/icons_1.png",
  },
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
