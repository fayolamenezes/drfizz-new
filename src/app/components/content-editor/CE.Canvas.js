"use client";

import React, {
  useEffect,
  useImperativeHandle,
  useRef,
  forwardRef,
  useCallback,
} from "react";
import { FileText, Sparkles, ScrollText, Link2, Shapes } from "lucide-react";

const CECanvas = forwardRef(function CECanvas(
  { title = "Untitled", content = "", setContent },
  ref
) {
  const editorRef = useRef(null);
  const savedRangeRef = useRef(null);
  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const seededRef = useRef(false);
  const autosaveTimer = useRef(null);

  // “source-of-truth” guards
  const lastLocalHtmlRef = useRef(""); // last html we emitted via setContent
  const lastLocalEditAtRef = useRef(0); // timestamp of last local edit
  const LOCAL_GRACE_MS = 80; // was 600 → now more responsive

  // NEW: re-entrancy guard to prevent onInput → setContent loops
  const suppressInputRef = useRef(false);

  const AUTOSAVE_MS = 800;
  const AUTOSAVE_KEY = `ce:autosave:${title || "untitled"}`;

  /** =========================
   * Utility: sanitize + blank check
   * ========================= */
  function sanitizeToHtml(input) {
    const str = String(input || "");
    const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(str);
    if (looksLikeHtml) return str;
    const esc = (s) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return str
      .split(/\n{2,}/)
      .map((p) => `<p>${esc(p).replace(/\n/g, "<br/>")}</p>`)
      .join("");
  }

  const isTrulyEmpty = useCallback(() => {
    return (
      String(content || "")
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .trim().length === 0
    );
  }, [content]);

  /** =========================
   * Selection helpers
   * ========================= */
  function saveSelectionSnapshot() {
    const sel = window.getSelection?.();
    if (!sel || sel.rangeCount === 0) return;
    const container = editorRef.current;
    const anchor = sel.anchorNode;
    if (container && anchor && container.contains(anchor)) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  }

  function restoreSelectionSnapshot() {
    const r = savedRangeRef.current;
    if (!r) return;
    const sel = window.getSelection?.();
    if (!sel) return;
    sel.removeAllRanges();
    sel.addRange(r);
  }

  /** =========================
   * Highlighter core (disabled)
   * ========================= */
  const runHighlights = useCallback(() => {}, []);

  /** =========================
   * Autosave + state sync
   * ========================= */
  function scheduleAutosave(html) {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(AUTOSAVE_KEY, html);
      } catch {}
    }, AUTOSAVE_MS);
  }

  function bubble({ pushHistory = true, notifyParent = true } = {}) {
    const el = editorRef.current;
    const html = el?.innerHTML || "";
    if (notifyParent && !suppressInputRef.current) {
      suppressInputRef.current = true;
      setContent?.(html);
      lastLocalHtmlRef.current = html;
      lastLocalEditAtRef.current = Date.now();
      queueMicrotask(() => {
        suppressInputRef.current = false;
      });
    }
    if (pushHistory) {
      const last = undoStack.current[undoStack.current.length - 1];
      if (last !== html) {
        undoStack.current.push(html);
        redoStack.current = [];
      }
    }
    scheduleAutosave(html);
    saveSelectionSnapshot();
    requestAnimationFrame(runHighlights);
  }

  /** =========================
   * Mount hydration
   * ========================= */
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;

    if (!seededRef.current && isTrulyEmpty()) {
      const saved =
        typeof window !== "undefined"
          ? localStorage.getItem(AUTOSAVE_KEY)
          : null;
      if (saved) {
        suppressInputRef.current = true;
        el.innerHTML = saved;
        setContent?.(saved);
        lastLocalHtmlRef.current = saved;
        queueMicrotask(() => {
          suppressInputRef.current = false;
        });
      }
    } else if (!seededRef.current) {
      const html = sanitizeToHtml(content);
      if (el.innerHTML !== html) {
        suppressInputRef.current = true;
        el.innerHTML = html;
        lastLocalHtmlRef.current = html;
        queueMicrotask(() => {
          suppressInputRef.current = false;
        });
      } else {
        lastLocalHtmlRef.current = html;
      }
    }

    if (!seededRef.current) {
      undoStack.current = [el.innerHTML];
      redoStack.current = [];
      seededRef.current = true;
      requestAnimationFrame(runHighlights);
    }
  }, [AUTOSAVE_KEY, isTrulyEmpty, setContent, content, runHighlights]);

  /** =========================
   * External sync (GUARDED)
   * ========================= */
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;

    const htmlFromProp = sanitizeToHtml(content);
    const currentDom = el.innerHTML;

    if (htmlFromProp === currentDom) return;
    if (htmlFromProp === lastLocalHtmlRef.current) return;

    const justLocallyEdited =
      seededRef.current && Date.now() - lastLocalEditAtRef.current < LOCAL_GRACE_MS;
    if (justLocallyEdited) return;

    suppressInputRef.current = true;
    el.innerHTML = htmlFromProp;
    queueMicrotask(() => {
      suppressInputRef.current = false;
    });
    if (seededRef.current) {
      undoStack.current.push(htmlFromProp);
      redoStack.current = [];
    }
    requestAnimationFrame(runHighlights);
  }, [content, runHighlights]);

  useImperativeHandle(ref, () => ({
    exec: (cmd, value) => execCommand(cmd, value),
  }));

  /** =========================
   * execCommand
   * ========================= */
  function execCommand(cmd, value) {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    restoreSelectionSnapshot();

    try {
      document.execCommand("styleWithCSS", false, true);
    } catch {}

    const sel = window.getSelection?.();
    const hasSel = sel && sel.rangeCount > 0 && !sel.getRangeAt(0).collapsed;
    const wrapSelectionWith = (tag, style = "") => {
      if (!hasSel) return;
      const range = sel.getRangeAt(0);
      const frag = range.cloneContents();
      const wrapper = document.createElement(tag);
      if (style) wrapper.setAttribute("style", style);
      wrapper.appendChild(frag);
      range.deleteContents();
      range.insertNode(wrapper);
      range.setStartAfter(wrapper);
      range.setEndAfter(wrapper);
      sel.removeAllRanges();
      sel.addRange(range);
    };

    switch (cmd) {
      case "saveSelection":
        saveSelectionSnapshot();
        return;
      case "fontSizePx": {
        const px = Number(value) || 16;
        wrapSelectionWith("span", `font-size:${px}px;`);
        break;
      }
      case "code": {
        wrapSelectionWith("code");
        break;
      }
      case "undo": {
        if (undoStack.current.length > 1) {
          const cur = undoStack.current.pop();
          redoStack.current.push(cur);
          const prev = undoStack.current[undoStack.current.length - 1] || "";
          suppressInputRef.current = true;
          el.innerHTML = prev;
          setContent?.(prev);
          lastLocalHtmlRef.current = prev;
          lastLocalEditAtRef.current = Date.now();
          queueMicrotask(() => {
            suppressInputRef.current = false;
          });
        } else {
          document.execCommand("undo", false, null);
        }
        break;
      }
      case "redo": {
        if (redoStack.current.length > 0) {
          const next = redoStack.current.pop();
          undoStack.current.push(next);
          suppressInputRef.current = true;
          el.innerHTML = next;
          setContent?.(next);
          lastLocalHtmlRef.current = next;
          lastLocalEditAtRef.current = Date.now();
          queueMicrotask(() => {
            suppressInputRef.current = false;
          });
        } else {
          document.execCommand("redo", false, null);
        }
        break;
      }
      default:
        document.execCommand(cmd, false, value);
        break;
    }

    lastLocalHtmlRef.current = el.innerHTML;
    lastLocalEditAtRef.current = Date.now();
    bubble({ pushHistory: true, notifyParent: true });
  }

  const showStarter = isTrulyEmpty();

  return (
    <section
      className="rounded-b-[12px] border border-t-0 border-[var(--border)] bg-white px-6 md:px-8 py-6 transition-colors"
      aria-label="Editor canvas"
    >
      <h2 className="text-[26px] md:text-[28px] font-bold text-[var(--text-primary)] mb-4 transition-colors">
        {title}
      </h2>

      {showStarter && (
        <div className="mb-6 text-[var(--text)] transition-colors">
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-[15px]">
              <FileText size={18} className="opacity-70" />
              <span>Empty page</span>
            </li>
            <li className="flex items-center gap-3 text-[15px]">
              <Sparkles size={18} className="opacity-70" />
              <span>Start with AI...</span>
            </li>
            <li className="flex items-center gap-3 text-[15px]">
              <ScrollText size={18} className="opacity-70" />
              <span>Generate content brief</span>
            </li>
            <li className="flex items-center gap-3 text-[15px]">
              <Link2 size={18} className="opacity-70" />
              <span>Import content from URL</span>
            </li>
            <li className="flex items-center gap-3 text-[15px]">
              <Shapes size={18} className="opacity-70" />
              <span>Import template</span>
            </li>
          </ul>
        </div>
      )}

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="min-h-[420px] rounded-md border border-[var(--border)] bg-white px-4 py-4 leading-7 text-[15px] text-[var(--text-primary)] focus:outline-none prose prose-p:my-3 prose-h1:text-2xl prose-h2:text-xl prose-ul:list-disc prose-ul:pl-6 transition-colors"
        onInput={() => {
          if (!suppressInputRef.current) {
            bubble({ pushHistory: false, notifyParent: true });
          }
        }}
        onKeyUp={saveSelectionSnapshot}
        onMouseUp={saveSelectionSnapshot}
      />
    </section>
  );
});

export default CECanvas;
