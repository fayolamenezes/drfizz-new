"use client";

import React, { useMemo, useState } from "react";
import { ArrowUpRight, ArrowDownRight, ChevronRight, X, Search as SearchIcon, Copy as CopyIcon } from "lucide-react";

function IconHintButton({ onClick, label = "Paste to editor", size = 18, className = "" }) {
  return (
    <div
      className={[
        "relative",
        // Hidden by default; shown when the parent row (with class 'group') is hovered/focused
        "opacity-0 pointer-events-none transition-opacity duration-150",
        "group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100",
        className,
      ].join(" ")}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(e);
        }}
        aria-label={label}
        // No background, no border — just the wireframe icon
        className="p-0 m-0 inline-flex items-center justify-center leading-none align-middle focus:outline-none h-8 w-8"
      >
        <CopyIcon size={size} strokeWidth={1.25} className="text-gray-500 opacity-90 hover:text-gray-600 transition-colors" />
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

function KPI({ label, value, delta, up }) {
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  const tone = up ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400";
  return (
    <div className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2
                    dark:border-[var(--border)] dark:bg-[var(--bg-panel)]">
      <div className="text-[10px] text-gray-500 dark:text-[var(--muted)]">{label}</div>
      <div className="mt-1 flex items-center gap-2">
        <div className="text-[16px] font-semibold text-gray-900 dark:text-[var(--text-primary)]">{value}</div>
        <span className={`inline-flex items-center gap-0.5 text-[10px] ${tone}`}>
          <Icon size={13} />
          {delta}
        </span>
      </div>
    </div>
  );
}

function FilterBar({ kw, onKw, tail, onTail, status, onStatus }) {
  return (
    <div className="mt-3 flex items-center gap-2">
      <div className="relative flex-1">
        <input
          value={kw}
          onChange={(e) => onKw(e.target.value)}
          placeholder="Filter by keywords"
          className="w-full h-9 rounded-lg border border-gray-200 bg-white px-8 text-[12px] text-gray-800 outline-none focus:border-amber-400
                     placeholder-gray-400
                     dark:border-[var(--border)] dark:bg-[var(--bg-panel)] dark:text-[var(--text-primary)] dark:placeholder-[var(--muted)]"
        />
        <SearchIcon size={13} className="absolute left-2.5 top-2.5 text-gray-400 dark:text-[var(--muted)]" />
      </div>
      <select
        value={tail}
        onChange={(e) => onTail(e.target.value)}
        className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-[11px] text-gray-800
                   dark:border-[var(--border)] dark:bg-[var(--bg-panel)] dark:text-[var(--text-primary)]"
      >
        <option>All</option>
        <option>Long tail</option>
        <option>Short tail</option>
        <option>Exact</option>
      </select>
      <select
        value={status}
        onChange={(e) => onStatus(e.target.value)}
        className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-[11px] text-gray-800
                   dark:border-[var(--border)] dark:bg-[var(--bg-panel)] dark:text-[var(--text-primary)]"
      >
        <option>All Status</option>
        <option>Good</option>
        <option>Needs Fix</option>
      </select>
    </div>
  );
}

function ScoreCard({ title, badge, progress, source, tone = "green", onOpen, onPaste }) {
  const toneMap = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/25 dark:text-emerald-300 dark:border-emerald-700/60",
    amber: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/25 dark:text-amber-300 dark:border-amber-700/60",
    gray:  "bg-gray-100 text-gray-700 border-gray-200 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700",
  };
  const barMap = {
    green: "bg-emerald-500 dark:bg-emerald-400",
    amber: "bg-amber-500 dark:bg-amber-400",
    gray:  "bg-gray-300 dark:bg-neutral-600",
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm
                    dark:border-[var(--border)] dark:bg-[var(--bg-panel)]">
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen?.();
          }
        }}
        className="group w-full px-3.5 py-3 flex items-start gap-3 cursor-pointer select-none focus:outline-none
                   hover:bg-gray-50 dark:hover:bg-[var(--bg-hover)]"
      >
        <span className={`text-[10px] px-2 py-0.5 border rounded-full font-semibold ${toneMap[tone]}`}>{badge}</span>

        <div className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-2">
            <div className="text-[13px] font-semibold text-gray-900 dark:text-[var(--text-primary)]">{title}</div>
            <span className="text-[10px] text-gray-500 dark:text-[var(--muted)]">Source: {source}</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100 dark:bg-neutral-800">
            <div className={`h-1.5 rounded-full ${barMap[tone]}`} style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <IconHintButton
            onClick={(e) => {
              e.stopPropagation();
              onPaste?.();
            }}
          />
          <ChevronRight size={18} className="text-gray-400 dark:text-[var(--muted)]" />
        </div>
      </div>
    </div>
  );
}

function DrawerHeader({ title, onClose, countText }) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <div className="text-[13px] font-semibold text-gray-900 dark:text-[var(--text-primary)]">{title}</div>
        {countText ? <div className="text-[11px] text-gray-500 dark:text-[var(--muted)] mt-0.5">{countText}</div> : null}
      </div>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-[var(--muted)] dark:hover:text-[var(--text-primary)]">
        <X size={16} />
      </button>
    </div>
  );
}

function StatTriplet({ mine, avg, results }) {
  return (
    <div className="mt-3 grid grid-cols-3 gap-2">
      {[
        ["MY MENTION", mine],
        ["AVG. MENTIONS", avg],
        ["SEARCH RESULTS", results],
      ].map(([label, value]) => (
        <div
          key={label}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2
                     dark:border-[var(--border)] dark:bg-[var(--bg-panel)]"
        >
          <div className="text-[10px] text-gray-500 dark:text-[var(--muted)]">{label}</div>
          <div className="text-[16px] font-semibold text-gray-900 dark:text-[var(--text-primary)] mt-0.5">{value}</div>
        </div>
      ))}
    </div>
  );
}

function SourceCard({ url, title, snippet }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`rounded-xl border shadow-sm transition-colors ${
        open
          ? "border-amber-200 bg-amber-50 dark:border-amber-700/60 dark:bg-amber-900/20"
          : "border-gray-200 bg-white dark:border-[var(--border)] dark:bg-[var(--bg-panel)]"
      }`}
    >
      <button
        onClick={() => setOpen((s) => !s)}
        className="w-full px-3.5 py-3 text-left rounded-xl hover:bg-gray-50 dark:hover:bg-[var(--bg-hover)]"
      >
        <div className="text-[11px] text-gray-500 dark:text-[var(--muted)] truncate">{url}</div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <div className="text-[13px] font-medium text-gray-900 dark:text-[var(--text-primary)] truncate">{title}</div>
          <ChevronRight
            size={16}
            className={`text-gray-400 dark:text-[var(--muted)] transition-transform ${open ? "rotate-90" : ""}`}
          />
        </div>
      </button>
      {open && (
        <div className="px-3.5 pb-3 -mt-1 text-[12px] text-gray-700 dark:text-[var(--text)]">
          <p className="leading-6">{snippet ?? "…"}</p>
        </div>
      )}
    </div>
  );
}

export default function SeoAdvancedOptimize({ onPasteToEditor }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [kwFilter, setKwFilter] = useState("");
  const [tailType, setTailType] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All Status");

  const cards = useMemo(
    () => [
      { title: "Content Marketing",  badge: "4/3", progress: 92, source: 15, tone: "green", status: "Good",      tail: "Short tail" },
      { title: "Strategies",         badge: "2/4", progress: 58, source: 5,  tone: "amber", status: "Needs Fix", tail: "Long tail" },
      { title: "Link Readability",   badge: "1/3", progress: 35, source: 15, tone: "gray",  status: "Needs Fix", tail: "Exact"     },
      { title: "Title Readability",  badge: "3/3", progress: 90, source: 15, tone: "green", status: "Good",      tail: "Short tail" },
    ],
    []
  );

  const filtered = useMemo(() => {
    const kw = kwFilter.trim().toLowerCase();
    return cards.filter((c) => {
      const kwOk = !kw || c.title.toLowerCase().includes(kw);
      const tailOk = tailType === "All" || c.tail === tailType;
      const statusOk = statusFilter === "All Status" || (c.status || "").toLowerCase() === statusFilter.toLowerCase();
      return kwOk && tailOk && statusOk;
    });
  }, [cards, kwFilter, tailType, statusFilter]);

  return (
    <>
      {!drawerOpen && (
        <>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <KPI label="HEADINGS" value={2} delta={29} up={false} />
            <KPI label="LINKS" value={5} delta={1} up={false} />
            <KPI label="IMAGES" value={3} delta={1} up={true} />
          </div>

          <FilterBar
            kw={kwFilter}
            onKw={setKwFilter}
            tail={tailType}
            onTail={setTailType}
            status={statusFilter}
            onStatus={setStatusFilter}
          />

          <div className="mt-3 space-y-2">
            {filtered.map((c, i) => (
              <ScoreCard
                key={`${c.title}-${i}`}
                title={c.title}
                badge={c.badge}
                progress={c.progress}
                source={c.source}
                tone={c.tone}
                onOpen={() => {
                  setSelectedCard(c);
                  setDrawerOpen(true);
                }}
                onPaste={() => onPasteToEditor?.(c.title)}
              />
            ))}

            {filtered.length === 0 && (
              <div className="text-[12px] text-gray-500 dark:text-[var(--muted)] px-1 py-2">
                No items match the current filters.
              </div>
            )}
          </div>
        </>
      )}

      {drawerOpen && (
        <div
          className="mt-1 rounded-2xl border border-gray-200 bg-white p-3
                     dark:border-[var(--border)] dark:bg-[var(--bg-panel)]"
        >
          <DrawerHeader
            title={selectedCard?.title || "Title Readability"}
            countText="15 Search result mention this topic"
            onClose={() => {
              setDrawerOpen(false);
              setSelectedCard(null);
            }}
          />
          <StatTriplet mine={2} avg={5} results={3} />
          <div className="mt-3 space-y-2">
            <SourceCard url="https://www.greenleafinsights.com" title="How to start a blog in 10 steps: a beginner’s guide" />
            <SourceCard url="https://www.greenleafinsights.com" title="How to Launch a Blog in 10 Easy Steps" />
            <SourceCard url="https://www.greenleafinsights.com" title="Blogging Made Simple" />
            <SourceCard url="https://www.greenleafinsights.com" title="10 Steps to Starting a Blog" />
          </div>
        </div>
      )}
    </>
  );
}
