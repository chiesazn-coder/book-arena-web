"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

type Player = {
  rank: number;
  name: string;
  weeklyScore: number;
};

type ArenaResponse = {
  week: string;
  updatedAt: string;
  leaderboard: Player[];
  missed: string[];
  latestFinish?: {
    name: string;
    bookTitle: string;
  } | null;
};

export default function TVMode() {
  const [data, setData] = useState<ArenaResponse | null>(null);

  // Untuk animasi naik/turun rank
  const [prevRanks, setPrevRanks] = useState<Record<string, number>>({});
  const [deltas, setDeltas] = useState<Record<string, number>>({});

  // Untuk confetti saat Top #1 berubah
  const [prevTop1, setPrevTop1] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        const res = await fetch("/api/arena", { cache: "no-store" });
        const json: ArenaResponse = await res.json();

        if (!mounted) return;

        // Hitung delta rank vs fetch sebelumnya
        const nextLeaderboard = (json.leaderboard ?? []) as Player[];

        setPrevRanks((prev) => {
          const nextRanks: Record<string, number> = {};
          for (const p of nextLeaderboard) nextRanks[p.name] = p.rank;

          const nextDeltas: Record<string, number> = {};
          for (const p of nextLeaderboard) {
            const prevRank = prev[p.name];
            nextDeltas[p.name] = typeof prevRank === "number" ? prevRank - p.rank : 0; // + = naik
          }

          setDeltas(nextDeltas);
          return nextRanks;
        });

        // Confetti kalau Top 1 berubah
        const top1Name = json?.leaderboard?.[0]?.name ?? null;
        setPrevTop1((prev) => {
          if (top1Name && prev && top1Name !== prev) {
            confetti({
              particleCount: 180,
              spread: 70,
              origin: { y: 0.2 },
            });
          }
          return top1Name;
        });

        setData(json);
      } catch (e) {
        console.error(e);
      }
    }

    fetchData();
    const t = setInterval(fetchData, 15000);

    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, []);

  // Guard: biar TS aman + TV mode stabil (no flicker)
  if (!data) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="flex h-screen items-center justify-center text-slate-400">
          Loading BOOK ARENA…
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-8 py-8">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-5xl font-bold tracking-wide">BOOK ARENA</h1>
          <p className="mt-2 text-lg text-slate-300">
            Finish or Fall Behind · {data.week || "-"}
          </p>
        </header>

        {/* Finish Alert */}
        {data.latestFinish && (
          <div className="mb-6 rounded-2xl bg-emerald-500/15 p-6 text-center ring-1 ring-emerald-500/30">
            <div className="text-lg font-semibold">🎉 FINISH ALERT</div>
            <div className="mt-2 text-xl">
              <span className="font-bold">{data.latestFinish.name}</span> finished
            </div>
            <div className="mt-1 text-sm text-emerald-300">
              “{data.latestFinish.bookTitle}”
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          {/* Leaderboard */}
          <section className="rounded-2xl bg-slate-900/60 p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">🏆 TOP 5</h2>

            <AnimatePresence initial={false}>
              {data.leaderboard.slice(0, 5).map((p) => {
                const delta = deltas[p.name] ?? 0;
                const isUp = delta > 0;
                const isDown = delta < 0;

                return (
                  <motion.div
                    key={p.name}
                    layout
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{
                      opacity: 1,
                      y: isUp ? -4 : isDown ? 4 : 0,
                      scale: isUp ? 1.01 : isDown ? 0.995 : 1,
                    }}
                    exit={{ opacity: 0, y: -12, scale: 0.98 }}
                    transition={{ duration: 0.35 }}
                    className={[
                      "mb-3 flex items-center justify-between rounded-xl px-6 py-4",
                      "bg-slate-950/40",
                      isUp
                        ? "ring-1 ring-emerald-400/40 shadow-[0_0_30px_rgba(16,185,129,0.15)]"
                        : "",
                      isDown
                        ? "ring-1 ring-amber-400/40 shadow-[0_0_30px_rgba(245,158,11,0.12)]"
                        : "",
                    ].join(" ")}
                  >
                    {/* Left */}
                    <div className="flex items-center gap-4">
                      <div
                        className={[
                          "flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold",
                          p.rank === 1
                            ? "bg-yellow-500/20 text-yellow-200"
                            : p.rank === 2
                            ? "bg-slate-400/20 text-slate-200"
                            : p.rank === 3
                            ? "bg-amber-700/20 text-amber-200"
                            : "bg-slate-800 text-slate-200",
                        ].join(" ")}
                      >
                        {p.rank}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-lg font-medium">{p.name}</div>

                        {/* Movement chip */}
                        {delta !== 0 && (
                          <div
                            className={[
                              "rounded-full px-3 py-1 text-xs font-semibold",
                              isUp
                                ? "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/30"
                                : "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/30",
                            ].join(" ")}
                          >
                            {isUp ? `▲ +${delta}` : `▼ ${Math.abs(delta)}`}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right (Score) */}
                    <motion.div
                      key={p.weeklyScore}
                      initial={{ scale: 1 }}
                      animate={{ scale: isUp ? 1.04 : 1 }}
                      transition={{ duration: 0.25 }}
                      className="text-2xl font-bold"
                    >
                      {p.weeklyScore}
                    </motion.div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </section>

          {/* Missed List */}
          <section className="rounded-2xl bg-slate-900/60 p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-red-300">
              ❌ BELUM CHECK-IN
            </h2>

            {data.missed.length === 0 ? (
              <div className="text-slate-400">Semua sudah submit 🔥</div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {data.missed.map((name) => (
                  <span
                    key={name}
                    className="rounded-full bg-red-500/20 px-4 py-2 text-sm text-red-200 ring-1 ring-red-500/30"
                  >
                    {name}
                  </span>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-xs text-slate-400">
          Auto refresh · Last update{" "}
          {data.updatedAt ? new Date(data.updatedAt).toLocaleTimeString() : "-"}
        </footer>
      </div>
    </main>
  );
}
