import Papa from "papaparse";
import type { ParseResult } from "papaparse";

export const dynamic = "force-dynamic";

type Row = {
  Timestamp?: string;
  Nama?: string;
  "Judul Buku yang Sedang Dibaca"?: string;
  "Progres Terakhir (Angka Halaman)"?: string;
  "Status Buku"?: string;
  "Total Halaman Buku"?: string;
  Week_ID?: string;
};

type EmployeeRow = {
  employee_name?: string;
  active?: string; // TRUE/FALSE (bisa kebaca string)
};

function toInt(x: unknown): number {
  const n = Number(String(x ?? "").trim());
  return Number.isFinite(n) ? Math.floor(n) : 0;
}

function isTrueLike(v: unknown): boolean {
  const s = String(v ?? "").trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes";
}

async function fetchCsv<T>(url: string): Promise<T[]> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch CSV: ${url}`);
  const text = await res.text();
  const parsed: ParseResult<T> = Papa.parse<T>(text, { header: true, skipEmptyLines: true });
  return (parsed.data ?? []).filter(Boolean);
}

export async function GET(req: Request) {
  const responsesUrl = process.env.SHEET_CSV_URL;
  const employeesUrl = process.env.EMPLOYEES_CSV_URL;

  if (!responsesUrl) return Response.json({ error: "SHEET_CSV_URL not set" }, { status: 500 });
  if (!employeesUrl) return Response.json({ error: "EMPLOYEES_CSV_URL not set" }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const week = searchParams.get("week") || "";

  const rows = (await fetchCsv<Row>(responsesUrl)).filter((r) => Boolean(r.Nama && String(r.Nama).trim()));

  // Tentukan minggu aktif
  let effectiveWeek = week;
  if (!effectiveWeek) {
    const weeks = rows.map((r) => (r.Week_ID || "").trim()).filter(Boolean);
    effectiveWeek = weeks.sort().at(-1) || "";
  }

  const rowsThisWeek = effectiveWeek
    ? rows.filter((r) => (r.Week_ID || "").trim() === effectiveWeek)
    : rows;

  // Latest submission per nama (kalau submit lebih dari sekali)
  const latestByName = new Map<string, Row>();
  for (const r of rowsThisWeek) {
    const name = (r.Nama || "").trim();
    const ts = new Date(String(r.Timestamp || "")).getTime() || 0;
    const prev = latestByName.get(name);
    const prevTs = prev ? new Date(String(prev.Timestamp || "")).getTime() || 0 : -1;
    if (!prev || ts >= prevTs) latestByName.set(name, r);
  }

  // Leaderboard
  const players = Array.from(latestByName.entries()).map(([name, r]) => {
    const pages = toInt(r["Progres Terakhir (Angka Halaman)"]);
    const status = (r["Status Buku"] || "").trim();
    const finishBonus = status === "Sudah Selesai" ? 150 : 0;
    const streakBonus = 20; // sementara
    const weeklyScore = pages + finishBonus + streakBonus;

    return {
      name,
      bookTitle: (r["Judul Buku yang Sedang Dibaca"] || "").trim(),
      pages,
      status,
      finishBonus,
      streakBonus,
      weeklyScore,
      timestamp: r.Timestamp || "",
      week: effectiveWeek,
    };
  });

  players.sort((a, b) => b.weeklyScore - a.weeklyScore || a.name.localeCompare(b.name));
  const ranked = players.map((p, i) => ({ ...p, rank: i + 1 }));

  // Missed list (ambil dari Employees aktif)
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

  const latestFinish = ranked
    .filter(p => p.status === "Sudah Selesai")
    .sort((a, b) => {
        const ta = new Date(a.timestamp).getTime() || 0;
        const tb = new Date(b.timestamp).getTime() || 0;
        return tb - ta;
    })[0] || null;


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
    latestFinish, // 👈 TAMBAHKAN INI
    });

}
