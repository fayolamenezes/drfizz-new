"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChevronRight, Search as SearchIcon, X } from "lucide-react";

function IconHintButton({ onClick, label = "Paste to editor", size = 12, className = "" }) {
  // NOTE: Use a non-button interactive element to avoid nesting <button> inside <button>
  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.(e);
    }
  };

  return (
    <div className={`relative group ${className}`}>
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={onKeyDown}
        aria-label={label}
        className="grid place-items-center h-8 w-8 rounded-md border border-[var(--border)] bg-white/90 text-gray-700 shadow-sm hover:bg-gray-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400/60
                   dark:bg-[var(--bg-panel)] dark:text-[var(--text-primary)] dark:hover:bg-[var(--bg-hover)]"
      >
        <Image src="/assets/copy.svg" width={size} height={size} alt="Paste" className="opacity-80" />
      </div>
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

function BadgeScore({ score }) {
  const tone =
    score >= 15
      ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/25 dark:text-amber-300 dark:border-amber-700/60"
      : score >= 10
      ? "bg-gray-100 text-gray-700 border-gray-200 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700"
      : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/25 dark:text-emerald-300 dark:border-emerald-700/60";

  return (
    <span className={`inline-flex h-8 min-w-[34px] items-center justify-center rounded-md border px-1.5 text-[12px] font-semibold ${tone}`}>
      {score}
    </span>
  );
}

function LinkRow({ rankScore, domain, sources, onPaste }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white shadow-sm dark:bg-[var(--bg-panel)]">
      <button
        type="button"
        className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left rounded-2xl
                   hover:bg-gray-50 dark:hover:bg-[var(--bg-hover)]"
      >
        <div className="flex min-w-0 items-center gap-3">
          <BadgeScore score={rankScore} />
          <div className="min-w-0">
            <div className="truncate text-[14px] font-semibold text-gray-900 dark:text-[var(--text-primary)]">
              {domain}
            </div>
            <div className="text-[11.5px] text-gray-500 dark:text-[var(--muted)]">
              Source : {sources}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <IconHintButton
            onClick={(e) => {
              e.stopPropagation();
              onPaste?.(domain);
            }}
          />
          <ChevronRight size={18} className="text-gray-400 dark:text-[var(--muted)]" />
        </div>
      </button>
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
      <button
        type="button"
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 dark:text-[var(--muted)] dark:hover:text-[var(--text-primary)]"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export default function SeoAdvancedLinks({ onPasteToEditor, currentPage, cfgLoading, cfgError }) {
  const [kwFilter, setKwFilter] = useState("");
  const [linkTab, setLinkTab] = useState("external");

  const linksData = currentPage?.linksTab || {};
  const externalRows = Array.isArray(linksData.external) ? linksData.external : [];
  const internalRows = Array.isArray(linksData.internal) ? linksData.internal : [];
  const externalTotal = typeof linksData.externalTotal === "number" ? linksData.externalTotal : 786;

  const totalDomains = externalRows.length || 19;

  const rows = (linkTab === "external" ? externalRows : internalRows).map((r) => ({
    rankScore: r.rankScore ?? r.value ?? 0,
    domain: r.domain ?? r.url ?? "",
    sources: r.sources ?? r.source ?? 0,
  }));

  const filtered = rows.filter((r) =>
    r.domain.toLowerCase().includes(kwFilter.trim().toLowerCase())
  );

  return (
    <div
      className="mt-1 rounded-2xl border border-[var(--border)] bg-white p-4
                 dark:bg-[var(--bg-panel)]"
    >
      <div className="flex items-center gap-6 border-b border-[var(--border)] px-1">
        <button
          type="button"
          onClick={() => setLinkTab("external")}
          className={`relative px-1 pb-2 text-[13px] font-semibold transition-colors
            ${linkTab === "external" ? "text-gray-900 dark:text-[var(--text-primary)]" : "text-gray-500 dark:text-[var(--muted)]"}`}
        >
          External Link
          {linkTab === "external" && (
            <span className="absolute -bottom-[1px] left-0 right-0 h-[2px] rounded-full bg-amber-400" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setLinkTab("internal")}
          className={`relative px-1 pb-2 text-[13px] font-semibold transition-colors
            ${linkTab === "internal" ? "text-gray-900 dark:text-[var(--text-primary)]" : "text-gray-500 dark:text-[var(--muted)]"}`}
        >
          Internal link
          {linkTab === "internal" && (
            <span className="absolute -bottom-[1px] left-0 right-0 h-[2px] rounded-full bg-amber-400" />
          )}
        </button>
      </div>

      <div
        className="mt-3 rounded-2xl border border-[var(--border)] bg-gray-100/80 px-4 py-3
                   text-gray-800 shadow-inner
                   dark:bg-[var(--bg-hover)] dark:text-[var(--text-primary)]"
      >
        <div className="text-[28px] leading-7 font-extrabold">{externalTotal}</div>
        <div className="text-[12px] mt-0.5 text-gray-600 dark:text-[var(--muted)]">
          Number of External Links
        </div>
        <div className="text-[12px] mt-1 text-gray-600 dark:text-[var(--muted)]">
          Top search results link to pages from{" "}
          <span className="font-semibold text-gray-900 dark:text-[var(--text-primary)]">{totalDomains} domains</span>
        </div>
      </div>

      <div className="relative mt-3">
        <input
          className="w-full h-10 rounded-xl border border-[var(--border)] bg-white px-9 text-[13px] text-gray-800 placeholder-gray-400 outline-none focus:border-amber-400
                     dark:bg-[var(--bg-panel)] dark:text-[var(--text-primary)] dark:placeholder-[var(--muted)]"
          placeholder="Filter by keywords"
          value={kwFilter}
          onChange={(e) => setKwFilter(e.target.value)}
        />
        <SearchIcon size={14} className="absolute left-3 top-[11px] text-gray-400 dark:text-[var(--muted)]" />
      </div>

      <div className="mt-3 space-y-3">
        {cfgLoading && <div className="text-[12px] text-gray-500 dark:text-[var(--muted)]">Loading link data…</div>}
        {cfgError && <div className="text-[12px] text-rose-600">Failed to load: {cfgError}</div>}
        {!cfgLoading && !cfgError && filtered.map((r, idx) => (
          <LinkRow key={idx} {...r} onPaste={(text) => onPasteToEditor?.(text)} />
        ))}
        {!cfgLoading && !cfgError && filtered.length === 0 && (
          <div className="text-[12px] text-gray-500 dark:text-[var(--muted)] px-1 py-2">
            No links match the current filter.
          </div>
        )}
      </div>
    </div>
  );
}
