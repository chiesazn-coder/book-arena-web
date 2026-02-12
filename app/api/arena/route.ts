// app/api/arena/route.ts
import Papa from "papaparse";
import type { ParseResult } from "papaparse";

export const dynamic = "force-dynamic";

/**
 * CSV dari tab ARENA_WEEKLY (GA)
 * Kolom yang diharapkan:
 * employee_name, submitted, pages_added, finish_bonus, streak_bonus,
 * weekly_score, rank, books_finished_week, finished_total
 */
type ArenaWeeklyRow = {
  employee_name?: string;
  submitted?: string; // TRUE/FALSE (kadang kebaca string)
  pages_added?: string;
  finish_bonus?: string;
  streak_bonus?: string;
  weekly_score?: string;
  rank?: string;

  books_finished_week?: string;
  finished_total?: string;
};

type EmployeeRow = {
  employee_name?: string;
  active?: string; // TRUE/FALSE, bisa kebaca string
};

function toInt(x: unknown): number {
  const s = String(x ?? "")
    .trim()
    .replace(",", ".")
    .replace(/[^\d.\-]/g, ""); // buang simbol lain
  const n = Number(s);
  return Number.isFinite(n) ? Math.floor(n) : 0;
}

function isTrueLike(v: unknown): boolean {
  const s = String(v ?? "").trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes" || s === "y" || s === "iya";
}

async function fetchCsv<T>(url: string): Promise<T[]> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch CSV: ${url}`);
  const text = await res.text();

  const parsed: ParseResult<T> = Papa.parse<T>(text, {
    header: true,
    skipEmptyLines: true,
  });

  return (parsed.data ?? []).filter(Boolean);
}

export async function GET(req: Request) {
  const responsesUrl = process.env.SHEET_CSV_URL; // <-- ARENA_WEEKLY CSV
  const employeesUrl = process.env.EMPLOYEES_CSV_URL;

  if (!responsesUrl) {
    return Response.json({ error: "SHEET_CSV_URL not set" }, { status: 500 });
  }
  if (!employeesUrl) {
    return Response.json({ error: "EMPLOYEES_CSV_URL not set" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const weekParam = (searchParams.get("week") || "").trim();
  const effectiveWeek = weekParam || "CURRENT";

  // 1) Fetch ARENA_WEEKLY
  const rowsAll = await fetchCsv<ArenaWeeklyRow>(responsesUrl);

  // 2) Leaderboard: only submitted TRUE
  const submittedRows = rowsAll
    .map((r) => ({
      name: String(r.employee_name ?? "").trim(),
      submitted: isTrueLike(r.submitted),
      pagesAdded: toInt(r.pages_added),
      finishBonus: toInt(r.finish_bonus),
      streakBonus: toInt(r.streak_bonus),
      weeklyScore: toInt(r.weekly_score),
      booksFinishedWeek: toInt(r.books_finished_week),
      finishedTotal: toInt(r.finished_total),
      sheetRank: toInt(r.rank),
    }))
    .filter((r) => r.name);

  const playersRaw = submittedRows.filter((r) => r.submitted);

  // Sorting:
  // - Utama: weeklyScore (yang kamu sudah set bobot books_finished_week besar di sheet)
  // - Tie-break tambahan: booksFinishedWeek, pagesAdded, lalu nama
  playersRaw.sort(
    (a, b) =>
      b.weeklyScore - a.weeklyScore ||
      b.booksFinishedWeek - a.booksFinishedWeek ||
      b.pagesAdded - a.pagesAdded ||
      a.name.localeCompare(b.name)
  );

  const ranked = playersRaw.map((p, i) => ({
    rank: i + 1,
    name: p.name,
    weeklyScore: p.weeklyScore,

    // pages sekarang berarti pages_added (tie-break)
    pages: p.pagesAdded,
    totalPages: 0,

    // info utama kompetisi
    booksFinishedWeek: p.booksFinishedWeek,
    finishedTotal: p.finishedTotal,

    finishBonus: p.finishBonus,
    streakBonus: p.streakBonus,

    // optional debug
    sheetRank: p.sheetRank || null,

    week: effectiveWeek,
  }));

  // 3) Missed list (ambil dari Employees aktif)
  const employees = await fetchCsv<EmployeeRow>(employeesUrl);
  const activeEmployees = employees
    .map((e) => ({
      name: String(e.employee_name ?? "").trim(),
      active: isTrueLike(e.active),
    }))
    .filter((e) => e.name && e.active)
    .map((e) => e.name);

  const submittedSet = new Set(ranked.map((p) => p.name));
  const missed = activeEmployees
    .filter((name) => !submittedSet.has(name))
    .sort((a, b) => a.localeCompare(b));

  // 4) “latestFinish” tidak bisa dihitung dari ARENA_WEEKLY karena tidak ada timestamp submit.
  // Kamu bisa ganti jadi “newFinishers” berdasarkan booksFinishedWeek > 0.
  const newFinishers = ranked
    .filter((p) => (p.booksFinishedWeek ?? 0) > 0)
    .map((p) => p.name);

  return Response.json({
    week: effectiveWeek,
    updatedAt: new Date().toISOString(),
    totals: {
      totalEmployees: activeEmployees.length,
      submitted: ranked.length,
      missed: missed.length,
    },
    leaderboard: ranked,
    missed,

    // info tambahan (opsional)
    newFinishers,
  });
}
