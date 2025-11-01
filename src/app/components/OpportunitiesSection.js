// src/components/OpportunitiesSection.js
"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  BookOpen,
  FileText,
  ChevronRight,
  Eye,
  Check,
  PencilLine,
  X,
} from "lucide-react";

/* ============================================================
   Helpers (only what's needed for Opportunities)
============================================================ */

// Generic titles for cards (UI only)
const GENERIC_CARD_TITLES = [
  "How to Improve Site Speed",
  "Complete Local SEO Guide",
  "Content Strategy Basics",
  "Beginner’s Guide to SEO",
];

const STORAGE_DOMAIN_KEYS = [
  "websiteData",
  "site",
  "website",
  "selectedWebsite",
  "drfizzm.site",
  "drfizzm.website",
];

const normalizeDomain = (input = "") => {
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
};

function getSiteFromStorageOrQuery(searchParams) {
  const qp = searchParams?.get?.("site");
  if (qp) return normalizeDomain(qp);
  try {
    for (const store of [localStorage, sessionStorage]) {
      for (const k of STORAGE_DOMAIN_KEYS) {
        const v = store.getItem(k);
        if (!v) continue;
        try {
          const o = JSON.parse(v);
          const cands = [o?.site, o?.website, o?.url, o?.domain, o?.value];
          for (const c of cands) if (c) return normalizeDomain(String(c));
        } catch {
          return normalizeDomain(v);
        }
      }
    }
  } catch {}
  return "example.com";
}

function mapRowToSchema(row) {
  const n = (x, d = undefined) => {
    if (typeof x === "number" && Number.isFinite(x)) return x;
    if (typeof x === "string") {
      const v = Number(x.replace?.(/[, ]/g, "") ?? x);
      if (Number.isFinite(v)) return v;
    }
    return d;
  };
  const s = (x, d = undefined) => (typeof x === "string" ? x : d);

  return {
    domain: normalizeDomain(s(row["Domain/Website"], s(row["Domain"], ""))),
    content: {
      blog: [
        {
          title: s(row["Blog1_Title"], "Untitled"),
          priority: s(row["Blog1_Priority"], "Medium Priority"),
          wordCount: n(row["Blog1_Word_Count"], 0),
          keywords: n(row["Blog1_Num_Keywords"], 0),
          score: n(row["Blog1_Score"], 0),
          status: s(row["Blog1_Status"], "Draft"),
          content: s(row["Blog1_Content"], ""),
        },
        {
          title: s(row["Blog2_Title"], "Untitled"),
          priority: s(row["Blog2_Priority"], "Medium Priority"),
          wordCount: n(row["Blog2_Word_Count"], 0),
          keywords: n(row["Blog2_Num_Keywords"], 0),
          score: n(row["Blog2_Score"], 0),
          status: s(row["Blog2_Status"], "Draft"),
          content: s(row["Blog2_Content"], ""),
        },
      ],
      pages: [
        {
          title: s(row["Page1_Title"], "Untitled"),
          priority: s(row["Page1_Priority"], "Medium Priority"),
          wordCount: n(row["Page1_Word_Count"], 0),
          keywords: n(row["Page1_Num_Keywords"], 0),
          score: n(row["Page1_Score"], 0),
          status: s(row["Page1_Status"], "Draft"),
          content: s(row["Page1_Content"], ""),
        },
        {
          title: s(row["Page2_Title"], "Untitled"),
          priority: s(row["Page2_Priority"], "Medium Priority"),
          wordCount: n(row["Page2_Word_Count"], 0),
          keywords: n(row["Page2_Num_Keywords"], 0),
          score: n(row["Page2_Score"], 0),
          status: s(row["Page2_Status"], "Draft"),
          content: s(row["Page2_Content"], ""),
        },
      ],
    },
  };
}

/* ============================================================
   Start Modal (exact UX kept)
============================================================ */

function StartModal({
  open,
  onClose,
  onCreateFromScratch,
  onEditExisting,
  onCreateWithStyle,
}) {
  const STYLES = [
    {
      id: "wander",
      title: "Wander & Wonder",
      desc: "A journal of curious thoughts, quiet travels, and unexpected discoveries.",
    },
    {
      id: "bytesized",
      title: "ByteSized Mind",
      desc: "Quick, sharp takes on tech, life, and learning. Small posts, big ideas—delivered fresh.",
    },
    {
      id: "lazycompass",
      title: "The Lazy Compass",
      desc: "Travel stories for slow movers and deep thinkers. Wander less, feel more.",
    },
  ];
  const [hover, setHover] = useState(STYLES[0].id);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/40">
      <div className="relative grid w-[980px] grid-cols-2 overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* Left side (banner) */}
        <div
          className="relative flex min-h-[520px] flex-col justify-end p-10"
          style={{
            background:
              "radial-gradient(520px 220px at -8% 70%, #FAD7A5 0%, transparent 65%), #FFF9F2",
          }}
        >
          <div className="pointer-events-none select-none">
            <div className="text-[56px] font-extrabold leading-[0.95] tracking-tight text-[#0F172A]">
              CREATE,<br />OPTIMIZE &<br />PUBLISH
            </div>
            <div className="mt-4 text-[15px] text-[#6B7280]">No tab-hopping required.</div>
          </div>
        </div>

        {/* Right side (list) */}
        <div className="flex flex-col bg-[#FAFAFA] p-6">
          <div className="text-xl font-semibold text-[#0F172A]">Blogs</div>
          <div className="mt-1 text-[12px] text-[#6B7280]">Select any 1 to create with that style</div>

          <div className="mt-3 space-y-3 rounded-2xl border border-gray-200 bg-white/60 p-3">
            {STYLES.map((s) => (
              <button
                key={s.id}
                onMouseEnter={() => setHover(s.id)}
                onClick={() => {
                  setHover(s.id);
                  onCreateWithStyle(s.id);
                }}
                className={`flex w-full items-center justify-between rounded-2xl p-4 text-left transition
                ${hover === s.id ? "bg-white shadow ring-1 ring-black/5" : "hover:bg-white"}`}
                aria-pressed={hover === s.id}
                title="Click to create a new blog with this style"
              >
                <div>
                  <div className="font-semibold text-[#0F172A]">{s.title}</div>
                  <div className="mt-1 max-w-[380px] text-[12px] leading-relaxed text-[#6B7280]">
                    {s.desc}
                  </div>
                </div>
                <div className="h-16 w-28 rounded-xl bg-gray-200/70" />
              </button>
            ))}
          </div>

          <div className="mt-auto flex items-center justify-between pt-6">
            <button
              onClick={onCreateFromScratch}
              className="text-[13px] font-medium text-[#0F172A] underline underline-offset-2"
            >
              Create from scratch
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={onEditExisting}
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-[13px] font-semibold text-[#0F172A] hover:bg-gray-50"
              >
                Edit existing page / blog
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Opportunities Section
============================================================ */

export default function OpportunitiesSection({ onOpenContentEditor }) {
  const searchParams = useSearchParams();
  const [domain, setDomain] = useState("example.com");
  const [rows, setRows] = useState(null);
  const [prog, setProg] = useState(0);

  // Modal state
  const [startOpen, setStartOpen] = useState(false);
  const startPayloadRef = useRef(null); // keep real title/kind for "Edit existing"

  useEffect(() => {
    setDomain(getSiteFromStorageOrQuery(searchParams));
  }, [searchParams]);

  // Load seo-data.json (array)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/data/seo-data.json", { cache: "no-store" });
        const json = await res.json();
        if (alive && Array.isArray(json)) setRows(json.map(mapRowToSchema));
      } catch (e) {
        console.error("Failed to load /data/seo-data.json", e);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const selected = useMemo(() => {
    if (!rows?.length) return null;
    const key = normalizeDomain(domain);
    return rows.find((r) => r.domain === key) || null;
  }, [rows, domain]);

  // Score tick animation for cards
  useEffect(() => {
    if (!rows) return;
    let raf;
    const t0 = performance.now();
    const dur = 900;
    const tick = (t) => {
      const p = Math.min(1, Math.max(0, (t - t0) / dur));
      const ease = 1 - Math.pow(1 - p, 3);
      setProg(ease);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [rows]);

  const blogCards = selected?.content?.blog ?? [];
  const pageCards = selected?.content?.pages ?? [];

  /* ---------- Start Flow helpers ---------- */

  const styleTemplate = useCallback((id) => {
    if (id === "wander")
      return {
        title: "Wander & Wonder — New Post",
        content:
          "<h1>Wander & Wonder</h1><p>A journal of curious thoughts, quiet travels, and unexpected discoveries.</p><h2>Opening</h2><p>Share a quiet observation or a poetic snapshot.</p><h2>Reflection</h2><p>Connect a place with an idea.</p><h2>Closing</h2><p>Invite the reader to slow down.</p>",
      };
    if (id === "bytesized")
      return {
        title: "ByteSized Mind — Quick Take",
        content:
          "<h1>ByteSized Mind</h1><ul><li>One strong idea</li><li>One practical tip</li><li>One link to explore</li></ul>",
      };
    if (id === "lazycompass")
      return {
        title: "The Lazy Compass — Field Notes",
        content:
          "<h1>The Lazy Compass</h1><h2>Route</h2><p>Where are we going?</p><h2>Texture</h2><p>What does it feel like?</p><h2>Keepsake</h2><p>A takeaway for the reader.</p>",
      };
    return { title: "Untitled", content: "" };
  }, []);

  const dispatchOpen = (payload) => {
    try {
      window.dispatchEvent(new CustomEvent("content-editor:open", { detail: payload }));
    } catch {}
    onOpenContentEditor?.(payload);
  };

  const dispatchNew = (payload = {}) => {
    try {
      window.dispatchEvent(new CustomEvent("content-editor:new", { detail: payload }));
    } catch {}
    onOpenContentEditor?.(payload);
  };

  const handleEditExisting = () => {
    const real = startPayloadRef.current || {};
    // open with the real title so ContentEditor resolves pageConfig from contenteditor.json
    dispatchOpen({ title: real.title, kind: real.kind || "blog" });
    setStartOpen(false);
  };

  const handleCreateFromScratch = () => {
    // Force a clean new doc; CE listens for 'content-editor:new'
    dispatchNew({ title: "Untitled Document", kind: "blog", content: "" });
    setStartOpen(false);
  };

 const handleCreateWithStyle = (styleId) => {
   const tpl = styleTemplate(styleId);
   // New doc seeded with content & styleId (CE can read it if needed)
   dispatchNew({ ...tpl, kind: "blog", styleId });
   setStartOpen(false);
 };

  /* ---------- Small UI pieces ---------- */

  function PriorityBadge({ score }) {
    const v = Number(score) || 0;
    const cfg =
      v <= 30
        ? { label: "High Priority", bg: "#FFF0F4", br: "#FFE1EA", dot: "#EF4444", txt: "#D12C2C" }
        : v <= 70
        ? { label: "Medium Priority", bg: "#FFF5D9", br: "#FDE7B8", dot: "#F59E0B", txt: "#B98500" }
        : { label: "Low Priority", bg: "#EAF8F1", br: "#CBEBD9", dot: "#22C55E", txt: "#178A5D" };
    return (
      <span
        className="inline-flex items-center gap-2 rounded-[10px] px-2.5 py-1 text-[12px] font-medium"
        style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.br}`, color: cfg.txt }}
      >
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
        {cfg.label}
      </span>
    );
  }

  function OpportunityCard({ type, index, data }) {
    const score = data?.score ?? 0;
    const wc = data?.wordCount ?? 0;
    const kws = data?.keywords ?? 0;
    const status = data?.status ?? "Draft";
    // generic title for UI, keep realTitle for payload
    const displayTitle =
      GENERIC_CARD_TITLES[index % GENERIC_CARD_TITLES.length] || "SEO Opportunity";
    const realTitle = data?.title;

    return (
      <div className="relative rounded-[18px] border border-[var(--border)] bg-[var(--input)] p-4 shadow-sm">
        <div className="group absolute right-4 top-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full text-[14px] font-semibold shadow-sm tabular-nums bg-[#FFF5D9] border border-[#FDE7B8] text-[#B98500]">
            {Math.round(score * prog)}
          </div>
        </div>

        <div className="pr-14">
          <h3 className="text-[20px] font-semibold leading-snug text-[var(--text)]">
            {displayTitle}
          </h3>
        </div>

        <hr className="mt-3 border-t border-[var(--border)]" />

        <div className="mt-3 flex items-center gap-2">
          <PriorityBadge score={score} />
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
                {wc.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[12px] text-[var(--muted)]">Keywords</div>
              <div className="mt-1 text-[28px] font-semibold leading-none text-[var(--text)] tabular-nums">
                {kws}
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
              startPayloadRef.current = { kind: type, title: realTitle };
              setStartOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-[14px] px-4 py-2 text-[13px] font-semibold text-white shadow-sm bg-[image:var(--infoHighlight-gradient)] hover:opacity-90 transition"
          >
            Start <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  /* ============================================================
     UI — Opportunities grid + Start modal
  ============================================================ */

  return (
    <>
      <h2 className="mb-3 ml-1 text-[16px] font-bold text-[var(--text)]">
        Top On-Page Content Opportunities
      </h2>

      <section className="mb-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-[16px] border border-[var(--border)] bg-[var(--input)] p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-[#FDE7B8] bg-[#FFF5D9] text-[#B98500]">
              <BookOpen size={14} />
            </span>
            <span className="text-[13px] font-semibold">BLOG</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {(blogCards.length ? blogCards.slice(0, 2) : [{}, {}]).map((b, i) => (
              <OpportunityCard key={`b-${i}`} type="blog" index={i} data={b} />
            ))}
          </div>
        </div>

        <div className="rounded-[16px] border border-[var(--border)] bg-[var(--input)] p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-[#D1FAE5] bg-[#EAF8F1] text-[#178A5D]">
              <FileText size={14} />
            </span>
            <span className="text-[13px] font-semibold">PAGES</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {(pageCards.length ? pageCards.slice(0, 2) : [{}, {}]).map((p, i) => (
              <OpportunityCard key={`p-${i}`} type="page" index={i} data={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Start modal */}
      <StartModal
        open={startOpen}
        onClose={() => setStartOpen(false)}
        onCreateFromScratch={handleCreateFromScratch}
        onEditExisting={handleEditExisting}
        onCreateWithStyle={handleCreateWithStyle}
      />
    </>
  );
}
