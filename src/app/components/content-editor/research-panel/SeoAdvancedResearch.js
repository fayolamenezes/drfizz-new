"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Sparkles, Plus, MoreHorizontal, Copy as CopyIcon } from "lucide-react";

/* ===============================
   UI atoms (theme-aware)
================================ */
function Chip({ children }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-white px-2 py-0.5 text-[11px] text-[var(--text-primary)] transition-colors">
      {children}
    </span>
  );
}

function HBadge({ level = "H1" }) {
  const color =
    level === "H1"
      ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700"
      : level === "H2"
      ? "bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-700"
      : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700";
  return (
    <span
      className={`grid h-7 w-7 place-items-center rounded-md border text-[11px] font-semibold ${color} transition-colors`}
      title={level}
    >
      {String(level).replace("H", "")}
    </span>
  );
}

function RowIconButton({ children, title }) {
  return (
    <button
      type="button"
      title={title}
      className="grid h-7 w-7 place-items-center rounded-md border border-[var(--border)] bg-white text-[var(--text-primary)] hover:bg-gray-50 transition-colors"
    >
      {children}
    </button>
  );
}

/* Updated: hover-only, slim wireframe Copy icon */
function IconHintButton({ onClick, label = "Paste to editor", size = 18, className = "" }) {
  return (
    <div
      className={`relative opacity-0 pointer-events-none transition-opacity duration-150 group-hover:opacity-100 group-hover:pointer-events-auto ${className}`}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(e);
        }}
        aria-label={label}
        className="p-0 m-0 inline-flex items-center justify-center leading-none align-middle focus:outline-none h-8 w-8"
      >
        <CopyIcon size={size} strokeWidth={1.5} className="text-gray-500 hover:text-gray-600 transition-colors" />
      </button>

      <span
        className="pointer-events-none absolute -top-7 right-0 rounded-md border border-[var(--border)] bg-white px-2 py-0.5 text-[10px] font-medium text-gray-700 shadow-sm opacity-0 transition-opacity duration-75 whitespace-nowrap
                   group-hover:opacity-100 group-focus-within:opacity-100
                   dark:bg-[var(--bg-panel)] dark:text-[var(--text-primary)]"
      >
        {label}
      </span>
    </div>
  );
}

/* ===============================
   Outline Row
================================ */
function OutlineRow({ level = "H2", title, onPaste, onAddInstruction }) {
  const indent =
    level === "H1" ? "pl-2" :
    level === "H2" ? "pl-6" :
    "pl-10"; // H3

  return (
    <div className="rounded-xl border border-[var(--border)] bg-white hover:bg-gray-50 transition-colors">
      <div className={`group flex items-center justify-between gap-3 px-3 py-2.5 ${indent}`}>
        <div className="flex min-w-0 items-center gap-3">
          <HBadge level={level} />
          <div className="min-w-0">
            <div className="truncate text-[13px] font-medium text-[var(--text-primary)]">
              {title}
            </div>
            <button
              type="button"
              onClick={onAddInstruction}
              className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-[var(--muted)] hover:underline"
            >
              + Add Instruction
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <IconHintButton onClick={onPaste} />
          <RowIconButton title="More">
            <MoreHorizontal size={14} className="text-[var(--muted)]" />
          </RowIconButton>
        </div>
      </div>
    </div>
  );
}

/* ===============================
   Small UI helpers for Competitors/Heatmaps
================================ */
function Stat({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white p-3">
      <div className="text-[10px] uppercase tracking-wide text-[var(--muted)]">{label}</div>
      <div className="mt-1 text-[18px] font-semibold text-[var(--text-primary)]">{value}</div>
      {sub ? <div className="text-[11px] text-[var(--muted)]">{sub}</div> : null}
    </div>
  );
}

function SimpleTable({ columns = [], rows = [] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
      <table className="min-w-full text-left text-[12px]">
        <thead className="bg-white text-[var(--muted)]">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="px-3 py-2 font-semibold">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {rows.length === 0 ? (
            <tr><td className="px-3 py-3 text-[var(--muted)]" colSpan={columns.length}>No data.</td></tr>
          ) : rows.map((r, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              {columns.map((c) => (
                <td key={c.key} className="px-3 py-2">
                  {typeof c.render === "function" ? c.render(r[c.key], r) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Sticky section label used inside scrollable Heatmaps pane
function SectionLabel({ children }) {
  return (
    <div className="sticky top-0 z-10 bg-white/90 backdrop-blur px-1 py-1 border-b border-[var(--border)] text-[12px] font-semibold text-[var(--text-primary)]">
      {children}
    </div>
  );
}

/* ===============================
   Helpers
================================ */
function normalizePages(json) {
  if (!json) return [];
  if (Array.isArray(json)) return json;
  if (Array.isArray(json.pages)) return json.pages;
  return [json];
}

// Normalize to bare host (no protocol, lowercased, no leading www.)
function toHost(input = "") {
  try {
    const str = String(input).trim();
    if (!str) return "";
    const withProto = /^https?:\/\//i.test(str) ? str : `https://${str}`;
    const u = new URL(withProto);
    return u.hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return String(input).replace(/^www\./i, "").toLowerCase();
  }
}

// Try to parse H1/H2/H3 from HTML (rare fallback only)
function extractHeadingsFromHTML(html) {
  try {
    if (!html || typeof window === "undefined") return [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const order = ["H1", "H2", "H3"];
    const out = [];
    order.forEach((tag) => {
      doc.querySelectorAll(tag.toLowerCase()).forEach((node) => {
        const text = (node.textContent || "").trim();
        if (text) out.push({ level: tag, title: text });
      });
    });
    return out;
  } catch {
    return [];
  }
}

// Safely get a page's domain host from multiple possible locations
function pageHost(p) {
  return toHost(
    p?.domain ||
      p?.details?.meta?.domain ||
      p?.meta?.domain ||
      ""
  );
}

/* ===============================
   Component
================================ */
export default function SeoAdvancedResearch({
  editorContent,
  onPasteToEditor,
  /** If provided, we scope strictly to this domain/URL */
  domain,
  /** Visual height for the outline/heatmaps list */
  maxListHeight = "30rem",
}) {
  const [tab, setTab] = useState("outline"); // outline | competitors | heatmaps
  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch JSON once (with abort safety)
  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/data/contenteditor.json", {
          cache: "no-store",
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setRaw(data);
        setError("");
      } catch (e) {
        if (e.name !== "AbortError") {
          setError(e?.message || "Failed to load contenteditor.json");
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, []);

  // Derive the ACTIVE host
  const activeHost = useMemo(() => {
    const arr = normalizePages(raw);
    if (!arr.length) return "";

    if (domain) return toHost(domain);

    // Try the saved editor query from localStorage
    let savedQuery = "";
    try {
      const rawLS = typeof window !== "undefined" ? localStorage.getItem("content-editor-state") : null;
      if (rawLS) {
        const saved = JSON.parse(rawLS);
        savedQuery = String(saved?.query || "").toLowerCase().trim();
      }
    } catch {}

    if (savedQuery) {
      const hit = arr.find((p) => {
        const q = (p?.ui?.query || p?.primaryKeyword || "").toLowerCase().trim();
        return q && q === savedQuery;
      });
      if (hit) return pageHost(hit);
    }

    const hosts = Array.from(new Set(arr.map(pageHost).filter(Boolean)));
    if (hosts.length === 1) return hosts[0];
    return "";
  }, [raw, domain]);

  // Filter pages for the active host (strict match)
  const pages = useMemo(() => {
    const arr = normalizePages(raw);
    if (!arr.length || !activeHost) return [];
    return arr.filter((p) => pageHost(p) === activeHost);
  }, [raw, activeHost]);

  /* ===============================
     Outline data
  ================================ */
  const outline = useMemo(() => {
    const seen = new Set();
    const out = [];
    const push = (level, title) => {
      const key = `${level}|${title}`.toLowerCase();
      if (title && !seen.has(key)) {
        seen.add(key);
        out.push({ level: level || "H2", title });
      }
    };
    for (const page of pages) {
      const heads = Array.isArray(page?.headings) ? page.headings : null;
      if (heads && heads.length) {
        heads.forEach((h) => push(h.level || "H2", h.title || ""));
      }
    }
    if (out.length) return out;
    const fromEditor = extractHeadingsFromHTML(editorContent);
    fromEditor.forEach((h) => push(h.level, h.title));
    return out;
  }, [pages, editorContent]);

  /* ===============================
     Competitors data
  ================================ */
  const competitors = useMemo(() => {
    const all = [];
    for (const p of pages) {
      const doms = p?.competitorsTab?.domains;
      if (Array.isArray(doms)) {
        doms.forEach((d) => {
          if (!d?.domain) return;
          all.push({
            domain: d.domain,
            authority: d.authority ?? null,
            estimatedTrafficK: d.estimatedTrafficK ?? null,
            commonKeywords: d.commonKeywords ?? null,
            sampleUrls: Array.isArray(d.sampleUrls) ? d.sampleUrls : [],
          });
        });
      }
    }
    const seen = new Set();
    const deduped = [];
    for (const row of all) {
      if (seen.has(row.domain)) continue;
      seen.add(row.domain);
      deduped.push(row);
    }
    return deduped;
  }, [pages]);

  /* ===============================
     Heatmaps data
  ================================ */
  const heatmaps = useMemo(() => {
    const out = {
      headingsFrequency: [],
      termHeat: [],
      serpFeatureCoverage: [],
      headingSerpMatrix: [],
    };
    const pushAll = (arr, key) => {
      if (Array.isArray(arr)) out[key].push(...arr);
    };
    for (const p of pages) {
      const h = p?.heatmapsTab;
      if (!h) continue;
      pushAll(h.headingsFrequency, "headingsFrequency");
      pushAll(h.termHeat, "termHeat");
      pushAll(h.serpFeatureCoverage, "serpFeatureCoverage");
      pushAll(h.headingSerpMatrix, "headingSerpMatrix");
    }
    return out;
  }, [pages]);

  const outlineCount = outline.length;

  /* ===============================
     Render
  ================================ */
  return (
    <div className="mt-1 rounded-2xl border border-[var(--border)] bg-white p-3 transition-colors">
      <div className="flex items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-[var(--border)] px-1 transition-colors">
          <button
            onClick={() => setTab("outline")}
            className={`px-2 pb-2 text-[12px] font-semibold transition-all ${
              tab === "outline"
                ? "text-[var(--text-primary)] border-b-2 border-amber-400"
                : "text-[var(--muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            Outline
          </button>
          <button
            onClick={() => setTab("competitors")}
            className={`px-2 pb-2 text-[12px] font-semibold transition-all ${
              tab === "competitors"
                ? "text-[var(--text-primary)] border-b-2 border-amber-400"
                : "text-[var(--muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            Competitor’s
          </button>
          <button
            onClick={() => setTab("heatmaps")}
            className={`px-2 pb-2 text-[12px] font-semibold transition-all ${
              tab === "heatmaps"
                ? "text-[var(--text-primary)] border-b-2 border-amber-400"
                : "text-[var(--muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            Heatmap’s
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Chip>{outlineCount} Headings</Chip>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-white px-2.5 py-1.5 text-[12px] font-medium text-[var(--text-primary)] hover:bg-gray-50 transition-colors"
            onClick={() => {}}
          >
            <Sparkles size={14} /> All Headings
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-md border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1.5 text-[12px] font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
            onClick={() => {}}
          >
            <Plus size={14} /> Generate article
          </button>
        </div>
      </div>

      {/* Outline */}
      {tab === "outline" && (
        <div className="mt-3 overflow-y-auto pr-1" style={{ maxHeight: maxListHeight }}>
          {loading ? (
            <div className="grid place-items-center rounded-xl border border-dashed border-[var(--border)] py-10 text-[var(--muted)] text-[12px]">
              Loading outline…
            </div>
          ) : error ? (
            <div className="grid place-items-center rounded-xl border border-dashed border-[var(--border)] py-10 text-[var(--muted)] text-[12px]">
              {error}
            </div>
          ) : outlineCount === 0 ? (
            <div className="grid place-items-center rounded-xl border border-dashed border-[var(--border)] py-10 text-[var(--muted)] text-[12px]">
              No headings found for this domain.
            </div>
          ) : (
            <div className="space-y-2">
              {outline.map((h, i) => (
                <OutlineRow
                  key={`${h.level}-${i}-${h.title}`}
                  level={h.level}
                  title={h.title}
                  onPaste={() => onPasteToEditor?.(h.title)}
                  onAddInstruction={() => onPasteToEditor?.(`Add instruction for: ${h.title}`)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Competitors */}
      {tab === "competitors" && (
        <div className="mt-3 space-y-3">
          {loading ? (
            <div className="grid place-items-center rounded-xl border border-dashed border-[var(--border)] py-10 text-[var(--muted)] text-[12px]">
              Loading competitors…
            </div>
          ) : error ? (
            <div className="grid place-items-center rounded-xl border border-dashed border-[var(--border)] py-10 text-[var(--muted)] text-[12px]">
              {error}
            </div>
          ) : competitors.length === 0 ? (
            <div className="grid place-items-center rounded-xl border border-dashed border-[var(--border)] py-10 text-[var(--muted)] text-[12px]">
              No competitor data in JSON for this domain.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Stat label="Competitors" value={competitors.length} />
                <Stat
                  label="Avg. Authority"
                  value={
                    Math.round(
                      (competitors.reduce((s, c) => s + (Number(c.authority) || 0), 0) / competitors.length) || 0
                    )
                  }
                />
                <Stat
                  label="Avg. Est. Traffic (K)"
                  value={
                    Math.round(
                      (competitors.reduce((s, c) => s + (Number(c.estimatedTrafficK) || 0), 0) / competitors.length) || 0
                    )
                  }
                />
                <Stat
                  label="Avg. Common Keywords"
                  value={
                    Math.round(
                      (competitors.reduce((s, c) => s + (Number(c.commonKeywords) || 0), 0) / competitors.length) || 0
                    )
                  }
                />
              </div>

              <SimpleTable
                columns={[
                  { key: "domain", label: "Domain" },
                  { key: "authority", label: "Authority" },
                  { key: "estimatedTrafficK", label: "Est. Traffic (K)" },
                  { key: "commonKeywords", label: "Common Keywords" },
                  {
                    key: "sampleUrls",
                    label: "Sample URLs",
                    render: (val) => (
                      <div className="flex flex-wrap gap-2">
                        {(val || []).slice(0, 3).map((u, idx) => (
                          <a
                            key={idx}
                            href={u}
                            target="_blank"
                            rel="noreferrer"
                            className="truncate max-w-[16rem] text-[11px] underline text-[var(--text-primary)]"
                            title={u}
                          >
                            {u}
                          </a>
                        ))}
                      </div>
                    ),
                  },
                ]}
                rows={competitors}
              />
            </>
          )}
        </div>
      )}

      {/* Heatmaps (now fixed-height scroll area) */}
      {tab === "heatmaps" && (
        <div className="mt-3 overflow-y-auto pr-1 space-y-4" style={{ maxHeight: maxListHeight }}>
          {loading ? (
            <div className="grid place-items-center rounded-xl border border-dashed border-[var(--border)] py-10 text-[var(--muted)] text-[12px]">
              Loading heatmaps…
            </div>
          ) : error ? (
            <div className="grid place-items-center rounded-xl border border-dashed border-[var(--border)] py-10 text-[var(--muted)] text-[12px]">
              {error}
            </div>
          ) : (
            <>
              {/* Headings Frequency */}
              <div className="space-y-2">
                <SectionLabel>Headings Frequency</SectionLabel>
                <SimpleTable
                  columns={[
                    { key: "heading", label: "Heading" },
                    { key: "count", label: "Count" },
                  ]}
                  rows={heatmaps.headingsFrequency || []}
                />
              </div>

              {/* Term Heat */}
              <div className="space-y-2">
                <SectionLabel>Term Heat</SectionLabel>
                <SimpleTable
                  columns={[
                    { key: "term", label: "Term" },
                    { key: "score", label: "Score" },
                  ]}
                  rows={heatmaps.termHeat || []}
                />
              </div>

              {/* SERP Feature Coverage */}
              <div className="space-y-2">
                <SectionLabel>SERP Feature Coverage</SectionLabel>
                <SimpleTable
                  columns={[
                    { key: "feature", label: "Feature" },
                    {
                      key: "presence",
                      label: "Present",
                      render: (v) => (
                        <span className={`px-2 py-0.5 rounded-md border ${v ? "border-emerald-300 text-emerald-700 bg-emerald-50" : "border-gray-300 text-gray-600 bg-gray-50"}`}>
                          {v ? "Yes" : "No"}
                        </span>
                      ),
                    },
                    { key: "count", label: "Count" },
                  ]}
                  rows={heatmaps.serpFeatureCoverage || []}
                />
              </div>

              {/* Heading ↔ SERP Matrix */}
              <div className="space-y-2">
                <SectionLabel>Heading ↔ SERP Matrix</SectionLabel>
                <SimpleTable
                  columns={[
                    { key: "heading", label: "Heading" },
                    { key: "serpMentions", label: "SERP Mentions" },
                    { key: "avgPosition", label: "Avg. Position" },
                  ]}
                  rows={heatmaps.headingSerpMatrix || []}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
