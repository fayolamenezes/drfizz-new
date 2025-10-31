// src/components/Dashboard.js
"use client";
import Image from "next/image";
import { Activity, ActivitySquare, AlertTriangle, BarChart3, BookOpen, Check, ChevronRight, Clock3, Eye, FileText, Gauge, Goal, HelpCircle, KeyRound, Lightbulb, Link2, Lock, Monitor, Network, PencilLine, RefreshCw, Rocket, Settings, ShieldCheck, Skull, SlidersHorizontal, Smartphone, SquareArrowOutUpRight, ThumbsDown, ThumbsUp, TrendingUp, TrendingDown, Wifi, X } from "lucide-react";
import { useEffect, useRef, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
// --- Prefill content templates for the 4 "Top On-Page Content Opportunities" cards ---
const PREFILL_BY_TITLE = {
  "How to Choose a CRM for SMEs": `Intro: Picking the right CRM for SMEs depends on workflows, budget, and integration needs.
H2: Audit your current sales workflows
H2: Must-have features vs nice-to-haves
H2: Integration plan (email, billing, WhatsApp)
Conclusion: Pilot with a small team and measure adoption.`,
  "What Is Content Marketing?": `Content marketing is the strategic creation and distribution of helpful content to attract qualified audiences.
H2: Why content compounds over time
H2: Editorial calendar & topic clusters
H2: Measuring ROI beyond vanity metrics`,
  "Pricing Page Optimization": `Your pricing page is a high-intent surface—remove friction and make comparison effortless.
H2: Clarity over cleverness
H2: Social proof and objection handlers
H2: Common layout patterns that convert`,
  "Contact Page Best Practices": `The contact page reduces uncertainty and sets response expectations.
H2: Inline FAQs to deflect simple queries
H2: Trust signals (office address, phone, SLA)
H2: Clear next steps after submit`,
};

function getPrefillFor(title) {
  return PREFILL_BY_TITLE[title] ?? "";
}
// --- End prefill helpers ---

/** Normalize a domain string -> "example.com" */
function normalizeDomain(input = "") {
  try {
    const url = input.includes("://") ? new URL(input) : new URL(`https://${input}`);
    let host = url.hostname.toLowerCase();
    if (host.startsWith("www.")) host = host.slice(4);
    return host;
  } catch {
    return String(input)
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0];
  }
}

// Add this helper inside Dashboard() (above the return), reusing existing imports/hooks:
function LikeDislike() {
  const [choice, setChoice] = useState(null); // 'up' | 'down' | null
  const [bump, setBump] = useState(null);     // which icon is bumping

  const handleClick = (dir) => {
    setChoice(prev => (prev === dir ? null : dir));
    setBump(dir);
    // brief pop effect
    setTimeout(() => setBump(null), 150);
  };

  const base = "cursor-pointer transition-transform duration-150";
  return (
    <span className="flex items-center gap-2">
      <ThumbsUp
        size={16}
        strokeWidth={2}
        fill="none"                          // keep interior unfilled
        className={`${base} ${bump==='up' ? 'scale-110' : ''} ${choice==='up' ? 'text-[#22C55E]' : ''}`}
        onClick={() => handleClick('up')}
        aria-label="Thumbs up"
      />
      <ThumbsDown
        size={16}
        strokeWidth={2}
        fill="none"                          // keep interior unfilled
        className={`${base} ${bump==='down' ? 'scale-110' : ''} ${choice==='down' ? 'text-[#EF4444]' : ''}`}
        onClick={() => handleClick('down')}
        aria-label="Thumbs down"
      />
    </span>
  );
}

/** Compact number formatter for backlinks and other big counts */
function formatCompactNumber(n) {
  const v = Number(n) || 0;
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + "B";
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (v >= 1_000) return (v / 1_000).toFixed(1) + "k";
  return Math.round(v).toString();
}
/** Heuristics to retrieve the site the user entered during onboarding */
function getSiteFromStorageOrQuery(searchParams) {
  // 1) Highest priority: ?site=
  const qp = searchParams?.get?.("site");
  if (qp) return normalizeDomain(qp);

  // 2) Try a few common localStorage/sessionStorage keys
  const keys = [
    "websiteData", "site", "website", "selectedWebsite",
    "drfizzm.site", "drfizzm.website"
  ];
  try {
    for (const store of [localStorage, sessionStorage]) {
      for (const k of keys) {
        const v = store.getItem(k);
        if (!v) continue;
        // if JSON, try common shapes
        try {
          const o = JSON.parse(v);
          const cands = [o?.site, o?.website, o?.url, o?.domain, o?.value];
          for (const c of cands) if (c) return normalizeDomain(String(c));
        } catch {
          // plain string
          return normalizeDomain(v);
        }
      }
    }
  } catch {
    // storage not available (SSR / privacy mode) → ignore
  }
  // 3) fallback
  return "example.com";
}

/** Map one CSV/row object from seo-data.json (array) into the UI schema */
function mapRowToSchema(row) {
  if (!row || typeof row !== "object") return null;
  // Basic safe getters
  // replace your current `n` with this:
  const n = (x, d = undefined) => {
    if (typeof x === "number" && Number.isFinite(x)) return x;
    if (typeof x === "string") {
      const v = Number(x.replace(/[, ]/g, ""));
      if (Number.isFinite(v)) return v;
    }
    return d;
  };

  const s = (x, d=undefined) => (typeof x === "string" ? x : d);

  // Build "new opportunities" table rows from numbered fields
  const seoRows = [];
  for (let i = 1; i <= 6; i++) {
    const kw = row[`NewOp_Keyword_${i}`];
    const typ = row[`NewOp_Type_${i}`];
    const vol = row[`NewOp_SearchVol_${i}`];
    const diff = row[`NewOp_SEODiff_${i}`];
    if (kw && typ && (typeof vol === "number") && (typeof diff === "number")) {
      const sugg = row[`NewOp_Suggested_${i}`];
      const pref = row[`NewOp_Preference_${i}`];
      seoRows.push({ keyword: String(kw), type: String(typ), volume: vol, difficulty: diff, suggested: sugg ? String(sugg) : undefined, preference: pref ? String(pref) : undefined });
    }
  }

  // Organic keywords breakdown (optional)
  const top3  = n(row["Top_3_Keywords"], undefined);
  const top10 = n(row["Top_10_Keywords"], undefined);
  const top100= n(row["Top_100_Keywords"], undefined);

  return {
    domain: normalizeDomain(s(row["Domain/Website"], s(row["Domain"], ""))),
    dateAnalyzed: s(row["Date_Analyzed"], ""),
    // ---- On-page content opportunities (Blogs & Pages) ----
    content: {
      blog: [
        {
          title: s(row["Blog1_Title"], "Untitled"),
          priority: s(row["Blog1_Priority"], "Medium Priority"),
          wordCount: n(row["Blog1_Word_Count"], 0),
          keywords: n(row["Blog1_Num_Keywords"], 0),
          score: n(row["Blog1_Score"], 0),
          status: s(row["Blog1_Status"], "Draft"),
        },
        {
          title: s(row["Blog2_Title"], "Untitled"),
          priority: s(row["Blog2_Priority"], "Medium Priority"),
          wordCount: n(row["Blog2_Word_Count"], 0),
          keywords: n(row["Blog2_Num_Keywords"], 0),
          score: n(row["Blog2_Score"], 0),
          status: s(row["Blog2_Status"], "Draft"),
        },
      ].filter(Boolean),
      pages: [
        {
          title: s(row["Page1_Title"], "Untitled"),
          priority: s(row["Page1_Priority"], "Medium Priority"),
          wordCount: n(row["Page1_Word_Count"], 0),
          keywords: n(row["Page1_Num_Keywords"], 0),
          score: n(row["Page1_Score"], 0),
          status: s(row["Page1_Status"], "Draft"),
        },
        {
          title: s(row["Page2_Title"], "Untitled"),
          priority: s(row["Page2_Priority"], "Medium Priority"),
          wordCount: n(row["Page2_Word_Count"], 0),
          keywords: n(row["Page2_Num_Keywords"], 0),
          score: n(row["Page2_Score"], 0),
          status: s(row["Page2_Status"], "Draft"),
        },
      ].filter(Boolean),
    },

    // Off-page
    domainRating: n(row["Domain_Rating"], undefined),
    industryAvgDR: n(row["Industry_Average_DR"], undefined),
    trustBar: n(row["High_Quality_Backlinks_Percent"], undefined),
    medQuality: n(row["Medium_Quality_Backlinks_Percent"], undefined),
    lowQuality: n(row["Low_Quality_Backlinks_Percent"], undefined),
    referringDomains: n(row["Referring_Domains"], undefined),
    backlinks: n(row["Total_Backlinks"], undefined),
    dofollowPct: n(row["DoFollow_Links_Percent"], undefined),
    nofollowPct: n(row["NoFollow_Links_Percent"], undefined),
    // Technical
    siteHealth: n(row["Site_Health_Score"], undefined),
    pagesScanned: n(row["Pages_Scanned"], undefined),
    redirects: n(row["Redirect_Issues"], undefined),
    broken: n(row["Broken_Links"], undefined),
    // CWV scores present, but your UI expects time values; we keep hardcoded defaults if not provided as times.
    cwvScores: {
      LCP_Score: n(row["LCP_Score"], undefined),
      INP_Score: n(row["INP_Score"], undefined),
      CLS_Score: n(row["CLS_Score"], undefined),
    },
    pageSpeed: {
      desktop: n(row["Desktop_PageSpeed_Score"], undefined),
      mobile: n(row["Mobile_PageSpeed_Score"], undefined),
    },
    // Performance
    organicTraffic: {
      monthly: n(row["Organic_Traffic"], undefined),
      growth: n(row["Organic_Traffic_Growth"], undefined),
    },
    organicKeywords: {
      total: n(row["Total_Organic_Keywords"], undefined),
      top3, top10, top100,
    },
    // Leads
    leads: {
      monthly: n(row["Total_Leads"], undefined),
      goal: n(row["Lead_Goal_Target"], undefined),
      contactForm: n(row["Contact_Form_Leads"], undefined),
      newsletter: n(row["Newsletter_Signups"], undefined),
      growth: n(row["Lead_Growth_Percent"], undefined), // if present in your data
    },

    // AI tool visibility (ratings & indexed pages) — per domain
    aiTools: {
      GPT:        { rating: n(row["GPT_Rating"], undefined),        pages: n(row["GPT_Pages"], undefined),        src: "/assets/gpt.svg" },
      GoogleAI:   { rating: n(row["Google_AI_Rating"], undefined),  pages: n(row["Google_AI_Pages"], undefined),  src: "/assets/google.svg" },
      Perplexity: { rating: n(row["Perplexity_Rating"], undefined), pages: n(row["Perplexity_Pages"], undefined), src: "/assets/perplexity.svg" },
      Copilot:    { rating: n(row["Copilot_Rating"], undefined),    pages: n(row["Copilot_Pages"], undefined),    src: "/assets/copilot.svg" },
      Gemini:     { rating: n(row["Gemini_Rating"], undefined),     pages: n(row["Gemini_Pages"], undefined),     src: "/assets/gemini.svg" },
    },

    // SERP features
    serp: {
      coveragePercent: n(row["SERP_Feature_Coverage_Percent"], undefined),
      featuredSnippets: n(row["Featured_Snippets_Count"], undefined),
      peopleAlsoAsk: n(row["People_Also_Ask_Count"], undefined),
      imagePack: n(row["Image_Pack_Count"], undefined),
      videoResults: n(row["Video_Results_Count"], undefined),
      knowledgePanel: n(row["Knowledge_Panel_Count"], undefined),
    },
    // Issue/opportunity cards (site-level)
    issues: {
      critical: n(row["Critical_Issues_Count"], undefined),
      warning: n(row["Warning_Issues_Count"], undefined),
      recommendations: n(row["Recommendations_Count"], undefined),
      contentOpps: n(row["Content_Opportunities_Count"], undefined),
      criticalGrowth: n(row["Critical_Issues_Growth_Percent"], undefined),
      warningGrowth: n(row["Warning_Issues_Growth_Percent"], undefined),
    },
    // New SEO opp table
    seoRows
  };
}

export default function Dashboard({ onOpenContentEditor }) {

  const searchParams = useSearchParams();
  const [domain, setDomain] = useState("example.com");
  const [rows, setRows] = useState(null);        // raw array from /data/seo-data.json
  const [dataError, setDataError] = useState("");

  // Watch for query param AND storage
  useEffect(() => {
    setDomain(getSiteFromStorageOrQuery(searchParams));
  }, [searchParams]);

  // Load JSON (array of rows)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/data/seo-data.json", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load seo-data.json");
        const json = await res.json();
        if (!Array.isArray(json)) throw new Error("seo-data.json must be an array of rows");
        if (alive) setRows(json.map(mapRowToSchema).filter(Boolean));
      } catch (e) {
        console.error(e);
        if (alive) setDataError("Couldn't load /data/seo-data.json (place it under public/data).");
      }
    })();
    return () => { alive = false; };
  }, []);

  // Pick the selected row by domain (match ignoring www/protocol)
  const selected = useMemo(() => {
    if (!rows?.length) return null;
    const key = normalizeDomain(domain);
    return rows.find(r => r.domain === key) || rows.find(r => r.domain === `www.${key}`) || null;
  }, [rows, domain]);

  // ====== Values (with graceful fallbacks to your current hardcoded demo numbers) ======
  const DR_TARGET = selected?.domainRating ?? 53.6;
  const DR_BAR    = selected?.trustBar ?? 72;

  const RD_TARGET = selected?.referringDomains ?? 63400;
  // Normalize High/Medium/Low quality percentages so they always sum to 100
  const qualitySplit = useMemo(() => {
    const h = selected?.trustBar ?? 45;
    const m = selected?.medQuality ?? 35;
    const l = selected?.lowQuality ?? 20;
    const sum = (h ?? 0) + (m ?? 0) + (l ?? 0);
    if (!sum || sum === 100) return { h, m, l };
    return { h: (h / sum) * 100, m: (m / sum) * 100, l: (l / sum) * 100 };
  }, [selected?.trustBar, selected?.medQuality, selected?.lowQuality]);

  const TB_TARGET = selected?.backlinks ?? (26.1 * 1_000_000_000);

  const SH_SCORE  = selected?.siteHealth ?? 100.0;
  const SH_PAGES  = selected?.pagesScanned ?? 2100;
  const SH_REDIRECT = selected?.redirects ?? 89;
  const SH_BROKEN = selected?.broken ?? 15;

  // CWV: drive tiles from dataset; fall back to demos if missing
  const LCP_TARGET = selected?.cwvScores?.LCP_Score ?? 2.1;   // seconds
  const INP_TARGET = selected?.cwvScores?.INP_Score ?? 180;   // ms
  const CLS_TARGET = selected?.cwvScores?.CLS_Score ?? 0.08;  // unitless

  const PS_DESKTOP = selected?.pageSpeed?.desktop ?? 95;
  const PS_MOBILE  = selected?.pageSpeed?.mobile ?? 87;

  const OT_TARGET  = selected?.organicTraffic?.monthly ?? 38600;
  const OK_TOTAL   = selected?.organicKeywords?.total ?? 90600;

  // If breakdown present, use it; else fall back to your demo split
  const OK_SPLIT = {
    top3:  selected?.organicKeywords?.top3  ?? 12300,
    top10: selected?.organicKeywords?.top10 ?? 24800,
    top100:selected?.organicKeywords?.top100?? 53600,
    total: OK_TOTAL,
  };

  const LEADS_TARGET = selected?.leads?.monthly ?? 887;
  const LEADS_GOAL   = selected?.leads?.goal ?? 1500;
  const CF_VALUE     = selected?.leads?.contactForm ?? 0;
  const NL_VALUE     = selected?.leads?.newsletter ?? 0;
  const CF_LIMIT     = 800;
  const NL_LIMIT     = 400;

  const serpCountsMemo = useMemo(() => ([
    selected?.serp?.featuredSnippets ?? 23,
    selected?.serp?.peopleAlsoAsk ?? 156,
    selected?.serp?.imagePack ?? 89,
    selected?.serp?.videoResults ?? 34,
    selected?.serp?.knowledgePanel ?? 12,
  ]), [selected?.serp]);
  const SERP_COVERAGE = selected?.serp?.coveragePercent ?? 45;

  const seoRowsFromData = selected?.seoRows?.length ? selected.seoRows : null;

  // ====== Animation Orchestrator (all widgets sync) ======
const MASTER_MS = 1000;                 // single duration for everything
const [prog, setProg] = useState(0);    // 0 → 1 (eased)

useEffect(() => {
  if (!rows) return;                    // gate on data to avoid "second wave"
  let raf;
  const start = performance.now();
  const tick = (now) => {
    const tRaw = (now - start) / MASTER_MS;
    const t = Math.max(0, Math.min(1, tRaw));
    const ease = 1 - Math.pow(1 - t, 3); // cubic-out
    setProg(ease);
    if (t < 1) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}, [rows]);

// ---- Derived animated values (no per-widget RAFs) ----
const drValue = Math.max(0, DR_TARGET * prog);
const drWidth = Math.max(0, DR_BAR * prog);

const rdValue = Math.max(0, RD_TARGET * prog);
const rdP = Math.max(0, prog);  // reuse for quality bars

const tbValue = Math.max(0, TB_TARGET * prog);

const shValue = Math.max(0, SH_SCORE * prog);
const pagesScanned = Math.max(0, Math.round(SH_PAGES * prog));
const redirects = Math.max(0, Math.round(SH_REDIRECT * prog));
const broken = Math.max(0, Math.round(SH_BROKEN * prog));

const lcp = Math.max(0, LCP_TARGET * prog);
const inp = Math.max(0, INP_TARGET * prog);
const cls = Math.max(0, CLS_TARGET * prog);

const psProgress = Math.max(0, prog);

const otValue = Math.max(0, OT_TARGET * prog);
const otProg = Math.max(0, prog);

const okValue = Math.max(0, OK_TOTAL * prog);
const okProg = Math.max(0, prog);

const leadsCount = Math.max(0, LEADS_TARGET * prog);
const leadsProg = Math.max(0, prog);

const serpCounts = serpCountsMemo.map((n) => Math.max(0, Math.round(n * prog)));
const serpCoverage = Math.max(0, SERP_COVERAGE * prog);

const oppCounts = [
  Math.round(Math.max(0, (selected?.issues?.critical ?? 274) * prog)),
  Math.round(Math.max(0, (selected?.issues?.warning ?? 883) * prog)),
  Math.round(Math.max(0, (selected?.issues?.recommendations ?? 77) * prog)),
  Math.round(Math.max(0, (selected?.issues?.contentOpps ?? 5) * prog)),
];

const oppCardsProgress = Math.max(0, prog);
const seoTableProg = Math.max(0, prog);

  // On-page content opportunities (pulled from seo-data.json)
  const blogCards = selected?.content?.blog ?? [];
  const pageCards = selected?.content?.pages ?? [];


// ====== Small UI helpers (unchanged, except table rows can be dataset-driven) ======
// ====== Small UI helpers (unchanged, except table rows can be dataset-driven) ======
  function DifficultyBar({ value, progress = 1 }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    const pct = Math.max(0, Math.min(100, value));
    const p   = Math.max(0, Math.min(1, progress));
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

  function getPriority(score) {
    if (score <= 30) {
      return {
        label: "High Priority",
        dot: "#EF4444",
        pillBg: "#FFF0F4",
        pillBorder: "#FFE1EA",
        pillText: "#D12C2C",
        chipBg: "#FFF0F4",
        chipBorder: "#FFE1EA",
        chipText: "#D12C2C",
      };
    }
    if (score <= 70) {
      return {
        label: "Medium Priority",
        dot: "#F59E0B",
        pillBg: "#FFF5D9",
        pillBorder: "#FDE7B8",
        pillText: "#B98500",
        chipBg: "#FFF5D9",
        chipBorder: "#FDE7B8",
        chipText: "#B98500",
      };
    }
    return {
      label: "Low Priority",
      dot: "#22C55E",
      pillBg: "#EAF8F1",
      pillBorder: "#CBEBD9",
      pillText: "#178A5D",
      chipBg: "#EAF8F1",
      chipBorder: "#CBEBD9",
      chipText: "#178A5D",
    };
  }

  function OpportunityCard({ title, score, wordCount, keywords, status, progress = 1 }) {
    const scoreAnim = Math.max(0, Math.round(score * progress));
    const wordAnim  = Math.max(0, Math.round(wordCount * progress));
    const keyAnim   = Math.max(0, Math.round(keywords * progress));
    const pri = getPriority(score);
    return (
      <div className="relative rounded-[18px] border border-[var(--border)] bg-[var(--input)] p-4 shadow-sm">
        <div className="group absolute right-4 top-4">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full text-[14px] font-semibold shadow-sm tabular-nums"
            style={{ backgroundColor: pri.chipBg, border: `1px solid ${pri.chipBorder}`, color: pri.chipText }}
            aria-label={`Page Speed Indicator: ${scoreAnim}`}
          >
            {scoreAnim}
          </div>
          <div className="pointer-events-none absolute -top-3 right-1/2 z-10 w-max translate-x-1/2 -translate-y-full
                          rounded-md bg-black px-3 py-2 text-white opacity-0 shadow-lg transition-opacity
                          duration-150 group-hover:opacity-100">
            <div className="text-[12px] font-semibold">Page Speed Indicator: {scoreAnim}</div>
            <div className="mt-0.5 text-[11px] text-gray-300">Your site&#39;s credit rating with Google.</div>
            <span className="absolute left-1/2 top-full -translate-x-1/2
                            border-x-8 border-t-8 border-b-0 border-solid
                            border-x-transparent border-t-black" />
          </div>
        </div>

        <div className="pr-14">
          <h3 className="text-[20px] font-semibold leading-snug text-[var(--text)]">{title}</h3>
        </div>

        <hr className="mt-3 border-t border-[var(--border)]" />

        <div className="mt-3 flex items-center gap-2">
          <span
            className="inline-flex items-center gap-2 rounded-[10px] px-2.5 py-1 text-[12px] font-medium"
            style={{ backgroundColor: pri.pillBg, border: `1px solid ${pri.pillBorder}`, color: pri.pillText }}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: pri.dot }} />
            {pri.label}
          </span>
          <span className="inline-flex items-center gap-2 rounded-[10px] border border-[var(--border)] bg-[#F6F8FB] px-2.5 py-1 text-[12px] text-[var(--muted)]">
            {status === "Published" ? <Check size={14} /> : <PencilLine size={14} />}
            {status}
          </span>
        </div>

        <div className="mt-4 rounded-[12px] border border-[var(--border)] bg-[var(--input)] px-4 py-3">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-[12px] text-[var(--muted)]">Word Count</div>
              <div className="mt-1 text-[28px] font-semibold leading-none text-[var(--text)] tabular-nums">
                {wordAnim.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[12px] text-[var(--muted)]">Keywords</div>
              <div className="mt-1 text-[28px] font-semibold leading-none text-[var(--text)] tabular-nums">
                {keyAnim}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button className="inline-flex items-center gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--input)] px-3 py-2 text-[12px] font-medium text-[var(--muted)]">
            <Eye size={14} /> View Details
          </button>
<button
  onClick={() => {
    const payload = { title }; // you can add more fields later (e.g., type, id, content)
    window.dispatchEvent(new CustomEvent("content-editor:open", { detail: payload }));
    onOpenContentEditor?.(payload);
  }}
  className="inline-flex items-center gap-2 rounded-[14px] px-4 py-2 text-[13px] font-semibold text-white shadow-sm bg-[image:var(--infoHighlight-gradient)] hover:opacity-90 transition"
>
  Start <ChevronRight size={16} />
</button>

        </div>
      </div>
    );
  }

  function CircleGauge({ target, color, label, Icon, progress }) {
    const pct = Math.max(0, Math.min(100, target * progress));
    const angle = (pct / 100) * 360;
    const bg = `conic-gradient(${color} ${angle}deg, #E5E7EB 0deg)`;
    return (
      <div className="flex flex-col items-center ">
        <div className="relative h-32 w-32 rounded-full" style={{ background: bg }}>
          <div className="absolute inset-3 rounded-full bg-[var(--input)]" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <div className="text-[28px] font-semibold leading-none text-[var(--text)] tabular-nums">
              {Math.round(pct)}
            </div>
            <div className="flex items-center gap-1 text-[12px] text-[var(--muted)]">
              {Icon ? <Icon size={14} /> : null}
              {label}
            </div>
          </div>
        </div>
        <span className="mt-3 inline-flex items-center gap-1 rounded-full border border-[#BEE7D6] bg-[#EAF8F1] px-2.5 py-1 text-[12px] font-medium text-[#178A5D]">
          Excellent
          <TrendingUp size={14} />
        </span>
      </div>
    );
  }

  // ====== UI (kept from your working component; only dynamic spots were wired) ======
  return (
    <main className="min-h-screen bg-[var(--bg-panel)] px-4 py-6 sm:px-6 lg:px-8 overflow-x-hidden">
      <div className="mx-auto max-w-[100%] mt-1">
        {/* Row 1 */}
        <h2 className="text-[16px] font-bold text-[var(--text)] mb-3 ml-1">
          Off-Page SEO Metrics
        </h2>

        <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Domain Rating */}
          <div className="rounded-[14px] border border-[var(--border)] bg-[var(--input)] p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--input)] text-[var(--muted)]">
                  <ShieldCheck size={16} />
                </span>
                <span className="text-[13px] text-gray-700 leading-relaxed">
                  Domain Rating
                </span>
              </div>
              <span className="rounded-full bg-[#EAF8F1] px-2 py-0.5 text-[11px] font-medium text-[#178A5D]">
                Above Average
              </span>
            </div>

            <div className="mt-3 flex items-end gap-2">
              <div className="text-[32px] font-semibold leading-none text-[var(--text)] tabular-nums">
                {drValue.toFixed(1)}
              </div>
              <div className="pb-1 text-[13px] text-[var(--muted)]">/ 100</div>
              <div className="ml-auto text-[12px] font-medium text-[#1BA97A]">
                ↗︎ +8.4%
              </div>
            </div>

            <div className="mt-3 text-[11px] text-[var(--muted)]">
              Industry Avg: <span className="font-medium text-[var(--muted)]">{selected?.industryAvgDR ?? 45.2}</span>
            </div>

            <div className="mt-3 text-[12px] text-[var(--muted)]">Trust score</div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--border)]">
              <div
                className="h-2 rounded-full bg-[#1CC88A]"
                style={{ width: `${drWidth}%` }}
              />
            </div>
          </div> 

          {/* Referring Domains */}
          <div className="rounded-[14px] border border-[var(--border)] bg-[var(--input)] p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--input)] text-[var(--muted)]">
                  <Network size={16} />
                </span>
                <span className="text-[13px] text-gray-700 leading-relaxed">
                  Referring Domains
                </span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF6E7] px-2 py-0.5 text-[11px] font-medium text-[#B67200]">
                <span className="inline-block h-2 w-2 rounded-full bg-[#F59E0B]" />
                Growing
              </span>
            </div>

            <div className="mt-3 flex items-end gap-2">
              <div className="text-[32px] font-semibold leading-none text-[var(--text)] tabular-nums">
                {rdValue >= 1000 ? (rdValue / 1000).toFixed(1) + "k" : Math.round(rdValue)}
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-1 rounded-[10px] border border-[var(--border)] bg-[var(--input)] px-3 py-2 text-[12px] text-[var(--muted)]">
                Quality Distribution
              </div>

              <div className="relative">
                <div className="h-2 w-full rounded-full bg-[var(--border)]" />
                <div className="absolute inset-0 flex h-2 items-stretch gap-[6px] px-[2px]">
                  <div className="h-2 self-center rounded-full bg-[#1CC88A]" style={{ width: `${(qualitySplit.h ?? 45) * rdP}%` }} />
                  <div className="h-2 self-center rounded-full bg-[#F59E0B]" style={{ width: `${(qualitySplit.m ?? 35) * rdP}%` }} />
                  <div className="h-2 self-center rounded-full bg-[#EF4444]" style={{ width: `${(qualitySplit.l ?? 20) * rdP}%` }} />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-6 text-[11px] text-[var(--muted)]">
                <span className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#1CC88A]" /> High: {(qualitySplit.h ?? 45).toFixed(0)}%
                </span>
                <span className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#F59E0B]" /> Medium: {(qualitySplit.m ?? 35).toFixed(0)}%
                </span>
                <span className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#EF4444]" /> Low: {(qualitySplit.l ?? 20).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          {/* Total Backlinks */}
          <div className="rounded-[14px] border border-[var(--border)] bg-[var(--input)] p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--input)] text-[var(--muted)]">
                  <Link2 size={16} />
                </span>
                <span className="text-[13px] text-gray-700 leading-relaxed">
                  Total Backlinks
                </span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#EEF0FF] px-2 py-0.5 text-[11px] font-medium text-[#4C53D8]">
                <span className="inline-block h-2 w-2 rounded-full bg-[#3B82F6]" />
                Strong Profile
              </span>
            </div>

            <div className="mt-3 flex items-end gap-2">
              <div className="text-[32px] font-semibold leading-none text-[var(--text)] tabular-nums">
                {formatCompactNumber(tbValue)}
              </div>
              <div className="ml-auto text-[12px] font-medium text-[#1BA97A]">↗︎ +8.4%</div>
            </div>

            <div className="mt-3 grid gap-3 text-[12px]">
              <div className="relative grid h-16 grid-cols-[1fr_auto] items-center rounded-[10px] border border-[var(--border)] bg-[var(--input)] px-3">
                <span className="absolute left-0 top-0 h-full w-[4px] rounded-l-[10px] bg-[#1CC88A]" />
                <div className="flex flex-col">
                  <div className="text-[var(--muted)]">DoFollow</div>
                  <div className="mt-0.5 text-[20px] font-semibold text-[var(--text)]">{selected?.dofollowPct ?? 78}%</div>
                </div>
                <div className="text-right text-[11px] text-[var(--muted)]">
                  Link that give <span className="font-medium text-[var(--text)]">SEO</span> credit
                </div>
              </div>

              <div className="relative grid h-16 grid-cols-[1fr_auto] items-center rounded-[10px] border border-[var(--border)] bg-[var(--input)] px-3">
                <span className="absolute left-0 top-0 h-full w-[4px] rounded-l-[10px] bg-[#EF4444]" />
                <div className="flex flex-col">
                  <div className="text-[var(--muted)]">NoFollow</div>
                  <div className="mt-0.5 text-[20px] font-semibold text-[var(--text)]">{selected?.nofollowPct ?? 22}%</div>
                </div>
                <div className="text-right text-[11px] text-[var(--muted)]">
                  Link that just mention, no <span className="font-medium text-[var(--text)]">SEO</span> value
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Row 2 */}
        <h2 className="text-[16px] font-bold text-[var(--text)] mb-3 ml-1">
          Technical SEO
        </h2>

        <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Site Health */}
          <div className="rounded-[14px] border border-[var(--border)] bg-[var(--input)] p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--input)] text-[#178A5D]">
                  <Activity size={16} />
                </span>
                <span className="flex items-center gap-1 text-[13px] text-gray-700 leading-relaxed">
                  Site Health Score
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF4FF] px-2 py-0.5 text-[11px] font-medium text-[#3178C6]">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#3B82F6]" />
                  Excellent
                </span>
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border)] text-[var(--muted)]">
                  <RefreshCw size={14} />
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-end gap-2">
              <div className="text-[32px] font-semibold leading-none text-[var(--text)] tabular-nums">
                {shValue.toFixed(1)}
              </div>
              <div className="pb-1 text-[13px] text-[var(--muted)]">/ 100</div>
            </div>

            <ul className="mt-3 space-y-2 text-[13px]">
              <li className="flex items-center justify-between rounded-[10px] border border-[#DFF1E7] bg-[var(--input)] px-3 py-3">
                <span className="flex items-center gap-2 text-[#178A5D]">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-md border border-[#DFF1E7] bg-[var(--input)]">
                    <Check size={14} />
                  </span>
                  Page Scanned
                </span>
                <span className="font-semibold text-[var(--text)] tabular-nums">{pagesScanned.toLocaleString()}</span>
              </li>

              <li className="flex items-center justify-between rounded-[10px] border border-[var(--border)] bg-[#FFF9EC] px-3 py-3">
                <span className="flex items-center gap-2 text-[#B67200]">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--input)]">
                    <AlertTriangle size={14} />
                  </span>
                  Redirect
                </span>
                <span className="font-semibold text-[var(--text)] tabular-nums">{redirects.toLocaleString()}</span>
              </li>

              <li className="flex items-center justify-between rounded-[10px] border border-[var(--border)] bg-[#FFF6F6] px-3 py-3">
                <span className="flex items-center gap-2 text-[#D12C2C]">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--input)]">
                    <X size={14} />
                  </span>
                  Broken
                </span>
                <span className="font-semibold text-[var(--text)] tabular-nums">{broken.toLocaleString()}</span>
              </li>
            </ul>
          </div>

          {/* Core Web Vitals */}
          <div className="rounded-[14px] border border-[var(--border)] bg-[var(--input)] p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[#FFE1EA] bg-[#FFF0F4] text-[#D12C2C]">
                  <Gauge size={16} />
                </span>
                <span className="flex items-center gap-1 text-[13px] text-gray-700 leading-relaxed">
                  Core web vitals
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF8F1] px-2 py-0.5 text-[11px] font-medium text-[#178A5D]">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#22C55E]" />
                  All Good
                </span>
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border)] text-[var(--muted)]">
                  <RefreshCw size={14} />
                </span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-[12px] border border-[var(--border)] bg-[var(--input)] p-4 text-center">
                <div className="mb-2 flex items-center justify-center gap-2 text-[12px] text-[var(--muted)]">
                  <Clock3 size={14} />
                  <span className="font-medium text-[var(--text)]">LCP</span>
                  <span className="ml-1 rounded-full bg-[#EAF8F1] px-2 py-0.5 text-[10px] font-medium text-[#178A5D]">Good</span>
                </div>
                <div className="text-[22px] font-semibold leading-none text-[var(--text)] tabular-nums">{lcp.toFixed(1)}s</div>
                <div className="mt-1 text-[11px] text-[var(--muted)]">&lt; 2.5s</div>
              </div>

              <div className="rounded-[12px] border border-[var(--border)] bg-[var(--input)] p-4 text-center">
                <div className="mb-2 flex items-center justify-center gap-2 text-[12px] text-[var(--muted)]">
                  <ActivitySquare size={14} />
                  <span className="font-medium text-[var(--text)]">INP</span>
                  <span className="ml-1 rounded-full bg-[#EAF8F1] px-2 py-0.5 text-[10px] font-medium text-[#178A5D]">Good</span>
                </div>
                <div className="text-[22px] font-semibold leading-none text-[var(--text)] tabular-nums">{Math.round(inp)}ms</div>
                <div className="mt-1 text-[11px] text-[var(--muted)]">&lt; 200ms</div>
              </div>

              <div className="rounded-[12px] border border-[var(--border)] bg-[var(--input)] p-4 text-center">
                <div className="mb-2 flex items-center justify-center gap-2 text-[12px] text-[var(--muted)]">
                  <Lock size={14} />
                  <span className="font-medium text-[var(--text)]">CLS</span>
                  <span className="ml-1 rounded-full bg-[#EAF8F1] px-2 py-0.5 text-[10px] font-medium text-[#178A5D]">Good</span>
                </div>
                <div className="text-[22px] font-semibold leading-none text-[var(--text)] tabular-nums">{cls.toFixed(2)}</div>
                <div className="mt-1 text-[11px] text-[var(--muted)]">&lt; 0.1</div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-center gap-1 text-[11px] text-[var(--muted)]">
              <span className="text-[#C5CBD6]">•</span> Data from{" "}
              <span className="font-semibold text-[var(--text)]">Page Speed Insights</span>
            </div>
          </div>

          {/* Page Speed Scores */}
          <div className="rounded-[14px] border border-[var(--border)] bg-[var(--input)] p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--input)] text-[#178A5D]">
                  <Rocket size={16} />
                </span>
                <span className="flex items-center gap-1 text-[13px] text-gray-700 leading-relaxed">Page Speed Scores</span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF4FF] px-2 py-0.5 text-[11px] font-medium text-[#3178C6]">
                <span className="inline-block h-2 w-2 rounded-full bg-[#3B82F6]" />
                Fast
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 place-items-center gap-6">
              <CircleGauge target={PS_DESKTOP} color="#3B82F6" label="Desktop" Icon={Monitor} progress={psProgress} />
              <CircleGauge target={PS_MOBILE} color="#8B5CF6" label="Mobile" Icon={Smartphone} progress={psProgress} />
            </div>

            <div className="mt-4 flex items-center justify-center gap-1 text-[11px] text-[var(--muted)]">
              <span className="text-[#C5CBD6]">•</span> Data from{" "}
              <span className="font-semibold text-[var(--text)]">Page Speed Insights</span>
            </div>
          </div>
        </section>

        {/* Row 3 */}
        <h2 className="text-[16px] font-bold text-[var(--text)] mb-3 ml-1">Performance (SEO Metrics)</h2>

        <section className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Organic Traffic */}
          <div className="rounded-[14px] border border-[var(--border)] bg-[var(--input)] p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--input)] text-[var(--muted)]">
                  <BarChart3 size={16} />
                </span>
                <span className="flex items-center gap-1 text-[13px] text-gray-700 leading-relaxed">Organic traffic</span>
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[#EAF8F1] px-2 py-0.5 text-[11px] font-medium text-[#178A5D]">
                  <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
                  Positive Growth
                </span>
              </div>
              <div className="inline-flex items-center gap-1 text-[11px] text-[var(--muted)]">
                All Devices <ChevronRight size={14} className="-rotate-90" />
              </div>
            </div>

            <div className="mt-3 flex items-end gap-2">
              <div className="text-[32px] font-semibold leading-none text-[var(--text)] tabular-nums">
                {otValue >= 1000 ? (otValue / 1000).toFixed(1) + "k" : Math.round(otValue)}
              </div>
              <div className="ml-1 inline-flex items-center gap-1 rounded-full bg-[#EAF8F1] px-2 py-0.5 text-[11px] font-medium text-[#178A5D]">
                ↗︎ +{selected?.organicTraffic?.growth ?? 23}
              </div>
            </div>

            {/* Simple animated line/area (kept) */}
            <div className="mt-4 h-28 w-full rounded-[10px]">
              <svg viewBox="0 0 520 140" className="h-full w-full">
                <defs>
                  <linearGradient id="ot-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22C55E" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
                  </linearGradient>
                  <mask id="ot-reveal" maskUnits="objectBoundingBox">
                    <rect x="0" y="0" width={`${otProg * 100}%`} height="100%" fill="#fff" />
                  </mask>
                </defs>
                <g mask="url(#ot-reveal)">
                  <path d="M 8 120 C 60 60, 110 85, 150 95 S 240 110, 270 88 S 350 60, 385 92 S 455 60, 512 20 L 512 140 L 8 140 Z" fill="url(#ot-fill)"/>
                  <path d="M 8 120 C 60 60, 110 85, 150 95 S 240 110, 270 88 S 350 60, 385 92 S 455 60, 512 20" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" pathLength="100" strokeDasharray="100" strokeDashoffset={100 - otProg * 100} />
                </g>
                <g fontFamily="ui-sans-serif, system-ui" fontSize="10" fill="#8D96A8" textAnchor="start">
                  <text x="500" y="18">+{selected?.organicTraffic?.growth ?? 23}</text>
                  <text x="500" y="54">18</text>
                  <text x="500" y="90">12</text>
                </g>
              </svg>
            </div>

            <div className="mt-3 flex justify-end">
              <button type="button" className="inline-flex items-center gap-1 rounded-[10px] border border-[var(--border)] bg-[var(--input)] px-3 py-2 text-[12px] font-medium text-[var(--muted)]">
                Connect to Google Analytics <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Organic Keywords */}
          <div className="rounded-[14px] border border-[var(--border)] bg-[var(--input)] p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[#FDE7B8] bg-[#FFF5D9] text-[#B98500]">
                  <KeyRound size={16} />
                </span>
                <span className="flex items-center gap-1 text-[13px] text-gray-700 leading-relaxed">Organic Keywords</span>
              </div>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] text-[var(--muted)]">
                <SquareArrowOutUpRight size={16} />
              </span>
            </div>

            <div className="mt-3 text-[32px] font-semibold leading-none text-[var(--text)] tabular-nums">
              {okValue >= 1000 ? (okValue / 1000).toFixed(1) + "k" : Math.round(okValue)}
            </div>

            <div className="mt-4 space-y-2">
              {[
                { label: "Top-3",   v: OK_SPLIT.top3,  t: OK_SPLIT.total, c: "#638CF1" },
                { label: "Top-10",  v: OK_SPLIT.top10, t: OK_SPLIT.total, c: "#F4B740" },
                { label: "Top-100", v: OK_SPLIT.top100,t: OK_SPLIT.total, c: "#22C55E" },
              ].map((row) => {
                const pct = row.v && row.t ? Math.round((row.v / row.t) * 100) : 0;
                return (
                  <div key={row.label} className="grid grid-cols-[88px_auto_1fr] items-center  gap-3 rounded-[10px] border border-[var(--border)] bg-[var(--input)] px-3 py-2 rounded-tr-2xl">
                    <span className="inline-flex items-center justify-center rounded-md bg-[var(--input)] px-2 py-1 text-[12px] text-[var(--muted)]">{row.label}</span>
                    <span className="text-[12px] font-semibold text-[var(--text)] tabular-nums">
                      {row.v ? (row.v >= 1000 ? (row.v/1000).toFixed(1)+"k" : row.v) : "—"}
                    </span>
                    <div className="h-2 w-full rounded-full bg-[var(--border)]">
                      <div className="h-2 rounded-full" style={{ width: `${pct * okProg}%`, backgroundColor: row.c, transition: "none" }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex justify-end">
              <button type="button" className="inline-flex items-center gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--input)] px-3 py-2 text-[12px] font-medium text-[var(--muted)]">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--input)]">
                  <FileText size={12} className="text-[#3178C6]" />
                </span>
                Connect to <span className="font-semibold text-[var(--text)]">Google Search Console</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Leads */}
          <div className="rounded-[14px] border border-[var(--border)] bg-[var(--input)] p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[#FFD8C7] bg-[#FFEFE8] text-[#D14B1F]">
                  <Goal size={16} />
                </span>
                <span className="flex items-center gap-1 text-[13px] text-gray-700 leading-relaxed">
                  Leads
                </span>
              </div>

              <div className="flex items-center gap-2">
                {(() => {
                  const g = selected?.leads?.growth;
                  const isNum = typeof g === "number" && !Number.isNaN(g);
                  const up = isNum ? g >= 0 : true;
                  const sign = isNum ? (up ? "+" : "−") : "+";
                  const pct = isNum ? Math.abs(g).toFixed(1) : "0.0";
                  const badgeClasses = up
                    ? "border border-[var(--border)] bg-[#EAF8F1] text-[#178A5D]"
                    : "border border-[var(--border)] bg-[#FFF6F6] text-[#D12C2C]";
                  return (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${badgeClasses}`}
                    >
                      {up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {sign} {pct} %
                    </span>
                  );
                })()}

                <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border)] text-[var(--muted)]">
                  <Settings size={14} />
                </span>
              </div>
            </div>

            {(() => {
              const formatNumber = (num) => {
                const v = Number(num) || 0;
                if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + "B";
                if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
                if (v >= 1_000) return (v / 1_000).toFixed(1) + "k";
                return Math.round(v).toString();
              };

              const totalLeadsAnimated = Math.max(0, Math.round(leadsCount));  // animated
              const goalLeads = LEADS_GOAL ?? 0;
              const cfLeads   = CF_VALUE ?? 0;
              const nlLeads   = NL_VALUE ?? 0;

              const cfPct = LEADS_TARGET ? Math.min(100, (cfLeads / LEADS_TARGET) * 100) : 0;
              const nlPct = LEADS_TARGET ? Math.min(100, (nlLeads / LEADS_TARGET) * 100) : 0;
              const goalPct = goalLeads ? Math.min(100, (totalLeadsAnimated / goalLeads) * 100) : 0;

              return (
                <>
                  {/* Total Leads (animated) */}
                  <div className="mt-3 text-[32px] font-semibold leading-none text-[var(--text)] tabular-nums">
                    {formatNumber(totalLeadsAnimated)}
                  </div>

                  {/* Goals */}
                  <div className="mt-2 flex items-center justify-between text-[12px]">
                    <span className="text-[var(--muted)]">
                      Goals{" "}
                      <span className="font-medium text-[var(--text)] tabular-nums">
                        {formatNumber(totalLeadsAnimated)} / {formatNumber(goalLeads)}
                      </span>
                    </span>
                    {goalLeads ? (
                      <span className="text-[var(--muted)]">
                        {Math.max(0, 100 - Math.round((totalLeadsAnimated / goalLeads) * 100))}% Remaining
                      </span>
                    ) : null}
                  </div>

                  {/* Progress bar (animated via leadsProg + changing width) */}
                  <div className="mt-2 h-2 w-full rounded-full bg-[var(--border)]">
                    {goalLeads ? (
                      <div
                        className="h-2 rounded-full bg-[#22C55E]"
                        style={{
                          width: `${goalPct}%`,
                          transition: "none",
                        }}
                      />
                    ) : null}
                  </div>

                  {/* Breakdown */}
                  <ul className="mt-4 space-y-3 text-[13px]">
                    {/* Contact Form */}
                    <li className="grid grid-cols-[1fr_auto_160px] items-center gap-3">
                      <span className="flex items-center gap-2 text-[var(--muted)]">
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#FAD7A5] bg-[#FFF6E7]">
                          <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
                        </span>
                        Contact form
                      </span>
                      <span className="font-semibold text-[var(--text)] tabular-nums">
                        {formatNumber(cfLeads)}
                      </span>
                      <div className="h-2 w-full rounded-full bg-[var(--border)]">
                        {LEADS_TARGET ? (
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${cfPct * (leadsProg || 1)}%`,
                              backgroundColor: "#F59E0B",
                              transition: "none",
                            }}
                          />
                        ) : null}
                      </div>
                    </li>

                    {/* Newsletter */}
                    <li className="grid grid-cols-[1fr_auto_160px] items-center gap-3">
                      <span className="flex items-center gap-2 text-[var(--muted)]">
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--input)]">
                          <span className="h-2 w-2 rounded-full bg-[#3B82F6]" />
                        </span>
                        Newsletter
                      </span>
                      <span className="font-semibold text-[var(--text)] tabular-nums">
                        {formatNumber(nlLeads)}
                      </span>
                      <div className="h-2 w-full rounded-full bg-[var(--border)]">
                        {LEADS_TARGET ? (
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${nlPct * (leadsProg || 1)}%`,
                              backgroundColor: "#3B82F6",
                              transition: "none",
                            }}
                          />
                        ) : null}
                      </div>
                    </li>
                  </ul>
                </>
              );
            })()}

            <div className="mt-3 text-right text-[12px] text-[var(--muted)]">
              <button type="button" className="inline-flex items-center gap-1">
                Change Goals <ChevronRight size={14} />
              </button>
            </div>
          </div>
          </section>

        {/* Row 4 */}
        <h2 className="text-[16px] font-bold text-[var(--text)] mb-3 ml-1">Advance SEO metrics</h2>

        <section className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* SERP feature */}
          <div className="rounded-[14px] border border-[var(--border)] bg-[var(--input)] p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[#FDE7B8] bg-[#FFF5D9] text-[#B98500]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 3l2.2 5.1 5.6.5-4.2 3.7 1.3 5.5L12 14.9 7.1 17.8l1.3-5.5-4.2-3.7 5.6-.5L12 3z" fill="#F4B740"/>
                  </svg>
                </span>
                <span className="text-[13px] text-gray-700 leading-relaxed">SERP feature</span>
              </div>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] text-[var(--muted)]">
                <SlidersHorizontal size={16} />
              </span>
            </div>

            <div className="mt-4 flex items-baseline gap-3">
              <div className="text-[40px] font-bold leading-none tracking-tight text-[var(--text)] tabular-nums">
                {Math.round(serpCoverage)}<span className="align-top text-[28px]">%</span>
              </div>
              <div className="text-[14px] text-[var(--muted)]">coverage</div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between rounded-[12px] border border-[var(--border)] bg-[var(--input)] px-3 py-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[#FFF5D9] border border-[#FDE7B8]">
                    <svg width="12" height="12" viewBox="0 0 24 24"><path d="M12 3l2.2 5.1 5.6.5-4.2 3.7 1.3 5.5L12 14.9 7.1 17.8l1.3-5.5-4.2-3.7 5.6-.5L12 3z" fill="#F4B740"/></svg>
                  </span>
                  <span className="text-[13px] text-[var(--text)]">Featured Snippet</span>
                </div>
                <span className="text-[13px] font-semibold text-[var(--text)] tabular-nums">{serpCounts[0]}</span>
              </div>

              <div className="flex items-center justify-between rounded-[12px] border border-[var(--border)] bg-[var(--input)] px-3 py-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[#EAF4FF] border border-[var(--border)]">
                    <svg width="12" height="12" viewBox="0 0 24 24"><path d="M12 3l2.2 5.1 5.6.5-4.2 3.7 1.3 5.5L12 14.9 7.1 17.8l1.3-5.5-4.2-3.7 5.6-.5L12 3z" fill="#3B82F6"/></svg>
                  </span>
                  <span className="text-[13px] text-[var(--text)]">People Also Ask</span>
                </div>
                <span className="text-[13px] font-semibold text-[var(--text)] tabular-nums">{serpCounts[1]}</span>
              </div>

              <div className="flex items-center justify-between rounded-[12px] border border-[var(--border)] bg-[var(--input)] px-3 py-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[#EAF8F1] border border-[var(--border)]">
                    <svg width="12" height="12" viewBox="0 0 24 24"><path d="M12 3l2.2 5.1 5.6.5-4.2 3.7 1.3 5.5L12 14.9 7.1 17.8l1.3-5.5-4.2-3.7 5.6-.5L12 3z" fill="#22C55E"/></svg>
                  </span>
                  <span className="text-[13px] text-[var(--text)]">Image Pack</span>
                </div>
                <span className="text-[13px] font-semibold text-[var(--text)] tabular-nums">{serpCounts[2]}</span>
              </div>

              <div className="flex items-center justify-between rounded-[12px] border border-[var(--border)] bg-[var(--input)] px-3 py-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[#FFF0F4] border border-[#FFE1EA]">
                    <svg width="12" height="12" viewBox="0 0 24 24"><path d="M12 3l2.2 5.1 5.6.5-4.2 3.7 1.3 5.5L12 14.9 7.1 17.8l1.3-5.5-4.2-3.7 5.6-.5L12 3z" fill="#D12C2C"/></svg>
                  </span>
                  <span className="text-[13px] text-[var(--text)]">Video Result</span>
                </div>
                <span className="text-[13px] font-semibold text-[var(--text)] tabular-nums">{serpCounts[3]}</span>
              </div>

              <div className="flex items-center justify-between rounded-[12px] border border-[var(--border)] bg-[var(--input)] px-3 py-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[#F5EAFE] border border-[#E7D7FB]">
                    <svg width="12" height="12" viewBox="0 0 24 24"><path d="M12 3l2.2 5.1 5.6.5-4.2 3.7 1.3 5.5L12 14.9 7.1 17.8l1.3-5.5-4.2-3.7 5.6-.5L12 3z" fill="#8B5CF6"/></svg>
                  </span>
                  <span className="text-[13px] text-[var(--text)]">Knowledge Pannel</span>
                </div>
                <span className="text-[13px] font-semibold text-[var(--text)] tabular-nums">{serpCounts[4]}</span>
              </div>
            </div>
          </div>

          {/* Ai SEO Matrix (dynamic from JSON) */}
{/* Ai SEO Matrix (dynamic from JSON) */}
<div className="rounded-[14px] border border-[var(--border)] bg-[var(--input)] p-4 shadow-sm">
  <div className="flex items-start justify-between">
    <div className="flex items-center gap-2">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[#FDE7B8] bg-[#FFF5D9] text-[#B98500]">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 3l2.2 5.1 5.6.5-4.2 3.7 1.3 5.5L12 14.9 7.1 17.8l1.3-5.5-4.2-3.7 5.6-.5L12 3z" fill="#F4B740"/>
        </svg>
      </span>
      <span className="text-[13px] text-gray-700 leading-relaxed">Ai SEO Matrix</span>
    </div>
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] text-[var(--muted)]">
      <SlidersHorizontal size={16} />
    </span>
  </div>

  {(() => {
    const ai = selected?.aiTools || {};
    const fmt = (num) => {
      const v = Number(num);
      if (!Number.isFinite(v)) return "—";
      if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + "B";
      if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
      if (v >= 1_000) return (v / 1_000).toFixed(1) + "k";
      return Math.round(v).toString();
    };

    const tools = [
      { name: "GPT",        rating: ai.GPT?.rating,        pages: ai.GPT?.pages,        src: ai.GPT?.src },
      { name: "Google AI",  rating: ai.GoogleAI?.rating,   pages: ai.GoogleAI?.pages,   src: ai.GoogleAI?.src },
      { name: "Perplexity", rating: ai.Perplexity?.rating, pages: ai.Perplexity?.pages, src: ai.Perplexity?.src },
      { name: "Copilot",    rating: ai.Copilot?.rating,    pages: ai.Copilot?.pages,    src: ai.Copilot?.src },
      { name: "Gemini",     rating: ai.Gemini?.rating,     pages: ai.Gemini?.pages,     src: ai.Gemini?.src },
    ];

    return (
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-5">
        {tools.map((tool) => (
          <div key={tool.name} className="rounded-[12px] border border-[var(--border)] bg-[var(--input)] p-4 text-center">
            <Image src={tool.src || "/assets/placeholder.svg"} alt={tool.name} width={36} height={36} className="mx-auto mb-2" />
            <div className="text-[12px] text-[var(--muted)]">{tool.name}</div>
            <div className="mt-1 text-[22px] font-semibold leading-none text-[var(--text)] tabular-nums">
              {Number.isFinite(tool.rating) ? tool.rating : "—"}
              <span className="text-[var(--muted)]">/5</span>
            </div>
            <div className="mt-1 text-[11px] text-[var(--muted)]">{fmt(tool.pages)} Pages</div>
          </div>
        ))}
      </div>
    );
  })()}

  <div className="mt-4 text-[12px] text-[var(--muted)]">
    AI tool visibility and optimization scores
  </div>
</div>
</section>

        {/* On-Page SEO Opportunities — cards */}
        <h2 className="text-[16px] font-bold text-[var(--text)] mb-3 ml-1">On-Page SEO Opportunities</h2>
        {/* On-Page SEO Opportunities — cards */}
        

        <section className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Critical Issue */}
          <div className="flex items-center justify-between rounded-[18px] border border-[#E7EAF0] bg-[var(--input)] px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex shrink-0 aspect-square h-10 w-10 items-center justify-center rounded-full bg-[#EF3E5C] text-white">
                <Skull size={20} />
              </span>
              <div className="leading-tight">
                <div className="text-[11px] text-[var(--muted)]">Critical Issue</div>
                <div className="mt-0.5 text-[20px] font-extrabold leading-none text-[var(--text)] tabular-nums">
                  {oppCounts[0]}
                </div>
                <div className="mt-1 text-[11px] font-medium text-[#DC2626] whitespace-nowrap">
                  32% more since last month
                </div>
              </div>
            </div>
            <button className="ml-4 inline-flex items-center gap-1 text-[11px] font-medium text-[#8D96A8] shrink-0 whitespace-nowrap">
              Fix Now <ChevronRight size={12} />
            </button>
          </div>

          {/* Card 2: Waring Issue */}
          <div className="flex items-center justify-between rounded-[18px] border border-[#E7EAF0] bg-[var(--input)] px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex shrink-0 aspect-square h-10 w-10 items-center justify-center rounded-full bg-[#F59E0B] text-white">
                <AlertTriangle size={20} />
              </span>
              <div className="leading-tight">
                <div className="text-[11px] text-[var(--muted)]">Waring Issue</div>
                <div className="mt-0.5 text-[20px] font-extrabold leading-none text-[var(--text)] tabular-nums">
                  {oppCounts[1]}
                </div>
                <div className="mt-1 text-[11px] font-medium text-[#DC2626] whitespace-nowrap">
                  32% more since last month
                </div>
              </div>
            </div>
            <button className="ml-4 inline-flex items-center gap-1 text-[11px] font-medium text-[#8D96A8] shrink-0 whitespace-nowrap">
              Fix Now <ChevronRight size={12} />
            </button>
          </div>

          {/* Card 3: Recommendations */}
          <div className="flex items-center justify-between rounded-[18px] border border-[#E7EAF0] bg-[var(--input)] px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#10B981] text-white">
                <Lightbulb size={20} />
              </span>
              <div className="leading-tight">
                <div className="text-[11px] text-[var(--muted)]">Recommendations</div>
                <div className="mt-0.5 text-[20px] font-extrabold leading-none text-[var(--text)] tabular-nums">
                  {oppCounts[2]}
                </div>
                <div className="mt-1 text-[11px] font-medium text-[#16A34A] whitespace-nowrap">
                  +23%<span className="text-[var(--muted)]">{' '}since last month</span>
                </div>
              </div>
            </div>
            <button className="ml-4 inline-flex items-center gap-1 text-[11px] font-medium text-[#8D96A8] shrink-0 whitespace-nowrap">
              View All <ChevronRight size={12} />
            </button>
          </div>

          {/* Card 4: Content Opportunities */}
          <div className="flex items-center justify-between rounded-[18px] border border-[#E7EAF0] bg-[var(--input)] px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#3B82F6] text-white">
                <FileText size={18} />
              </span>
              <div className="leading-tight">
                <div className="text-[11px] text-[var(--muted)]">Content Opportunities</div>
                <div className="mt-0.5 text-[20px] font-extrabold leading-none text-[var(--text)] tabular-nums">
                  {oppCounts[3]}
                </div>
                <div className="mt-1 text-[11px] font-medium text-[#DC2626] whitespace-nowrap">
                  -32%<span className="text-[var(--muted)]">{' '}since last month</span>
                </div>
              </div>
            </div>
            <button className="ml-4 inline-flex items-center gap-1 text-[11px] font-medium text-[#8D96A8] shrink-0 whitespace-nowrap">
              View All <ChevronRight size={12} />
            </button>
          </div>
        </section>

<h2 className="text-[16px] font-bold text-[var(--text)] mb-3 ml-1">Top On-Page Content Opportunities</h2>
<section className="mb-10 grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)]">
  {/* BLOG column */}
  <div className="grid grid-rows-[auto_1fr_auto] gap-3">
    {/* header */}
    <div className="flex items-center gap-2">
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-[#E7D7FB] bg-[#F5EAFE] text-[#7C3AED]">
        <BookOpen size={14} />
      </span>
      <span className="text-[12px] font-semibold tracking-wide text-[var(--text)]">BLOG</span>
      <HelpCircle size={14} className="text-[#9AA3B2]" />
    </div>

    {/* cards */}
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 items-stretch">
      {blogCards.slice(0, 2).map((b, i) => (
        <OpportunityCard
          key={`blog-${i}`}
          title={b.title}
          score={b.score ?? 0}
          wordCount={b.wordCount ?? 0}
          keywords={b.keywords ?? 0}
          status={b.status ?? "Draft"}
          progress={oppCardsProgress}
          className="h-full"
        />
      ))}
    </div>

    {/* view all pinned to bottom */}
    <div className="flex justify-end pt-1 px-4">
      <button className="inline-flex items-center gap-2 rounded-[12px] border px-3 py-2 text-[12px] font-medium seo-chip">
        View all opportunity <ChevronRight size={14} />
      </button>
    </div>
  </div>

  {/* vertical divider */}
  <div className="hidden lg:block w-px self-stretch bg-[#ECEFF5]" />

  {/* PAGES column */}
  <div className="grid grid-rows-[auto_1fr_auto] gap-3">
    {/* header */}
    <div className="flex items-center gap-2">
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-[#FFD6E8] bg-[#FFE9F3] text-[#F43F5E]">
        <FileText size={14} />
      </span>
      <span className="text-[12px] font-semibold tracking-wide text-[var(--text)]">PAGES</span>
      <HelpCircle size={14} className="text-[#9AA3B2]" />
    </div>

    {/* cards */}
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      {pageCards.slice(0, 2).map((p, i) => (
        <OpportunityCard
          key={`page-${i}`}
          title={p.title}
          score={p.score ?? 0}
          wordCount={p.wordCount ?? 0}
          keywords={p.keywords ?? 0}
          status={p.status ?? "Draft"}
          progress={oppCardsProgress}
          className="h-full"
        />
      ))}
    </div>

    {/* view all pinned to bottom */}
    <div className="flex justify-end pt-1 px-4">
      <button className="inline-flex items-center gap-2 rounded-[12px] border px-3 py-2 text-[12px] font-medium seo-chip">
        View all opportunity <ChevronRight size={14} />
      </button>
    </div>
  </div>
</section>

    

{/* New on page SEO opportunity (table) */}
<h2 className="text-[16px] font-bold text-[var(--text)] mb-2 ml-1">New on page SEO opportunity</h2>
<p className="ml-1 mb-4 text-[12px] text-[var(--muted)]">
  *While it’s highly recommended to follow the AI’s suggested plan for optimal results,
  feel free to generate content based on your personal choice.
</p>

<div className="overflow-hidden rounded-[16px] border border-[var(--border)] bg-[var(--input)] shadow-sm">
  <div className="hidden md:grid grid-cols-[2.1fr_1.4fr_1.2fr_1.5fr_1.3fr_1fr_1fr_1.8fr] items-center px-4 py-3 text-[12px] font-semibold text-[var(--muted)] bg-[var(--input)] text-center">
    <div className="text-left">Keywords</div>
    <div>Type <span className="opacity-50">↑↓</span></div>
    <div>Search Volume</div>
    <div>SEO Difficulty</div>
    <div>Suggested topic</div>
    <div>Blog</div>
    <div>Page</div>
    <div>Preference</div>
  </div>

  <ul className="divide-y divide-[#ECEFF5]">
    {(seoRowsFromData ?? [
      { keyword: "How to fix slow Wi-Fi", type: "Informational", volume: 7032, difficulty: 98 },
      { keyword: "How to fix slow Wi-Fi", type: "Informational", volume: 7032, difficulty: 88 },
      { keyword: "How to fix slow Wi-Fi", type: "Transactional", volume: 7032, difficulty: 98 },
      { keyword: "How to fix slow Wi-Fi", type: "Informational", volume: 7032, difficulty: 28 },
      { keyword: "How to fix slow Wi-Fi", type: "Transactional", volume: 7032, difficulty: 28 },
      { keyword: "How to fix slow Wi-Fi", type: "Transactional", volume: 7032, difficulty: 68 },
      { keyword: "How to fix slow Wi-Fi", type: "Informational", volume: 7032, difficulty: 48 },
    ]).map((row, i) => (
      <li
        key={i}
        className="grid grid-cols-1 md:grid-cols-[2.1fr_1.4fr_1.2fr_1.5fr_1.3fr_1fr_1fr_1.8fr] items-center gap-3 px-4 py-3 text-[13px] hover:bg-[var(--input)] text-center"
      >
        <div className="flex items-center gap-2 text-[var(--text)] justify-start">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--input)] text-[var(--muted)]">
            <Wifi size={14} />
          </span>
          <span className="truncate">{row.keyword}</span>
        </div>

        <div>
          <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] px-2 py-0.5 text-[11px] seo-badge-light">
            {row.type === "Informational" ? <FileText size={12} /> : <Link2 size={12} />}
            {row.type}
          </span>
        </div>

        <div className="tabular-nums text-[var(--text)]">
          {Number(row.volume).toLocaleString()}
        </div>

        <div className="flex items-center gap-2 text-[var(--text)] justify-start">
          <span className="tabular-nums">{row.difficulty}%</span>
          <DifficultyBar value={row.difficulty} progress={seoTableProg} />
        </div>

        <div className="text-[var(--text)] truncate text-center">
          {row.suggested ?? "—"}
        </div>

        <div className="flex justify-center">
          <button className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--input)] px-4 py-1.5 text-[12px] font-semibold text-[#3178C6]">
            Generate
          </button>
        </div>

        <div className="flex justify-center">
          <button className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--input)] px-4 py-1.5 text-[12px] font-semibold text-[#3178C6]">
            Generate
          </button>
        </div>

        <div className="flex items-center justify-center gap-3 text-[var(--muted)]">
          <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] px-2 py-0.5 text-[11px] seo-badge-light">
            {row.preference ?? "—"}
          </span>
          {/* replaced plain icons with interactive LikeDislike */}
          <LikeDislike />
        </div>
      </li>
    ))}
  </ul>

  <div className="flex justify-end border-t border-[var(--border)] bg-[var(--input)] px-4 py-3">
    <button className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--input)] px-3 py-1.5 text-[12px] text-[var(--muted)] hover:bg-[var(--input)]">
      View all page issue <ChevronRight size={14} />
    </button>
  </div>
</div>

      </div>
    </main>
  );
}