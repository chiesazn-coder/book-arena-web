"use client";

import { useEffect, useState } from "react";
import { getAvatarUrl } from "./lib/avatars";

type Player = {
  rank: number;
  name: string;
  weeklyScore: number;

  pagesAdded?: number;
  finishBonus?: number;
  streakBonus?: number;
  status?: "Masih Dibaca" | "Sudah Selesai";
};

type ArenaResponse = {
  week: string;
  updatedAt: string;
  leaderboard: Player[];
  missed: string[];
  totals?: { totalEmployees: number; submitted: number; missed: number };
  latestFinish?: { name: string; bookTitle: string } | null;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.[0] ?? "";
  const b = parts[1]?.[0] ?? "";
  return (a + b).toUpperCase();
}

function medalColor(rank: number) {
  if (rank === 1) return "bg-emerald-200";
  if (rank === 2) return "bg-emerald-200/90";
  return "bg-emerald-200/80";
}

function Crown({ variant }: { variant: "gold" | "pink" }) {
  const fill = variant === "gold" ? "#F59E0B" : "#EC4899";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill={fill}
        d="M3 7l4 4 5-7 5 7 4-4v12H3V7zm2 10h14v-6.2l-2.5 2.5-4.5-6.3-4.5 6.3L5 10.8V17z"
      />
    </svg>
  );
}

function Avatar({
  name,
  size = 56,
  ringClassName = "ring-2 ring-white",
}: {
  name: string;
  size?: number;
  ringClassName?: string;
}) {
  const url = getAvatarUrl(name);

  return (
    <div
      className={[
        "rounded-full bg-white shadow overflow-hidden flex items-center justify-center",
        ringClassName,
      ].join(" ")}
      style={{ width: size, height: size }}
      title={name}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className="text-sm font-semibold">{initials(name)}</div>
      )}
    </div>
  );
}

export default function LeaderboardDisplay() {
  const [data, setData] = useState<ArenaResponse | null>(null);

  useEffect(() => {
    let ok = true;

    async function load() {
      try {
        const res = await fetch("/api/arena", { cache: "no-store" });
        const json = (await res.json()) as ArenaResponse;
        if (ok) setData(json);
      } catch (e) {
        console.error(e);
      }
    }

    load();
    const t = setInterval(load, 15000);
    return () => {
      ok = false;
      clearInterval(t);
    };
  }, []);

  if (!data) {
    return (
      <main className="min-h-screen bg-[#F7F1E6] flex items-center justify-center text-slate-500">
        Loading BOOK ARENA…
      </main>
    );
  }

  const leaderboard = data.leaderboard ?? [];
  const top3 = leaderboard.slice(0, 3);

  const top1 = top3[0];
  const top2 = top3[1];
  const top3p = top3[2];

  return (
    <main className="min-h-screen bg-[#F7F1E6] text-slate-900">
      <div className="mx-auto max-w-md px-4 pt-6 pb-10">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-white/70 ring-1 ring-black/5 flex items-center justify-center">
            🏁
          </div>

          <div className="flex-1">
            <div className="text-lg font-semibold">BALANCIA BOOK ARENA</div>
            <div className="text-xs text-slate-500">
              {data.week} · Auto refresh 15s
            </div>
          </div>

          {data.totals && (
            <div className="text-right">
              <div className="text-[11px] text-slate-500">Submitted</div>
              <div className="text-sm font-semibold">
                {data.totals.submitted}/{data.totals.totalEmployees}
              </div>
            </div>
          )}
        </div>

        {/* Finish alert (optional dramatis) */}
        {data.latestFinish && (
          <div className="mt-4 rounded-[22px] bg-emerald-500/15 p-4 ring-1 ring-emerald-500/25">
            <div className="text-xs font-semibold text-emerald-900">
              🎉 FINISH ALERT
            </div>
            <div className="mt-1 text-sm">
              <span className="font-semibold">{data.latestFinish.name}</span>{" "}
              finished
            </div>
            <div className="text-[11px] text-emerald-900/70 line-clamp-1">
              “{data.latestFinish.bookTitle}”
            </div>
          </div>
        )}

        {/* Podium */}
        <div className="mt-6 rounded-[28px] bg-white/70 ring-1 ring-black/5 p-4">
          <div className="grid grid-cols-3 items-end gap-3">
            {/* #3 */}
            <div className="flex flex-col items-center">
              <Avatar
                name={top3p?.name ?? "—"}
                size={56}
                ringClassName="ring-2 ring-white"
              />
              <div className="mt-2 text-[11px] font-semibold text-center leading-tight line-clamp-2">
                {top3p?.name ?? "—"}
              </div>
              <div className="text-[10px] text-slate-500">
                {top3p?.weeklyScore ?? 0} pts
              </div>
              <div
                className={[
                  "mt-2 w-20 rounded-2xl h-20 flex items-end justify-center pb-2 shadow-sm",
                  medalColor(3),
                ].join(" ")}
              >
                <div className="text-xl font-semibold text-slate-700">3</div>
              </div>
            </div>

            {/* #2 */}
            <div className="flex flex-col items-center">
              <Avatar
                name={top2?.name ?? "—"}
                size={56}
                ringClassName="ring-2 ring-white"
              />
              <div className="mt-2 text-[11px] font-semibold text-center leading-tight line-clamp-2">
                {top2?.name ?? "—"}
              </div>
              <div className="text-[10px] text-slate-500">
                {top2?.weeklyScore ?? 0} pts
              </div>
              <div
                className={[
                  "mt-2 w-20 rounded-2xl h-28 flex items-end justify-center pb-2 shadow-sm",
                  medalColor(2),
                ].join(" ")}
              >
                <div className="text-xl font-semibold text-slate-700">2</div>
              </div>
            </div>

            {/* #1 */}
            <div className="flex flex-col items-center">
              <Avatar
                name={top1?.name ?? "—"}
                size={64}
                ringClassName="ring-2 ring-white"
              />
              <div className="mt-2 text-[11px] font-semibold text-center leading-tight line-clamp-2">
                {top1?.name ?? "—"}
              </div>
              <div className="text-[10px] text-slate-500">
                {top1?.weeklyScore ?? 0} pts
              </div>
              <div
                className={[
                  "mt-2 w-20 rounded-2xl h-36 flex items-end justify-center pb-2 shadow-sm",
                  medalColor(1),
                ].join(" ")}
              >
                <div className="text-xl font-semibold text-slate-700">1</div>
              </div>
            </div>
          </div>
        </div>

        {/* Ranking list */}
        <div className="mt-5 rounded-[28px] bg-white/70 ring-1 ring-black/5 p-3">
          {leaderboard.slice(3).map((p) => (
            <div
              key={p.name}
              className="flex items-center gap-3 rounded-2xl px-3 py-3 hover:bg-white/60"
            >
              <div className="w-10 text-center text-sm font-semibold text-slate-500">
                {String(p.rank).padStart(2, "0")}
              </div>

              <Avatar name={p.name} size={44} ringClassName="ring-1 ring-black/5" />

              <div className="flex-1">
                <div className="text-sm font-semibold leading-tight">{p.name}</div>
                <div className="text-[11px] text-slate-500">
                  {p.weeklyScore} points
                  {typeof p.pagesAdded === "number" ? ` · Pages ${p.pagesAdded}` : ""}
                  {(p.finishBonus ?? 0) > 0 ? " · FINISH" : ""}
                </div>
              </div>

              <div className="w-8 flex justify-end">
                <Crown variant={p.rank <= 7 ? "pink" : "gold"} />
              </div>
            </div>
          ))}

          {leaderboard.length <= 3 && (
            <div className="px-3 py-4 text-sm text-slate-500">
              Menunggu peserta lain submit…
            </div>
          )}
        </div>

        {/* Missed */}
        {data.missed?.length > 0 && (
          <div className="mt-4 rounded-[24px] bg-white/70 ring-1 ring-black/5 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-800">
                Belum Check-in
              </div>
              <div className="text-xs text-slate-500">{data.missed.length} missed</div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {data.missed.map((n) => (
                <span
                  key={n}
                  className="rounded-full bg-red-500/15 px-3 py-1 text-xs text-red-700 ring-1 ring-red-500/25"
                >
                  {n}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 text-center text-[11px] text-slate-500">
          Last update: {new Date(data.updatedAt).toLocaleTimeString()}
        </div>
      </div>
    </main>
  );
}
