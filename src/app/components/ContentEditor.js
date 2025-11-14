// components/ContentEditor.js
"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import dynamic from "next/dynamic";
import CENavbar from "./content-editor/CE.Navbar";
import CEMetricsStrip from "./content-editor/CE.MetricsStrip";
import CEContentArea from "./content-editor/CE.ContentArea";
import { AlertTriangle, X } from "lucide-react";

/* utils */
function isBlankHtml(html) {
  if (!html) return true;
  return (
    String(html).replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim() === ""
  );
}
const norm = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();

/** Tell Research panel to reset and clear any persisted UI state it may use. */
function broadcastResearchReset(nextQuery = "") {
  try {
    localStorage.removeItem("research-panel-state");
    localStorage.removeItem("research:lastHost");
    localStorage.removeItem("research:lastKeyword");
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent("research:reset"));
    window.dispatchEvent(
      new CustomEvent("content-editor:query-changed", {
        detail: { query: nextQuery },
      })
    );
  } catch {}
}

/** Lazy-load the Research panel so it only runs when opened (mobile). */
const CEResearchPanel = dynamic(
  () => import("./content-editor/CE.ResearchPanel"),
  { ssr: false }
);

export default function ContentEditor({ data, onBackToDashboard }) {
  /* load contenteditor.json (optional for downstream comps) */
  const [config, setConfig] = useState(null);
  const [configError, setConfigError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/data/contenteditor.json", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (mounted) setConfig(json);
      } catch (e) {
        if (mounted) setConfigError(String(e));
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  /* page config lookup */
  const pageKey =
    data?.slug || data?.page || data?.id || norm(data?.title) || "";
  const pageConfig = useMemo(() => {
    if (!config?.pages?.length) return null;
    let hit =
      config.pages.find((p) => norm(p.slug) === norm(pageKey)) ||
      config.pages.find((p) => norm(p.id) === norm(pageKey));
    if (!hit && data?.title) {
      hit = config.pages.find((p) => norm(p.title) === norm(data.title));
    }
    return hit || config.pages[0] || null;
  }, [config, pageKey, data?.title]);

  /* editor state */
  const [title, setTitle] = useState(data?.title || "Untitled");
  const [content, setContent] = useState(
    typeof data?.content === "string" ? data.content : ""
  );
  const [activeTab, setActiveTab] = useState("content");
  const [seoMode, setSeoMode] = useState("basic");
  const [lastEdited, setLastEdited] = useState(
    data?.ui?.lastEdited || "1 day ago"
  );
  const [query, setQuery] = useState(
    data?.ui?.query || data?.primaryKeyword || ""
  );
  const [basicsUnlocked, setBasicsUnlocked] = useState(false);

  /* session id to force-remount CEContentArea (and its children like Research) */
  const [editorSessionId, setEditorSessionId] = useState(0);

  const PRIMARY_KEYWORD = useMemo(
    () =>
      norm(
        query ||
          data?.primaryKeyword ||
          pageConfig?.primaryKeyword ||
          "content marketing"
      ),
    [query, data?.primaryKeyword, pageConfig?.primaryKeyword]
  );

  const LSI = useMemo(
    () =>
      (Array.isArray(data?.lsiKeywords) && data.lsiKeywords.length
        ? data.lsiKeywords
        : Array.isArray(pageConfig?.lsiKeywords)
        ? pageConfig.lsiKeywords
        : [
            "strategy",
            "engagement",
            "brand",
            "seo",
            "audience",
            "education",
            "trust",
            "subscription",
            "saas",
            "decision-making",
          ]
      ).map((k) => norm(k)),
    [data?.lsiKeywords, pageConfig?.lsiKeywords]
  );

  const WORD_TARGET_FROM_DATA =
    data?.metrics?.wordTarget ??
    data?.wordTarget ??
    pageConfig?.wordTarget ??
    1480;

  const [metrics, setMetrics] = useState({
    plagiarism: 0,
    primaryKeyword: 0,
    wordCount: 0,
    wordTarget: WORD_TARGET_FROM_DATA,
    lsiKeywords: 0,
  });

  /* persistence + fresh-new guard */
  const restoredRef = useRef(false);
  const newDocRef = useRef(false);

  // Track previous incoming data.title to avoid clobbering user edits
  const prevDataTitleRef = useRef(data?.title);

  // Mount: handle ?new/#new once, restore saved state (no more hash forcing)
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const hadNewParam = url.searchParams.get("new") === "1";
      const hadNewHash = (url.hash || "").includes("#new");
      const hasNewFlag = hadNewParam || hadNewHash;

      if (hasNewFlag) {
        // NEW document boot (handle once)
        localStorage.removeItem("content-editor-state");
        setTitle("Untitled");
        setContent("");
        setQuery("");
        setActiveTab("content");
        setSeoMode("basic");
        setLastEdited("just now");
        setBasicsUnlocked(false);
        setMetrics((m) => ({
          ...m,
          plagiarism: 0,
          primaryKeyword: 0,
          wordCount: 0,
          lsiKeywords: 0,
          wordTarget: WORD_TARGET_FROM_DATA,
        }));
        newDocRef.current = true;

        // Force remount & tell research to reset
        setEditorSessionId((n) => n + 1);
        broadcastResearchReset("");

        // Clean URL so refresh doesn’t repeat NEW (no hash change)
        url.searchParams.delete("new");
        window.history.replaceState(null, "", url.toString());
      } else {
        // Normal restore from localStorage (do NOT read title/content/query to avoid deps)
        const raw = localStorage.getItem("content-editor-state");
        if (raw) {
          try {
            const saved = JSON.parse(raw);
            if (typeof saved.title === "string") setTitle(saved.title);
            if (typeof saved.content === "string") setContent(saved.content);
            if (typeof saved.query === "string") setQuery(saved.query);
          } catch {}
        }

        // Just clean ?new if present; do not force any hash
        try {
          url.searchParams.delete("new");
          window.history.replaceState(null, "", url.toString());
        } catch {}
      }
    } catch {}

    restoredRef.current = true;
  }, [WORD_TARGET_FROM_DATA]); // runs once per mount (plus if word target changes)

  // Persist minimal state on edits (does NOT include activeTab/seoMode to keep scope small)
  useEffect(() => {
    try {
      const payload = { title, content, query };
      localStorage.setItem("content-editor-state", JSON.stringify(payload));
      // keep Research in sync if user changes/clears keyword
      window.dispatchEvent(
        new CustomEvent("content-editor:query-changed", { detail: { query } })
      );
    } catch {}
  }, [title, content, query]);

  /* central reset helper (memoized to satisfy exhaustive-deps) */
  const resetToNewDocument = useCallback(
    (payload = {}) => {
      const nextTitle = payload.title || "Untitled";
      const nextContent =
        typeof payload.content === "string" ? payload.content : "";
      setTitle(nextTitle);
      setContent(nextContent);
      setQuery("");
      setActiveTab("content");
      setSeoMode("basic");
      setLastEdited("just now");
      setBasicsUnlocked(false);
      setMetrics((m) => ({
        ...m,
        plagiarism: 0,
        primaryKeyword: 0,
        wordCount: 0,
        lsiKeywords: 0,
        wordTarget:
          data?.metrics?.wordTarget ??
          data?.wordTarget ??
          pageConfig?.wordTarget ??
          1480,
      }));
      try {
        localStorage.setItem(
          "content-editor-state",
          JSON.stringify({ title: nextTitle, content: nextContent, query: "" })
        );
      } catch {}
      newDocRef.current = true;

      // Force remount & tell research to reset
      setEditorSessionId((n) => n + 1);
      broadcastResearchReset("");

      // Clean URL after programmatic new (no hash)
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete("new");
        window.history.replaceState(null, "", url.toString());
      } catch {}
    },
    [data?.metrics?.wordTarget, data?.wordTarget, pageConfig?.wordTarget]
  );

  /* listen for multiple "new doc" event names */
  useEffect(() => {
    const handler = (e) => resetToNewDocument(e?.detail || {});
    const names = ["content-editor:new", "new-document"];
    names.forEach((n) => window.addEventListener(n, handler));
    return () => names.forEach((n) => window.removeEventListener(n, handler));
  }, [resetToNewDocument]);

  /* sync when parent `data` changes, but don't clobber a fresh new doc or user edits */
  useEffect(() => {
    if (!restoredRef.current || newDocRef.current) {
      // Still keep the ref in sync even if we early-return
      prevDataTitleRef.current = data?.title;
      return;
    }

    // Title: only update when the incoming source value actually changes
    if (typeof data?.title === "string" && data.title !== prevDataTitleRef.current) {
      setTitle(data.title);
    }
    // keep ref up to date
    prevDataTitleRef.current = data?.title;

    // Content
    if (typeof data?.content === "string") {
      if (data.content !== content) setContent(data.content);
    } else if (!data?.content && isBlankHtml(content)) {
      if (content !== "") setContent("");
    }

    // Query + lastEdited
    const nextQuery = data?.ui?.query || data?.primaryKeyword || "";
    if (nextQuery !== query) setQuery(nextQuery);

    const nextLastEdited = data?.ui?.lastEdited || "1 day ago";
    if (nextLastEdited !== lastEdited) setLastEdited(nextLastEdited);

    // Metrics.wordTarget (avoid re-setting same value)
    const nextWordTarget =
      data?.metrics?.wordTarget ??
      data?.wordTarget ??
      pageConfig?.wordTarget ??
      metrics.wordTarget ??
      1480;

    if (nextWordTarget !== metrics.wordTarget) {
      setMetrics((m) => ({ ...m, wordTarget: nextWordTarget }));
    }
  }, [
    data,
    pageConfig,
    query,
    lastEdited,
    metrics.wordTarget,
    content, // ✅ added so eslint is happy and logic is correct
  ]);

  /* ===========================
     MOBILE research drawer state
     =========================== */
  const [mobileResearchOpen, setMobileResearchOpen] = useState(false);

  // ESC to close on mobile
  useEffect(() => {
    if (!mobileResearchOpen) return;
    const onKey = (e) => e.key === "Escape" && setMobileResearchOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileResearchOpen]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-300">
      <main className="bg-[var(--bg-panel)] px-2 py-6 sm:px-1 lg:px-2 xl:px-3 transition-colors duration-300">
        <CENavbar
          title={title}
          onBack={onBackToDashboard}
          onTitleChange={setTitle}
          searchVolume={data?.navbar?.searchVolume ?? data?.searchVolume}
          keywordDifficulty={
            data?.navbar?.keywordDifficulty ?? data?.keywordDifficulty
          }
        />

        <CEMetricsStrip
          metrics={metrics}
          seoMode={seoMode}
          onChangeSeoMode={setSeoMode}
          canAccessAdvanced={basicsUnlocked}
        />

        {/* Force remount of the whole content area (Research included) on new doc */}
        <CEContentArea
          key={editorSessionId}
          title={title}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          lastEdited={lastEdited}
          query={query}
          onQueryChange={(q) => {
            setQuery(q);
            try {
              window.dispatchEvent(
                new CustomEvent("content-editor:query-changed", {
                  detail: { query: q },
                })
              );
            } catch {}
          }}
          onStart={() => setBasicsUnlocked(true)} // auto-unlock when Basics → Start
          seoMode={seoMode}
          metrics={metrics}
          setMetrics={setMetrics}
          content={content}
          setContent={(html) => {
            setContent(html);
            setLastEdited("a few seconds ago");
          }}
          primaryKeyword={PRIMARY_KEYWORD}
          lsiKeywords={LSI}
        />

        {process.env.NODE_ENV !== "production" && configError && (
          <p className="mt-2 text-xs text-red-600">
            Config load error: {configError}
          </p>
        )}
      </main>

      {/* ===== MOBILE-ONLY Research FAB (bottom-right symbol) ===== */}
      <button
        type="button"
        onClick={() => setMobileResearchOpen(true)}
        aria-label="Open research"
        className="
          fixed bottom-5 right-5 z-[60] lg:hidden
          h-12 w-12 rounded-full shadow-lg grid place-items-center text-white
          active:scale-95 transition-all
          bg-gradient-to-br from-[#d74d2b] to-[#f59e0b]
        "
      >
        <AlertTriangle size={22} />
      </button>

      {/* Backdrop (mobile only) */}
      <div
        onClick={() => setMobileResearchOpen(false)}
        className={`
          fixed inset-0 z-50 bg-black/25 transition-opacity lg:hidden
          ${mobileResearchOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
      />

      {/* Slide-over Drawer (mobile only) */}
      <aside
        className={`
          fixed top-0 right-0 z-[55] h-full w-[min(92vw,420px)] lg:hidden
          bg-white border-l border-[var(--border)] rounded-l-2xl shadow-xl
          transition-transform duration-300 will-change-transform
          ${mobileResearchOpen ? "translate-x-0" : "translate-x-full"}
        `}
        role="dialog"
        aria-modal="true"
        aria-label="Research panel"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-white/95 backdrop-blur">
          <div className="text-sm font-semibold text-[var(--text-primary)]">
            Research
          </div>
          <button
            onClick={() => setMobileResearchOpen(false)}
            aria-label="Close research"
            className="p-2 rounded-lg hover:bg-gray-100 text-[var(--muted)]"
          >
            <X size={18} />
          </button>
        </div>

        {mobileResearchOpen && (
          <div className="h-[calc(100%-49px)] overflow-y-auto">
            <CEResearchPanel
              query={query}
              onQueryChange={(q) => {
                setQuery(q);
                try {
                  window.dispatchEvent(
                    new CustomEvent("content-editor:query-changed", {
                      detail: { query: q },
                    })
                  );
                } catch {}
              }}
              onStart={() => setBasicsUnlocked(true)}
              seoMode={seoMode}
              metrics={metrics}
              onFix={() => {}}
              onPasteToEditor={() => {}}
              editorContent={content}
            />
          </div>
        )}
      </aside>
    </div>
  );
}
