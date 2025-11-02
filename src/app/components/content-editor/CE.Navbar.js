"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Edit3, Sparkles, Plus } from "lucide-react";

export default function CENavbar({
  title,
  onBack,
  onTitleChange,
  searchVolume,
  keywordDifficulty,
}) {
  const sv = searchVolume ?? "-----";
  const kd = keywordDifficulty ?? "-----";

  const [editing, setEditing] = useState(false);
  const nameRef = useRef(null);

  // keep DOM text in sync when not editing
  useEffect(() => {
    if (!editing && nameRef.current) {
      nameRef.current.innerText = title || "Untitled";
    }
  }, [title, editing]);

  const handleNewDoc = () => {
    // Open a real empty doc (no demo fallback). Title stays "Untitled".
    window.dispatchEvent(
      new CustomEvent("content-editor:open", {
        // use a single space to avoid any "falsy → demo content" fallbacks downstream
        detail: { title: "Untitled", content: " " },
      })
    );
  };

  const startEditing = () => {
    setEditing(true);
    requestAnimationFrame(() => {
      const el = nameRef.current;
      if (!el) return;
      el.innerText = title || "Untitled";
      el.focus();
      // select all
      const r = document.createRange();
      r.selectNodeContents(el);
      const s = window.getSelection();
      s.removeAllRanges();
      s.addRange(r);
    });
  };

  const commitTitle = () => {
    const el = nameRef.current;
    if (!el) return;
    const next = (el.innerText || "").replace(/\s+/g, " ").trim() || "Untitled";
    setEditing(false);
    if (next !== title) onTitleChange?.(next);
  };

  const cancelTitle = () => {
    setEditing(false);
    if (nameRef.current) nameRef.current.innerText = title || "Untitled";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitTitle();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelTitle();
    }
  };

  return (
    <header className="mb-4 pr-16 md:pr-20">
      <div className="grid grid-cols-[auto_1fr_auto] grid-rows-[auto_auto] items-center gap-x-4">
        {/* TOP-LEFT: back link */}
        <div className="col-start-1 row-start-1">
          <button
            onClick={() => onBack?.()}
            className="inline-flex items-center gap-2 px-0 py-0 text-[12px] text-[var(--muted)] hover:opacity-70 transition"
          >
            <ArrowLeft size={16} />
            <span className="font-medium">Back to DASHBOARD</span>
          </button>
        </div>

        {/* BOTTOM-LEFT: title (no truncation, wraps) + pencil */}
        <div className="col-start-1 row-start-2 flex items-baseline gap-1 min-w-0">
          <h1
            className="
              flex-1 text-[16px] md:text-[18px]
              font-semibold leading-tight
              overflow-visible whitespace-normal break-words
            "
          >
            Content Editor :{" "}
            <span
              ref={nameRef}
              role="textbox"
              aria-label="Document title"
              aria-multiline={false}
              contentEditable={editing}
              suppressContentEditableWarning
              onBlur={commitTitle}
              onKeyDown={handleKeyDown}
              className={[
                "inline-block whitespace-normal break-words px-1",
                editing ? "outline-none ring-2 ring-orange-300 bg-white" : "outline-none",
              ].join(" ")}
              style={{ cursor: editing ? "text" : "default" }}
            >
              {title || "Untitled"}
            </span>
          </h1>

          <button
            title={editing ? "Save (Enter) / Cancel (Esc)" : "Rename"}
            onClick={editing ? commitTitle : startEditing}
            className="p-1 rounded text-[var(--muted)] hover:bg-[var(--input)]"
          >
            <Edit3 size={16} />
          </button>
        </div>

        {/* BOTTOM-CENTER: inline stats */}
        <div className="col-start-2 row-start-2 hidden md:flex items-center justify-center">
          <div className="flex items-center gap-12 text-[12px] text-[var(--muted)]">
            <span>
              Search Volume : <span className="opacity-60">{sv}</span>
            </span>
            <span>
              Keyword difficulty : <span className="opacity-60">{kd}</span>
            </span>
          </div>
        </div>

        {/* TOP-RIGHT: New document + Chat with AI */}
        <div className="col-start-3 row-start-1 flex items-center gap-3">
          <button
            onClick={handleNewDoc}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-[13px] font-semibold text-[var(--accent)] border border-[var(--accent)] hover:bg-[var(--accent)]/10 transition"
          >
            <Plus size={16} />
            <span>New document</span>
          </button>

          <button className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-[13px] font-semibold text-white shadow-sm bg-[image:var(--infoHighlight-gradient)] hover:opacity-90 transition">
            <span>Chat with AI</span>
            <Sparkles size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
