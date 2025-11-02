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

/* ===========================
   Tabs
   =========================== */

const TABS = [
  { key: "basics", label: "SEO Basics", icon: Rocket },
  { key: "opt", label: "Optimize", icon: WandSparkles },
  { key: "links", label: "Links", icon: LinkIcon },
  { key: "faqs", label: "FAQ’s", icon: HelpCircle },
  { key: "research", label: "Research", icon: FlaskConical },
  // "details" is controlled by the Metrics Strip (seoMode === "details")
];

/* ===========================
   Helpers
   =========================== */

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

function safeJsonParse(s, fallback = null) {
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

function getSavedDomain() {
  // Step1Slide1 stores: localStorage.setItem("websiteData", JSON.stringify({ site }))
  const raw = typeof window !== "undefined" ? localStorage.getItem("websiteData") : null;
  const parsed = safeJsonParse(raw, {});
  return parsed?.site || "";
}

/* ===========================
   Component
   =========================== */

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

  // -------- ContentEditor config (legacy/all tabs baseline) --------
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

  // Map to your contenteditor.json shapes
  const basicsData = currentPage?.seoBasics || null;
  const linksExternal = currentPage?.linksTab?.external || [];
  const linksInternal = currentPage?.linksTab?.internal || [];
  const faqs = currentPage?.faqs || {
    serp: [],
    peopleAlsoAsk: [],
    quora: [],
    reddit: [],
  };
  const detailsData = currentPage?.details || null;

  /** -------------------------------
   *  Research data (robust mapper)
   *  -------------------------------
   *  Supports both:
   *   currentPage.research = {
   *     outline: [ {level, title}, ... ],
   *     competitors: [ {...}, ... ] OR { domains: [ {...}, ... ] },
   *     heatmaps: {
   *       headingsFrequency: [], termHeat: [], serpFeatureCoverage: [], headingSerpMatrix: []
   *     }
   *   }
   *  and older shapes (heatmapsTab / competitorsTab).
   */
  const researchBlock = currentPage?.research || currentPage || {};
  const outline =
    Array.isArray(researchBlock?.outline)
      ? researchBlock.outline
      : Array.isArray(researchBlock?.headings)
      ? researchBlock.headings
      : [];

  const competitors =
    Array.isArray(researchBlock?.competitors)
      ? researchBlock.competitors
      : Array.isArray(researchBlock?.competitorsTab?.domains)
      ? researchBlock.competitorsTab.domains
      : Array.isArray(researchBlock?.research?.competitors)
      ? researchBlock.research.competitors
      : Array.isArray(researchBlock?.research?.competitors?.domains)
      ? researchBlock.research.competitors.domains
      : Array.isArray(researchBlock?.competitors?.domains)
      ? researchBlock.competitors.domains
      : [];

  const defaultHeatmaps = {
    headingsFrequency: [],
    termHeat: [],
    serpFeatureCoverage: [],
    headingSerpMatrix: [],
  };

  const heatmaps =
    researchBlock?.heatmaps ||
    researchBlock?.heatmapsTab ||
    researchBlock?.research?.heatmaps ||
    researchBlock?.research?.heatmapsTab ||
    defaultHeatmaps;

  // -------- Optimize dataset (domain-aware demo dataset) --------
  const [optLoading, setOptLoading] = useState(false);
  const [optError, setOptError] = useState(null);
  const [optDataset, setOptDataset] = useState(null);
  const [activeDomainKey, setActiveDomainKey] = useState(""); // saved {site}
  const [optActiveDomain, setOptActiveDomain] = useState(null);
  const [optActivePage, setOptActivePage] = useState(null);

  // Load optimize dataset from /public/data/optimize-dataset.json
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setOptLoading(true);
        setOptError(null);
        const res = await fetch("/data/optimize-dataset.json", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!mounted) return;
        setOptDataset(json);
      } catch (e) {
        if (!mounted) return;
        setOptError(String(e));
      } finally {
        if (mounted) setOptLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Track saved domain (from Step1Slide1) and choose active domain block from dataset
  useEffect(() => {
    // Read once on mount and also whenever we return to the Optimize tab
    const site = getSavedDomain();
    setActiveDomainKey(site || "");
  }, [tab]);

  useEffect(() => {
    if (!optDataset || !activeDomainKey) {
      setOptActiveDomain(null);
      return;
    }
    const dom = Array.isArray(optDataset?.domains)
      ? optDataset.domains.find((d) => norm(d.domain) === norm(activeDomainKey))
      : null;
    setOptActiveDomain(dom || null);
  }, [optDataset, activeDomainKey]);

  // Choose a page inside the active domain based on current query (title/url includes q), else first
  useEffect(() => {
    if (!optActiveDomain) {
      setOptActivePage(null);
      return;
    }
    const q = norm(query);
    const domPages = Array.isArray(optActiveDomain.pages) ? optActiveDomain.pages : [];
    const byTitle = domPages.find((p) => norm(p?.title) === q);
    const byLoose =
      byTitle ||
      domPages.find(
        (p) => norm(p?.title).includes(q) || norm(p?.url).includes(q) || norm(p?.id).includes(q)
      );
    setOptActivePage(byLoose || domPages[0] || null);
  }, [optActiveDomain, query]);

  // Compute optimizeData to pass into <SeoAdvancedOptimize />
  // Priority:
  //  1) If optimize dataset found a page => use its keywords/kpis.
  //  2) Else fallback to contenteditor.json's advanced.optimize (legacy).
  const optimizeDataFromDomain = useMemo(() => {
    if (!optActivePage) return null;
    const { keywords = [], kpis = null } = optActivePage;
    return { keywords, kpis, _source: "optimize-dataset.json" };
  }, [optActivePage]);

  const optimizeDataFallback = currentPage?.advanced?.optimize || null;
  const optimizeData = optimizeDataFromDomain || optimizeDataFallback;

  // -------- Access gate (same as before) --------
  const canAccess = !!query?.trim() && (phase === "searching" || phase === "results");

  /* ===========================
     BASIC mode
     =========================== */
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

  /* ===========================
     DETAILS view
     =========================== */
  if (seoMode === "details") {
    if (!canAccess) {
      return (
        <aside className="h-full rounded-r-[18px] border-l border-[var(--border)] bg-white px-6 py-5 flex items-center justify-center transition-colors">
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

  /* ===========================
     ADVANCED mode
     =========================== */
  return (
    <aside className="h-full rounded-r-[18px] border-l border-[var(--border)] bg-white px-5 md:px-6 py-5 flex flex-col gap-3 transition-colors">
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
                    ? "bg-white border-amber-400 text-amber-600 shadow-sm"
                    : "bg-white border-[var(--border)] text-[var(--text-primary)] hover:bg-gray-50"
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

      {/* Loading/Error states for config/optimize dataset */}
      {canAccess && (cfgLoading || optLoading) && (
        <div className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-[12px] text-[var(--muted)]">
          Loading research…
        </div>
      )}
      {canAccess && (cfgError || optError) && (
        <div className="rounded-xl border border-rose-300 bg-rose-50/70 dark:bg-rose-950/40 px-3 py-2 text-[12px] text-rose-800 dark:text-rose-200">
          Failed to load data: {cfgError || optError}
        </div>
      )}

      {/* Advanced panels */}
      {canAccess && !cfgLoading && !optLoading && !(cfgError || optError) && (
        <>
          {tab === "opt" && (
            <SeoAdvancedOptimize
              onPasteToEditor={onPasteToEditor}
              optimizeData={optimizeData}
              currentPage={currentPage}
              basicsData={basicsData}
              editorContent={editorContent}
            />
          )}

          {tab === "links" && (
            <SeoAdvancedLinks
              onPasteToEditor={onPasteToEditor}
              linksExternal={linksExternal}
              linksInternal={linksInternal}
              currentPage={currentPage}
            />
          )}

          {tab === "faqs" && (
            <SeoAdvancedFaqs
              onPasteToEditor={onPasteToEditor}
              faqs={faqs}
              currentPage={currentPage}
            />
          )}

          {tab === "research" && (
            <SeoAdvancedResearch
              editorContent={editorContent}
              onPasteToEditor={onPasteToEditor}
              // 🔽 ensure Research tab has ALL data
              outline={outline}
              competitors={competitors}
              heatmaps={heatmaps}
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
