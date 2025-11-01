// components/content-editor/CE.ContentArea.js
"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import CEToolbar from "./CE.Toolbar";
import CECanvas from "./CE.Canvas";
import CEResearchPanel from "./CE.ResearchPanel";

/** Escape for regex */
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Build a regex for a multi-word keyword/phrase, tolerant of &, &amp;, and “and” */
function buildPhraseRegex(phrase) {
  const tokens = String(phrase || "")
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => {
      if (t === "&" || t === "and" || t === "&amp;") {
        return "(?:&|&amp;|and)";
      }
      return esc(t);
    });
  if (!tokens.length) return null;

  // allow whitespace or hyphen-like dashes between tokens for robust matching
  const joiner = "[\\s\\-–—]+";
  const pat = `\\b${tokens.join(joiner)}\\b`;
  return new RegExp(pat, "gi");
}

/** Plain-text normalize for matching */
function normalizePlain(htmlLike) {
  return String(htmlLike || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export default function CEContentArea({
  title = "Untitled",
  activeTab,
  onTabChange,
  lastEdited = "1 day ago",
  query, // live keyword from UI
  onQueryChange,
  onStart,
  seoMode: seoModeProp,
  metrics: metricsProp,
  setMetrics, // sync metrics back to parent
  content,
  setContent,
  primaryKeyword, // fallback keyword from parent/config
  lsiKeywords,
}) {
  const editorRef = useRef(null);

  // ----- Keyword setup (PRIORITIZE live query; fallback to primaryKeyword) -----
  const PRIMARY_KEYWORD = useMemo(
    () => String(query || primaryKeyword || "content marketing").toLowerCase(),
    [query, primaryKeyword]
  );

  const LSI_KEYWORDS = useMemo(
    () =>
      (Array.isArray(lsiKeywords) && lsiKeywords.length
        ? lsiKeywords
        : ["strategy", "SEO", "engagement", "conversion", "brand", "optimization"]
      ).map((k) => String(k).toLowerCase()),
    [lsiKeywords]
  );

  // ----- Metrics state -----
  const [seoMode] = useState(seoModeProp ?? "advanced");
  const [metricsInternal, setMetricsInternal] = useState({
    plagiarism: 0,
    primaryKeyword: 0,
    wordCount: 0,
    wordTarget: metricsProp?.wordTarget ?? 1250,
    lsiKeywords: 0,
    statuses: {
      wordCount: { label: "—", color: "text-[var(--muted)]" },
      primaryKeyword: { label: "—", color: "text-[var(--muted)]" },
      lsiKeywords: { label: "—", color: "text-[var(--muted)]" },
    },
  });

  // Keep internal wordTarget in sync
  useEffect(() => {
    if (metricsProp?.wordTarget) {
      setMetricsInternal((m) => ({ ...m, wordTarget: metricsProp.wordTarget }));
    }
  }, [metricsProp?.wordTarget]);

  /** ========= Throttled emit to parent (smoothes MetricsStrip animations) ========= */
  const metricsTimerRef = useRef(null);
  const emitMetricsThrottled = useCallback(
    (next) => {
      if (!setMetrics) return;
      clearTimeout(metricsTimerRef.current);
      // ~12fps cadence is a good balance for typing; adjust if needed
      metricsTimerRef.current = setTimeout(() => {
        setMetrics(next);
      }, 80);
    },
    [setMetrics]
  );

  useEffect(() => {
    return () => clearTimeout(metricsTimerRef.current);
  }, []);

  // ----- Recompute metrics (PK / LSI / plagiarism / words) -----
  useEffect(() => {
    const plain = normalizePlain(content);

    if (!plain) {
      const emptyMetrics = {
        plagiarism: 0,
        primaryKeyword: 0,
        wordCount: 0,
        lsiKeywords: 0,
        wordTarget: metricsInternal.wordTarget,
      };

      setMetricsInternal((m) => ({
        ...m,
        ...emptyMetrics,
        statuses: {
          wordCount: { label: "Empty", color: "text-[var(--muted)]" },
          primaryKeyword: { label: "Needs Review", color: "text-red-600" },
          lsiKeywords: { label: "Needs Review", color: "text-red-600" },
        },
      }));

      // immediate wordCount emit (0) + throttle the rest
      setMetrics?.((m) => (m.wordCount === 0 ? m : { ...m, wordCount: 0 }));
      emitMetricsThrottled(emptyMetrics);
      return;
    }

    const words = plain.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    // Primary keyword: tolerant phrase regex (driven by live `query`)
    const pkRegex = buildPhraseRegex(PRIMARY_KEYWORD);
    const pkMatches = pkRegex ? (plain.match(pkRegex) || []).length : 0;
    const pkScore = Math.min(100, pkMatches * 25); // heuristic

    // LSI coverage: presence-based, robust phrase matcher
    let lsiCovered = 0;
    for (const term of LSI_KEYWORDS) {
      const rx = buildPhraseRegex(term);
      if (rx && rx.test(plain)) lsiCovered += 1;
    }
    const lsiPct =
      LSI_KEYWORDS.length > 0
        ? Math.max(0, Math.min(100, Math.round((lsiCovered / LSI_KEYWORDS.length) * 100)))
        : 0;

    // Plagiarism heuristic
    const freq = Object.create(null);
    for (const w of words) freq[w] = (freq[w] || 0) + 1;
    const repeats = Object.values(freq).filter((n) => n > 2).length;
    const unique = Object.keys(freq).length;
    const repRatio = repeats / Math.max(1, unique);
    const plagiarism = Math.max(0, Math.min(100, Math.round(repRatio * 100)));

    const status = (val) => {
      if (val >= 75) return { label: "Good", color: "text-green-600" };
      if (val >= 40) return { label: "Moderate", color: "text-yellow-600" };
      return { label: "Needs Review", color: "text-red-600" };
    };

    const next = {
      plagiarism,
      wordCount,
      primaryKeyword: pkScore,
      lsiKeywords: lsiPct,
      wordTarget: metricsInternal.wordTarget,
    };

    setMetricsInternal((m) => ({
      ...m,
      ...next,
      statuses: {
        wordCount:
          wordCount >= (m.wordTarget || 1200)
            ? { label: "Good", color: "text-green-600" }
            : wordCount >= Math.round((m.wordTarget || 1200) * 0.5)
            ? { label: "Moderate", color: "text-yellow-600" }
            : { label: "Needs Review", color: "text-red-600" },
        primaryKeyword: status(pkScore),
        lsiKeywords: status(lsiPct),
      },
    }));

    // ---- Key change: emit wordCount immediately (no throttle) ----
    setMetrics?.((m) => (m?.wordCount === wordCount ? m : { ...m, wordCount }));

    // ---- Throttle the heavy (and animated) fields to avoid jitter ----
    emitMetricsThrottled(next);
  }, [
    content,
    query, // ← recompute when the Query field changes
    PRIMARY_KEYWORD,
    LSI_KEYWORDS,
    metricsInternal.wordTarget,
    emitMetricsThrottled,
    setMetrics, // ← added to satisfy react-hooks/exhaustive-deps
  ]);

  const metrics = metricsProp ?? metricsInternal;
  const effectiveSeoMode = seoModeProp ?? seoMode;

  return (
    <div className="grid grid-cols-[2fr_1fr] items-stretch rounded-[18px] overflow-hidden border border-[var(--border)] bg-[var(--bg-panel)] transition-colors">
      {/* LEFT AREA */}
      <div className="min-w-0 border-r border-[var(--border)] bg-[var(--bg-panel)]">
        <CEToolbar
          activeTab={activeTab}
          onTabChange={onTabChange}
          lastEdited={lastEdited}
          editorRef={editorRef}
        />

        <div className="bg-[var(--bg-panel)]">
          <CECanvas
            ref={editorRef}
            title={title}
            content={content}
            setContent={setContent}
          />
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="min-w-[320px] border-l border-[var(--border)] bg-[var(--bg-panel)]">
        <CEResearchPanel
          query={query}
          onQueryChange={onQueryChange}
          onStart={onStart}
          seoMode={effectiveSeoMode}
          metrics={metrics}
        />
      </div>
    </div>
  );
}
