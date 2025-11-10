"use client";

import { useEffect, useState } from "react";
import { Wifi, FileText, Link2, ChevronRight, ThumbsUp, ThumbsDown } from "lucide-react";

/** Small, self-contained thumbs up/down with a tiny bump animation */
function LikeDislike() {
  const [choice, setChoice] = useState(null); // 'up' | 'down' | null
  const [bump, setBump] = useState(null);

  const handleClick = (dir) => {
    setChoice((prev) => (prev === dir ? null : dir));
    setBump(dir);
    setTimeout(() => setBump(null), 150);
  };

  const base = "cursor-pointer transition-transform duration-150";
  return (
    <span className="flex items-center gap-2">
      <ThumbsUp
        size={16}
        strokeWidth={2}
        fill="none"
        className={`${base} ${bump === "up" ? "scale-110" : ""} ${
          choice === "up" ? "text-[#22C55E]" : ""
        }`}
        onClick={() => handleClick("up")}
        aria-label="Thumbs up"
      />
      <ThumbsDown
        size={16}
        strokeWidth={2}
        fill="none"
        className={`${base} ${bump === "down" ? "scale-110" : ""} ${
          choice === "down" ? "text-[#EF4444]" : ""
        }`}
        onClick={() => handleClick("down")}
        aria-label="Thumbs down"
      />
    </span>
  );
}

/** Simple difficulty progress bar (0–100) */
function DifficultyBar({ value, progress = 1 }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const p = Math.max(0, Math.min(1, progress));
  const fill = pct < 40 ? "#EF4444" : pct < 70 ? "#F59E0B" : "#10B981";
  return (
    <div className="relative h-2 w-24 overflow-hidden rounded-full bg-[#E5E7EB]">
      <div
        className="h-2 rounded-full w-0"
        style={{
          width: `${pct * p}%`,
          backgroundColor: fill,
          transition: "none",
        }}
      />
    </div>
  );
}

/**
 * NewOnPageSEOTable
 * Props:
 *  - rows?: Array<{ keyword, type, volume, difficulty, suggested?, preference? }>
 *  - progress?: number (0–1) to sync table animations with the dashboard
 */
export default function NewOnPageSEOTable({ rows, progress = 1 }) {
  // Fallback demo rows (kept from your original)
  const fallback = [
    { keyword: "How to fix slow Wi-Fi", type: "Informational", volume: 7032, difficulty: 98 },
    { keyword: "How to fix slow Wi-Fi", type: "Informational", volume: 7032, difficulty: 88 },
    { keyword: "How to fix slow Wi-Fi", type: "Transactional", volume: 7032, difficulty: 98 },
    { keyword: "How to fix slow Wi-Fi", type: "Informational", volume: 7032, difficulty: 28 },
    { keyword: "How to fix slow Wi-Fi", type: "Transactional", volume: 7032, difficulty: 28 },
    { keyword: "How to fix slow Wi-Fi", type: "Transactional", volume: 7032, difficulty: 68 },
    { keyword: "How to fix slow Wi-Fi", type: "Informational", volume: 7032, difficulty: 48 },
  ];

  const data = (Array.isArray(rows) && rows.length ? rows : fallback).slice(0, 200); // safety cap

  return (
    <section aria-labelledby="new-on-page-seo-opportunity">
      {/* Title + note (kept exactly as your current UI) */}
      <h2
        id="new-on-page-seo-opportunity"
        className="text-[16px] font-bold text-[var(--text)] mb-2 ml-1"
      >
        New on page SEO opportunity
      </h2>
      <p className="ml-1 mb-4 text-[12px] text-[var(--muted)]">
        *While it’s highly recommended to follow the AI’s suggested plan for optimal results,
        feel free to generate content based on your personal choice.
      </p>

      {/* Table */}
      <div className="overflow-hidden rounded-[16px] border border-[var(--border)] bg-[var(--input)] shadow-sm">
        {/* Header */}
        <div className="hidden md:grid grid-cols-[2.1fr_1.4fr_1.2fr_1.5fr_1.3fr_1fr_1fr_1.8fr] items-center px-4 py-3 text-[12px] font-semibold text-[var(--muted)] bg-[var(--input)] text-center">
          <div className="text-left">Keywords</div>
          <div>
            Type <span className="opacity-50">↑↓</span>
          </div>
          <div>Search Volume</div>
          <div>SEO Difficulty</div>
          <div>Suggested topic</div>
          <div>Blog</div>
          <div>Page</div>
          <div>Preference</div>
        </div>

        {/* Rows */}
        <ul className="divide-y divide-[#ECEFF5]">
          {data.map((row, i) => (
            <li
              key={i}
              className="grid grid-cols-1 md:grid-cols-[2.1fr_1.4fr_1.2fr_1.5fr_1.3fr_1fr_1fr_1.8fr] items-center gap-3 px-4 py-3 text-[13px] hover:bg-[var(--input)] text-center"
            >
              {/* Keyword */}
              <div className="flex items-center gap-2 text-[var(--text)] justify-start">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--input)] text-[var(--muted)]">
                  <Wifi size={14} />
                </span>
                <span className="truncate">{row.keyword}</span>
              </div>

              {/* Type */}
              <div>
                <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] px-2 py-0.5 text-[11px] seo-badge-light">
                  {row.type === "Informational" ? <FileText size={12} /> : <Link2 size={12} />}
                  {row.type}
                </span>
              </div>

              {/* Volume */}
              <div className="tabular-nums text-[var(--text)]">
                {Number(row.volume).toLocaleString()}
              </div>

              {/* Difficulty */}
              <div className="flex items-center gap-2 text-[var(--text)] justify-start">
                <span className="tabular-nums">{row.difficulty}%</span>
                <DifficultyBar value={row.difficulty} progress={progress} />
              </div>

              {/* Suggested topic */}
              <div className="text-[var(--text)] truncate text-center">{row.suggested ?? "—"}</div>

              {/* Blog action */}
              <div className="flex justify-center">
                <button className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--input)] px-4 py-1.5 text-[12px] font-semibold text-[#3178C6]">
                  Generate
                </button>
              </div>

              {/* Page action */}
              <div className="flex justify-center">
                <button className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--input)] px-4 py-1.5 text-[12px] font-semibold text-[#3178C6]">
                  Generate
                </button>
              </div>

              {/* Preference + like/dislike */}
              <div className="flex items-center justify-center gap-3 text-[var(--muted)]">
                <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] px-2 py-0.5 text-[11px] seo-badge-light">
                  {row.preference ?? "—"}
                </span>
                <LikeDislike />
              </div>
            </li>
          ))}
        </ul>

        {/* Footer */}
        <div className="flex justify-end border-t border-[var(--border)] bg-[var(--input)] px-4 py-3">
          <button className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--input)] px-3 py-1.5 text-[12px] text-[var(--muted)] hover:bg-[var(--input)]">
            View all page issue <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}
