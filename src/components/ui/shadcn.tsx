"use client";

import React from "react";

/**
 * Pure CSS (i) Hover Tooltip — Zero text bloat on main UI.
 * All formulas, definitions, sources, and decision guardrails appear cleanly on hover.
 */
export function InfoTooltip({
  title,
  formula,
  source,
  guardrail,
  align = "left",
}: {
  title: string;
  formula?: string;
  source?: string;
  guardrail?: string;
  align?: "left" | "right" | "center";
}) {
  const posClass =
    align === "right"
      ? "right-0"
      : align === "center"
      ? "left-1/2 -translate-x-1/2"
      : "left-0";

  return (
    <span className="relative inline-flex items-center group ml-1.5 align-middle">
      <span
        tabIndex={0}
        aria-label={`Giải thích: ${title}`}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-zinc-300 bg-zinc-100 text-[10px] font-mono font-bold text-zinc-600 group-hover:bg-zinc-900 group-hover:text-white group-hover:border-zinc-900 transition-colors cursor-help select-none"
      >
        i
      </span>
      <span
        role="tooltip"
        className={`info-tooltip-panel pointer-events-none invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-all duration-150 absolute bottom-full mb-2 ${posClass} w-72 sm:w-80 p-3 rounded-lg bg-zinc-950 text-zinc-100 border border-zinc-800 shadow-2xl z-50 text-left font-normal leading-relaxed`}
      >
        <span className="block text-xs font-semibold text-white pb-1.5 mb-1.5 border-b border-zinc-800">
          {title}
        </span>
        {formula && (
          <span className="block text-[11px] text-zinc-300 mb-1">
            <strong className="text-zinc-400">Công thức:</strong>{" "}
            <code className="text-cyan-300 font-mono">{formula}</code>
          </span>
        )}
        {source && (
          <span className="block text-[11px] text-zinc-300 mb-1">
            <strong className="text-zinc-400">Nguồn & Đơn vị:</strong> {source}
          </span>
        )}
        {guardrail && (
          <span className="block text-[11px] text-amber-300/95 bg-amber-950/50 border border-amber-800/50 rounded p-1.5 mt-1.5">
            <strong>Quy tắc:</strong> {guardrail}
          </span>
        )}
      </span>
    </span>
  );
}

/**
 * Pure CSS Geometric Status Dot (No text/emoji icons)
 */
export function StatusDot({
  variant = "neutral",
  pulse = false,
}: {
  variant?: "success" | "warning" | "danger" | "info" | "neutral";
  pulse?: boolean;
}) {
  const colorMap = {
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-rose-500",
    info: "bg-blue-500",
    neutral: "bg-zinc-400",
  };
  return (
    <span className="relative inline-flex h-2 w-2 shrink-0">
      {pulse && (
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${colorMap[variant]}`}
        />
      )}
      <span
        className={`relative inline-flex rounded-full h-2 w-2 ${colorMap[variant]}`}
      />
    </span>
  );
}

/**
 * Shadcn-style Badge Component
 */
export function Badge({
  children,
  variant = "secondary",
  className = "",
}: {
  children: React.ReactNode;
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "success"
    | "warning"
    | "destructive"
    | "info";
  className?: string;
}) {
  const styles = {
    default: "bg-zinc-900 text-zinc-50 border-transparent",
    secondary: "bg-zinc-100 text-zinc-800 border-zinc-200",
    outline: "bg-transparent text-zinc-700 border-zinc-300",
    success: "bg-emerald-50 text-emerald-800 border-emerald-200",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
    destructive: "bg-rose-50 text-rose-800 border-rose-200",
    info: "bg-blue-50 text-blue-800 border-blue-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium tracking-tight whitespace-nowrap ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

/**
 * Pure CSS Horizontal Meter Bar
 */
export function CssMeterBar({
  value,
  max,
  colorClass = "bg-zinc-900",
}: {
  value: number;
  max: number;
  colorClass?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, Math.round((value / max) * 100))) : 0;
  return (
    <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-300 ${colorClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
