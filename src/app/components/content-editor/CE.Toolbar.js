"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Menu, Undo2, Redo2, Bold, Italic, Underline, Strikethrough, Code2,
  Link as LinkIcon, AlignLeft, AlignCenter, AlignRight, List,
  MessageSquare, SquareStack, ChevronDown, Dot, Paintbrush,
} from "lucide-react";

export default function CEToolbar({ activeTab, onTabChange, lastEdited, editorRef }) {
  const [headOpen, setHeadOpen] = useState(false);
  const [insOpen, setInsOpen] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);

  const [textPaletteOpen, setTextPaletteOpen] = useState(false);
  const [hilitePaletteOpen, setHilitePaletteOpen] = useState(false);

  const [customSize, setCustomSize] = useState("");

  const colorInputRef = useRef(null);
  const highlightInputRef = useRef(null);
  const popoverRef = useRef(null);

  const noFocus = (e) => e.preventDefault();

  // Memoize exec so hooks depending on it stay stable (fixes exhaustive-deps)
  const exec = useCallback(
    (cmd, val) => editorRef?.current?.exec?.(cmd, val),
    [editorRef]
  );

  // ---------- Close palettes on outside click ----------
  useEffect(() => {
    function onDocClick(e) {
      if (!popoverRef.current) return;
      if (!popoverRef.current.contains(e.target)) {
        setTextPaletteOpen(false);
        setHilitePaletteOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // ---------- Native color picker: commit only on final native `change` ----------
  const wireNativeColor = useCallback((ref, command) => {
    const el = ref.current;
    if (!el) return () => {};

    // cache last value while dragging (not applied)
    let lastVal = null;
    const onInput = (e) => { lastVal = e.target.value; }; // no exec here
    const onChange = (e) => {
      // Commit exactly once when the picker is closed/confirmed.
      exec("saveSelection");
      exec(command, lastVal || e.target.value);
      setTextPaletteOpen(false);
      setHilitePaletteOpen(false);
      lastVal = null;
    };

    el.addEventListener("input", onInput, { passive: true });
    el.addEventListener("change", onChange, { passive: true });

    return () => {
      el.removeEventListener("input", onInput);
      el.removeEventListener("change", onChange);
    };
  }, [exec]);

  useEffect(() => wireNativeColor(colorInputRef, "foreColor"), [wireNativeColor]);
  useEffect(() => wireNativeColor(highlightInputRef, "hiliteColor"), [wireNativeColor]);

  // ---------- UI bits ----------
  const Tab = ({ id, children }) => {
    const is = activeTab === id;
    return (
      <button
        onClick={() => onTabChange?.(id)}
        className={`h-[34px] px-3 text-[13px] border-b-2 -mb-px transition-colors ${
          is
            ? "border-black text-black font-medium"
            : "border-transparent text-gray-500 hover:text-black"
        }`}
      >
        {children}
      </button>
    );
  };

  const IconBtn = ({ title, children, onClick }) => (
    <button
      title={title}
      onMouseDown={noFocus}
      onClick={onClick}
      className="h-7 w-7 grid place-items-center rounded hover:bg-gray-100 text-gray-700 transition-colors"
    >
      {children}
    </button>
  );

  const textSizes = [12, 14, 16, 18, 20, 24];

  const TEXT_COLORS = [
    "#000000","#434343","#666666","#999999","#B7B7B7","#CCCCCC","#EFEFEF","#FFFFFF",
    "#FF0000","#FF6D00","#FFAB00","#FFD600","#00C853","#00B8D4","#2979FF","#6200EA",
  ];
  const HILITE_COLORS = [
    "#FFF59D","#FFF176","#FFEE58","#FFEB3B",
    "#FFD54F","#FFB74D","#FF8A65","#FF8A80",
    "#A5D6A7","#80CBC4","#81D4FA","#90CAF9",
    "#CE93D8","#F48FB1","#E0E0E0","#F5F5F5",
    "#8B0000",
  ];

  const Swatch = ({ color, onPick }) => (
    <button
      title={color}
      className="w-6 h-6 rounded border border-gray-300 hover:scale-[1.03] transition"
      style={{ backgroundColor: color }}
      onMouseDown={noFocus}
      onClick={() => onPick(color)}
    />
  );

  const Palette = ({ title, colors, onPick, onCustom }) => (
    <div
      ref={popoverRef}
      className="absolute z-50 mt-1 rounded-xl border border-[var(--border)] bg-white shadow-lg p-3 transition-colors"
      style={{ width: 224 }}
    >
      <div className="grid grid-cols-8 gap-2 mb-2">
        {colors.map((c) => (
          <Swatch key={c} color={c} onPick={onPick} />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <button
          className="text-[12px] px-3 py-[6px] border border-gray-300 rounded hover:bg-gray-100"
          onMouseDown={noFocus}
          onClick={onCustom}
        >
          Custom…
        </button>
        <span className="text-[11px] text-gray-500">{title}</span>
      </div>
    </div>
  );

  const openNativeColor = (ref) => {
    exec("saveSelection");
    setTimeout(() => {
      if (ref.current?.showPicker) ref.current.showPicker();
      else ref.current?.click();
    }, 0);
  };

  // --- Added: map heading → inline size (px). Adjust if you want different sizes.
  const HEADING_SIZES = {
    h1: 28,
    h2: 22,
    h3: 18,
  };

  // --- Added: apply heading + size + bold in one go, keeping UX identical.
  const applyHeadingBlock = (block) => {
    exec("saveSelection");
    exec("formatBlock", block);
    if (HEADING_SIZES[block]) {
      exec("fontSizePx", HEADING_SIZES[block]); // inline font-size for consistency across environments
      exec("bold"); // ensure bold appearance on headings
    }
    setHeadOpen(false);
  };

  return (
    <div className="w-full bg-white border border-[var(--border)] border-b-0 border-r-0 rounded-tl-[12px] transition-colors">
      {/* Tabs Row */}
      <div className="flex items-center justify-between px-2 pt-[3px]">
        <div className="flex items-center gap-1">
          <IconBtn title="Menu" onClick={() => console.log("Menu clicked")}><Menu size={15} /></IconBtn>
          <Tab id="content">Content</Tab>
          <Tab id="summary">Article Summary</Tab>
          <Tab id="final">Final Content</Tab>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 pr-2">
          <span>Edited {lastEdited}</span>
          <SquareStack size={13} className="opacity-70" />
        </div>
      </div>

      {/* Actions Row */}
      <div className="flex items-center gap-[2px] px-2 py-[3px] border-t border-[var(--border)] bg-white relative transition-colors">
        <IconBtn title="Undo" onClick={() => exec("undo")}><Undo2 size={14} /></IconBtn>
        <IconBtn title="Redo" onClick={() => exec("redo")}><Redo2 size={14} /></IconBtn>

        <div className="w-px h-5 bg-gray-200 mx-0.5" />

        {/* Heading */}
        <div className="relative">
          <button
            className="px-2 h-7 rounded border border-[var(--border)] text-[13px] hover:bg-gray-100 inline-flex items-center gap-1 transition-colors"
            onMouseDown={noFocus}
            onClick={() => {
              exec("saveSelection");
              setHeadOpen((s) => !s);
            }}
          >
            Heading 3 <ChevronDown size={12} />
          </button>
          {headOpen && (
            <div className="absolute z-40 mt-1 min-w-[150px] rounded-md border border-[var(--border)] bg-white shadow-sm transition-colors">
              {[
                { label: "Paragraph", block: "p" },
                { label: "Heading 1", block: "h1" },
                { label: "Heading 2", block: "h2" },
                { label: "Heading 3", block: "h3" },
              ].map((it) => (
                <button
                  key={it.block}
                  className="w-full text-left px-3 py-1.5 text-[13px] hover:bg-gray-100"
                  onMouseDown={noFocus}
                  onClick={() => {
                    if (it.block === "p") {
                      // Keep paragraph behavior unchanged
                      exec("formatBlock", "p");
                      setHeadOpen(false);
                    } else {
                      applyHeadingBlock(it.block);
                    }
                  }}
                >
                  {it.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-gray-200 mx-0.5" />

        {/* Inline formatting */}
        <IconBtn title="Bold" onClick={() => exec("bold")}><Bold size={14} /></IconBtn>
        <IconBtn title="Italic" onClick={() => exec("italic")}><Italic size={14} /></IconBtn>
        <IconBtn title="Underline" onClick={() => exec("underline")}><Underline size={14} /></IconBtn>
        <IconBtn title="Strikethrough" onClick={() => exec("strikeThrough")}><Strikethrough size={14} /></IconBtn>
        <IconBtn title="Inline code" onClick={() => exec("code")}><Code2 size={14} /></IconBtn>

        {/* Link */}
        <IconBtn title="Insert Link" onClick={() => {
          const url = prompt("Enter URL");
          if (url) exec("createLink", url);
        }}>
          <LinkIcon size={14} />
        </IconBtn>

        {/* Alignment + List */}
        <IconBtn title="Align left" onClick={() => exec("justifyLeft")}><AlignLeft size={14} /></IconBtn>
        <IconBtn title="Align center" onClick={() => exec("justifyCenter")}><AlignCenter size={14} /></IconBtn>
        <IconBtn title="Align right" onClick={() => exec("justifyRight")}><AlignRight size={14} /></IconBtn>
        <IconBtn title="Bulleted List" onClick={() => exec("insertUnorderedList")}><List size={14} /></IconBtn>

        <div className="w-px h-5 bg-gray-200 mx-0.5" />

        {/* Text color */}
        <div className="relative">
          <IconBtn
            title="Text color"
            onClick={() => { exec("saveSelection"); setTextPaletteOpen((s) => !s); setHilitePaletteOpen(false); }}
          >
            <Dot size={14} />
          </IconBtn>
          {textPaletteOpen && (
            <Palette
              title="Text color"
              colors={TEXT_COLORS}
              onPick={(c) => { exec("foreColor", c); setTextPaletteOpen(false); }}
              onCustom={() => openNativeColor(colorInputRef)}
            />
          )}
        </div>
        {/* NOTE: native events are wired in useEffect */}
        <input ref={colorInputRef} type="color" className="hidden" />

        {/* Highlight */}
        <div className="relative">
          <IconBtn
            title="Highlight color"
            onClick={() => { exec("saveSelection"); setHilitePaletteOpen((s) => !s); setTextPaletteOpen(false); }}
          >
            <Paintbrush size={14} />
          </IconBtn>
          {hilitePaletteOpen && (
            <Palette
              title="Highlight color"
              colors={HILITE_COLORS}
              onPick={(c) => { exec("hiliteColor", c); setHilitePaletteOpen(false); }}
              onCustom={() => openNativeColor(highlightInputRef)}
            />
          )}
        </div>
        {/* NOTE: native events are wired in useEffect */}
        <input ref={highlightInputRef} type="color" className="hidden" />

        <div className="w-px h-5 bg-gray-200 mx-0.5" />

        {/* Insert */}
        <div className="relative">
          <button
            className="px-2 h-7 rounded border border-[var(--border)] text-[13px] hover:bg-gray-100 inline-flex items-center gap-1 transition-colors"
            onMouseDown={noFocus}
            onClick={() => setInsOpen((s) => !s)}
          >
            Insert <ChevronDown size={12} />
          </button>
          {insOpen && (
            <div className="absolute z-40 mt-1 min-w=[160px] rounded-md border border-[var(--border)] bg-white shadow-sm transition-colors">
              <button className="w-full text-left px-3 py-1.5 text-[13px] hover:bg-gray-100"
                onMouseDown={noFocus} onClick={() => { exec("insertHorizontalRule"); setInsOpen(false); }}>
                Horizontal Rule
              </button>
              <button className="w-full text-left px-3 py-1.5 text-[13px] hover:bg-gray-100"
                onMouseDown={noFocus} onClick={() => {
                  const url = prompt("Image URL"); if (url) exec("insertImage", url); setInsOpen(false);
                }}>
                Image (URL)
              </button>
              <button className="w-full text-left px-3 py-1.5 text-[13px] hover:bg-gray-100"
                onMouseDown={noFocus} onClick={() => { exec("formatBlock", "blockquote"); setInsOpen(false); }}>
                Quote
              </button>
            </div>
          )}
        </div>

        {/* Text size */}
        <div className="relative">
          <button
            title="Text size"
            onMouseDown={noFocus}
            onClick={() => setSizeOpen((s) => !s)}
            className="ml-1 h-7 px-1.5 rounded hover:bg-gray-100 text-gray-700 text-[12px] font-medium inline-flex items-center gap-1 transition-colors"
          >
            T<span className="text-[10px] align-super">x</span> <ChevronDown size={12} />
          </button>
          {sizeOpen && (
            <div className="absolute z-40 mt-1 min-w-[130px] rounded-md border border-[var(--border)] bg-white shadow-sm p-1 transition-colors">
              {[12, 14, 16, 18, 20, 24].map((px) => (
                <button key={px} className="w-full text-left px-3 py-1.5 text-[13px] hover:bg-gray-100"
                  onMouseDown={noFocus} onClick={() => { exec("fontSizePx", px); setSizeOpen(false); }}>
                  {px}px
                </button>
              ))}
              <div className="border-t border-gray-200 my-1" />
              <div className="flex items-center gap-1 px-2 pb-1">
                <input
                  type="number"
                  value={customSize}
                  onChange={(e) => setCustomSize(e.target.value)}
                  placeholder="Custom"
                  className="w-[70px] border border-gray-200 rounded px-2 text-[12px]"
                />
                <button
                  onClick={() => {
                    if (customSize) {
                      exec("fontSizePx", Number(customSize));
                      setCustomSize("");
                      setSizeOpen(false);
                    }
                  }}
                  className="text-[12px] px-2 py-[6px] border border-gray-300 rounded hover:bg-gray-100"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        <IconBtn title="Comment"><MessageSquare size={14} /></IconBtn>
      </div>
    </div>
  );
}
