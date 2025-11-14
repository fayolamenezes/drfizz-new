"use client";

import React, { useEffect, useState } from "react";
import { Plus, Sparkles, HelpCircle } from "lucide-react";

export default function DashboardHeader() {
  const [domain, setDomain] = useState("");

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("websiteData"));
      if (stored?.site) setDomain(stored.site.replace(/^https?:\/\//, ""));
    } catch (e) {
      console.error("Failed to load site", e);
    }
  }, []);

  return (
    <header
      className="
        flex flex-col 
        gap-3 
        sm:flex-row sm:items-center sm:justify-between
        mb-4 sm:mb-6
      "
    >
      {/* LEFT SIDE */}
      <div>
        <p className="text-[11px] sm:text-[12px] text-[#6B7280]">
          Good Morning,{" "}
          <span className="font-semibold text-[#020617]">Sam!</span>
        </p>

        <div className="mt-0.5 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
          <h1 className="text-[22px] sm:text-[24px] md:text-[26px] font-extrabold leading-tight text-[#020617]">
            Dashboard
          </h1>

          {/* Scope */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] sm:text-[12px]">
            <span className="font-medium text-[#6B7280]">Scope :</span>

            <span className="font-semibold text-[#EA580C]">
              {domain ? `https://${domain}` : "https://yourcompany.com"}
            </span>

            <button
              type="button"
              className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#E5E7EB] text-[#9CA3AF] bg-white"
            >
              <HelpCircle size={10} />
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div
        className="
          flex items-center 
          gap-2 sm:gap-3
          relative
        "
      >
        {/* "Last 30 days" */}
        <button
          type="button"
          className="
            inline-flex items-center gap-2
            rounded-full border border-[#F97316] bg-[#FFF7ED]
            px-4 py-2
            text-[12px] sm:text-[13px] font-semibold text-[#C05621]
            hover:bg-[#FFE7D1] transition
          "
        >
          <Plus size={14} />
          <span>Last 30 days</span>
        </button>

        {/* Chat with Ai */}
        <button
          type="button"
          className="
            inline-flex items-center gap-2
            rounded-full px-4 py-2
            text-[12px] sm:text-[13px] font-semibold text-white
            shadow-sm bg-[image:var(--infoHighlight-gradient)]
            hover:opacity-90 transition
          "
        >
          <span>Chat with Ai</span>
          <Sparkles size={16} />
        </button>

        {/*
          RESERVED SPACE FOR YOUR EXISTING THEME TOGGLE
          This ensures alignment and prevents overlap.
          Adjust width if your toggle is wider.
        */}
        <div className="w-[68px] sm:w-[72px]" />
      </div>
    </header>
  );
}
