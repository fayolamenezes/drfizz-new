// components/content-editor/CE.ResearchPanel.js
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  WandSparkles,
  Link as LinkIcon,
  HelpCircle,
  FlaskConical,
  Rocket,
} from "lucide-react";

import SeoBasics from "./research-panel/SeoBasics";
import SeoAdvancedOptimize from "./research-panel/SeoAdvancedOptimize";
import SeoAdvancedLinks from "./research-panel/SeoAdvancedLinks";
import SeoAdvancedFaqs from "./research-panel/SeoAdvancedFaqs";
import SeoAdvancedResearch from "./research-panel/SeoAdvancedResearch";
import SeoDetails from "./research-panel/SeoDetails";

const TABS = [
  { key: "basics", label: "SEO Basics", icon: Rocket },
  { key: "opt", label: "Optimize", icon: WandSparkles },
  { key: "links", label: "Links", icon: LinkIcon },
  { key: "faqs", label: "FAQ’s", icon: HelpCircle },
  { key: "research", label: "Research", icon: FlaskConical },
  // "details" is controlled by the Metrics Strip (seoMode === "details")
];

// helpers
const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

function pickPagesFromConfig(json) {
  // Supports both { pages: [...] } and bare array [...]
  if (Array.isArray(json?.pages)) return json.pages;
  if (Array.isArray(json)) return json;
  return [];
}

export default function CEResearchPanel({
  query = "",
  onQueryChange,
  onStart,
  seoMode = "basic", // "basic" | "advanced" | "details"
  metrics,
  onFix,
  onPasteToEditor,
  editorContent = "",
}) {
  const [phase, setPhase] = useState("idle"); // idle | searching | results
  const [tab, setTab] = useState("opt"); // opt | links | faqs | research
  const [cfgLoading, setCfgLoading] = useState(false);
  const [cfgError, setCfgError] = useState(null);
  const [pages, setPages] = useState([]);

  // Fetch /data/contenteditor.json (read-only)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setCfgLoading(true);
        setCfgError(null);
        const res = await fetch("/data/contenteditor.json", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!mounted) return;
        setPages(pickPagesFromConfig(json));
      } catch (e) {
        if (!mounted) return;
        setCfgError(String(e));
      } finally {
        if (mounted) setCfgLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Pick current page by matching live query → primaryKeyword, else ui.query, else first
  const currentPage = useMemo(() => {
    if (!pages.length) return null;
    const q = norm(query);
    const byPK = pages.find((p) => norm(p?.primaryKeyword) === q);
    if (byPK) return byPK;
    const byUI = pages.find((p) => norm(p?.ui?.query) === q);
    if (byUI) return byUI;
    return pages[0];
  }, [pages, query]);

  // Map to your JSON shapes:
  // - Basics: page.seoBasics
  // - Optimize: page.advanced.optimize
  // - Links: page.linksTab.external (internal not present in your JSON; we pass [])
  // - FAQs: page.faqs.{serp, peopleAlsoAsk, quora, reddit}
  // - Details: page.details (passed only to SeoDetails)
  const basicsData = currentPage?.seoBasics || null;
  const optimizeData = currentPage?.advanced?.optimize || null;
  const linksExternal = currentPage?.linksTab?.external || [];
  const linksInternal = currentPage?.linksTab?.internal || []; // usually not present; safe default
  const faqs = currentPage?.faqs || {
    serp: [],
    peopleAlsoAsk: [],
    quora: [],
    reddit: [],
  };
  const detailsData = currentPage?.details || null;

  // Optional extra fields for the "Research" tab if you add them later
  const outline = currentPage?.research?.outline || [];
  const competitors = currentPage?.research?.competitors || [];

  // Gate: only after a non-empty query AND Basics has started (searching/results)
  const canAccess = !!query?.trim() && (phase === "searching" || phase === "results");

  // BASIC mode (SEO Basics)
  if (seoMode === "basic") {
    return (
      <SeoBasics
        query={query}
        onQueryChange={onQueryChange}
        onStart={onStart}
        onFix={onFix}
        onPasteToEditor={onPasteToEditor}
        phase={phase}
        setPhase={setPhase}
        currentPage={currentPage}
        cfgLoading={cfgLoading}
        cfgError={cfgError}
        basicsData={basicsData}
      />
    );
  }

  // DETAILS view (from Metrics Strip) — guard until search started
  if (seoMode === "details") {
    if (!canAccess) {
      return (
        <aside className="h-full rounded-r-[18px] border-l border-[var(--border)] bg-[var(--bg-panel)] px-6 py-5 flex items-center justify-center transition-colors">
          <div className="text-center">
            <div className="text-[13px] font-semibold text-[var(--text-primary)]">
              Details locked
            </div>
            <p className="mt-1 text-[12px] text-[var(--muted)]">
              Type a keyword and click{" "}
              <span className="font-medium text-[var(--text-primary)]">Start</span> in
              SEO Basics to unlock Details.
            </p>
          </div>
        </aside>
      );
    }
    return (
      <SeoDetails
        onPasteToEditor={onPasteToEditor}
        currentPage={currentPage}
        detailsData={detailsData}
      />
    );
  }

  // ADVANCED mode: Optimize / Links / FAQ’s / Research tabs — disabled until canAccess
  return (
    <aside className="h-full rounded-r-[18px] border-l border-[var(--border)] bg-[var(--bg-panel)] px-5 md:px-6 py-5 flex flex-col gap-3 transition-colors">
      {/* Top navigation tabs */}
      <div className="flex items-center justify-between gap-1 w-full flex-nowrap">
        {TABS.slice(1).map(({ key, label, icon: Icon }) => {
          const isActive = tab === key;
          const disabled = !canAccess;
          return (
            <button
              key={key}
              onClick={() => !disabled && setTab(key)}
              title={label}
              disabled={disabled}
              className={`flex items-center justify-center gap-1 rounded-lg border flex-auto px-2.5 py-1.5 text-[12px] font-medium transition-all
                ${
                  isActive
                    ? "bg-[var(--bg-panel)] border-amber-400 text-amber-600 shadow-sm"
                    : "bg-[var(--bg-panel)] border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                }
                ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
              style={{ minWidth: "fit-content", whiteSpace: "nowrap" }}
            >
              <Icon
                size={13}
                className={`shrink-0 ${
                  disabled
                    ? "text-[var(--muted)]"
                    : isActive
                    ? "text-amber-600"
                    : "text-[var(--muted)]"
                }`}
              />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Message if locked */}
      {!canAccess && (
        <div className="rounded-xl border border-amber-300 bg-amber-50/70 dark:bg-amber-950/40 px-3 py-2 text-[12px] text-amber-800 dark:text-amber-200 transition-colors">
          Type a keyword and click{" "}
          <span className="font-semibold text-amber-900 dark:text-amber-100">
            Start
          </span>{" "}
          in SEO Basics to unlock Advanced tools.
        </div>
      )}

      {/* Loading/Error states for JSON fetch (advanced view) */}
      {canAccess && cfgLoading && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] px-3 py-2 text-[12px] text-[var(--muted)]">
          Loading research…
        </div>
      )}
      {canAccess && cfgError && (
        <div className="rounded-xl border border-rose-300 bg-rose-50/70 dark:bg-rose-950/40 px-3 py-2 text-[12px] text-rose-800 dark:text-rose-200">
          Failed to load data: {cfgError}
        </div>
      )}

      {/* Advanced panels (only visible when unlocked) */}
      {canAccess && !cfgLoading && !cfgError && (
        <>
          {tab === "opt" && (
            <SeoAdvancedOptimize
              onPasteToEditor={onPasteToEditor}
              // mapped from JSON: advanced.optimize
              optimizeData={optimizeData}
              currentPage={currentPage}
              basicsData={basicsData}
            />
          )}

          {tab === "links" && (
            <SeoAdvancedLinks
              onPasteToEditor={onPasteToEditor}
              // mapped from JSON: linksTab.external (internal may be empty)
              linksExternal={linksExternal}
              linksInternal={linksInternal}
              currentPage={currentPage}
            />
          )}

          {tab === "faqs" && (
            <SeoAdvancedFaqs
              onPasteToEditor={onPasteToEditor}
              // mapped from JSON: faqs.{serp, peopleAlsoAsk, quora, reddit}
              faqs={faqs}
              currentPage={currentPage}
            />
          )}

          {tab === "research" && (
            <SeoAdvancedResearch
              editorContent={editorContent}
              onPasteToEditor={onPasteToEditor}
              // optional extras if you later add `research` in JSON
              outline={outline}
              competitors={competitors}
              currentPage={currentPage}
              basicsData={basicsData}
              optimizeData={optimizeData}
              linksExternal={linksExternal}
              faqs={faqs}
            />
          )}
        </>
      )}
    </aside>
  );
}
