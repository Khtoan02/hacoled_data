"use client";

import React, { useEffect } from "react";

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
        className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-zinc-300/90 bg-zinc-100/90 text-[10px] font-mono font-bold text-zinc-600 group-hover:bg-zinc-950 group-hover:text-white group-hover:border-zinc-950 group-hover:scale-105 transition-all cursor-help select-none shadow-2xs"
      >
        i
      </span>
      <span
        role="tooltip"
        className={`info-tooltip-panel pointer-events-none invisible opacity-0 translate-y-1 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:visible group-focus-within:opacity-100 transition-all duration-150 absolute bottom-full mb-2.5 ${posClass} w-72 sm:w-80 p-3.5 rounded-xl bg-zinc-950/95 backdrop-blur-md text-zinc-100 border border-zinc-800 shadow-2xl z-50 text-left font-normal leading-relaxed`}
      >
        <span className="flex items-center justify-between gap-2 text-xs font-semibold text-white pb-2 mb-2 border-b border-zinc-800/90">
          <span>{title}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
        </span>
        {formula && (
          <span className="block text-[11px] text-zinc-300 mb-1.5">
            <strong className="text-zinc-400 uppercase tracking-wider text-[10px] block mb-0.5">
              Công thức chuẩn
            </strong>
            <code className="block bg-zinc-900/90 border border-zinc-800 rounded px-2 py-1 text-cyan-300 font-mono text-[11px]">
              {formula}
            </code>
          </span>
        )}
        {source && (
          <span className="block text-[11px] text-zinc-300 mb-1.5">
            <strong className="text-zinc-400">Nguồn & Đơn vị:</strong> {source}
          </span>
        )}
        {guardrail && (
          <span className="block text-[11px] text-amber-200/95 bg-amber-950/60 border border-amber-800/50 rounded-lg p-2 mt-2 whitespace-pre-line">
            <strong className="text-amber-400">Quy tắc kiểm soát:</strong>{" "}
            {guardrail}
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
    info: "bg-sky-500",
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
 * Pure CSS Geometric Iconography (100% CSS shapes, zero text/emoji icons)
 */
export function CssIcon({
  name,
  active = false,
}: {
  name:
    | "dashboard"
    | "crm"
    | "strategy"
    | "content"
    | "team"
    | "security"
    | "search"
    | "plus"
    | "layers";
  active?: boolean;
}) {
  const strokeColor = active ? "border-white" : "border-zinc-400";
  const fillColor = active ? "bg-white" : "bg-zinc-400";

  if (name === "dashboard") {
    return (
      <span className="inline-grid grid-cols-2 gap-0.5 w-3.5 h-3.5 shrink-0">
        <span className={`rounded-[1px] ${fillColor}`} />
        <span className={`rounded-[1px] border ${strokeColor}`} />
        <span className={`rounded-[1px] border ${strokeColor}`} />
        <span className={`rounded-[1px] ${fillColor}`} />
      </span>
    );
  }

  if (name === "crm") {
    return (
      <span className="inline-flex flex-col items-center justify-between w-3.5 h-3.5 py-0.5 shrink-0">
        <span className={`w-full h-[2.5px] rounded-full ${fillColor}`} />
        <span className={`w-2.5 h-[2.5px] rounded-full ${fillColor} opacity-80`} />
        <span className={`w-1.5 h-[2.5px] rounded-full ${fillColor} opacity-60`} />
      </span>
    );
  }

  if (name === "strategy") {
    return (
      <span
        className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border-[1.5px] ${strokeColor} shrink-0`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${fillColor}`} />
      </span>
    );
  }

  if (name === "content") {
    return (
      <span className="relative inline-flex items-center justify-center w-3.5 h-3.5 shrink-0">
        <span
          className={`w-2.5 h-2.5 rounded-[2px] border-[1.5px] ${strokeColor} -translate-x-0.5 -translate-y-0.5`}
        />
        <span
          className={`absolute w-2.5 h-2.5 rounded-[2px] ${fillColor} opacity-80 translate-x-0.5 translate-y-0.5`}
        />
      </span>
    );
  }

  if (name === "team") {
    return (
      <span className="inline-flex items-end justify-between w-3.5 h-3.5 gap-[2px] shrink-0">
        <span className={`w-1 h-1.5 rounded-t-[1px] ${fillColor} opacity-60`} />
        <span className={`w-1 h-2.5 rounded-t-[1px] ${fillColor} opacity-85`} />
        <span className={`w-1 h-3.5 rounded-t-[1px] ${fillColor}`} />
      </span>
    );
  }

  if (name === "security") {
    return (
      <span className="inline-flex flex-col items-center justify-center w-3.5 h-3.5 shrink-0">
        <span
          className={`w-2 h-1.5 rounded-t-full border-[1.5px] border-b-0 ${strokeColor}`}
        />
        <span className={`w-3 h-2 rounded-[2px] ${fillColor}`} />
      </span>
    );
  }

  if (name === "search") {
    return (
      <span className="relative inline-flex items-center justify-center w-3.5 h-3.5 shrink-0">
        <span className="w-2.5 h-2.5 rounded-full border-[1.5px] border-current -translate-x-0.5 -translate-y-0.5" />
        <span className="absolute w-1.5 h-[1.5px] bg-current rotate-45 translate-x-1 translate-y-1" />
      </span>
    );
  }

  if (name === "plus") {
    return (
      <span className="relative inline-flex items-center justify-center w-3 h-3 shrink-0">
        <span className="absolute w-2.5 h-[1.5px] bg-current rounded-full" />
        <span className="absolute h-2.5 w-[1.5px] bg-current rounded-full" />
      </span>
    );
  }

  return (
    <span
      className={`inline-block w-3 h-3 rounded-xs border-[1.5px] ${strokeColor} shrink-0`}
    />
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
    | "info"
    | "dark";
  className?: string;
}) {
  const styles = {
    default: "bg-zinc-900 text-zinc-50 border-zinc-900",
    secondary: "bg-zinc-100 text-zinc-800 border-zinc-200/90",
    outline: "bg-white/80 text-zinc-700 border-zinc-300",
    success: "bg-emerald-50 text-emerald-800 border-emerald-200/90",
    warning: "bg-amber-50 text-amber-800 border-amber-200/90",
    destructive: "bg-rose-50 text-rose-800 border-rose-200/90",
    info: "bg-sky-50 text-sky-800 border-sky-200/90",
    dark: "bg-zinc-800 text-zinc-200 border-zinc-700",
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
  heightClass = "h-1.5",
}: {
  value: number;
  max: number;
  colorClass?: string;
  heightClass?: string;
}) {
  const pct =
    max > 0 ? Math.min(100, Math.max(2, Math.round((value / max) * 100))) : 0;
  return (
    <div
      className={`w-full ${heightClass} bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/50`}
    >
      <div
        className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/**
 * Pure CSS Mini Bar Sparkline for Metric Cards
 */
export function SparklineBars({
  values,
  colorClass = "bg-zinc-900",
}: {
  values: number[];
  colorClass?: string;
}) {
  const max = Math.max(...values, 1);
  return (
    <div className="inline-flex items-end gap-[3px] h-7 px-1">
      {values.map((v, i) => {
        const hPct = Math.max(18, Math.round((v / max) * 100));
        const isLast = i === values.length - 1;
        return (
          <span
            key={i}
            style={{ height: `${hPct}%` }}
            className={`w-1.5 rounded-t-[2px] transition-all duration-300 ${
              isLast ? colorClass : "bg-zinc-200 group-hover:bg-zinc-300"
            }`}
          />
        );
      })}
    </div>
  );
}

/**
 * Shadcn Segmented Pill Control
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string; count?: number | string }[];
  value: T;
  onChange: (val: T) => void;
}) {
  return (
    <div className="inline-flex items-center p-1 rounded-lg bg-zinc-100 border border-zinc-200/80 gap-0.5">
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              active
                ? "bg-white text-zinc-950 shadow-2xs border border-zinc-200/60 font-semibold"
                : "text-zinc-600 hover:text-zinc-950"
            }`}
          >
            <span>{opt.label}</span>
            {opt.count !== undefined && (
              <span
                className={`font-mono text-[10px] px-1.5 py-0.2 rounded ${
                  active
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-200/80 text-zinc-600"
                }`}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Shadcn Sheet / Slide-Over Drawer Component
 */
export function SlideOverDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  children,
  widthClass = "max-w-xl",
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: string;
  children: React.ReactNode;
  widthClass?: string;
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-zinc-950/40 backdrop-blur-[2px] transition-opacity"
      />
      {/* Slide-over panel */}
      <div
        className={`relative z-10 w-full ${widthClass} bg-white h-full shadow-2xl border-l border-zinc-200 flex flex-col justify-between overflow-hidden`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50/70 flex items-start justify-between gap-4">
          <div>
            {badge && (
              <div className="mb-1.5">
                <Badge variant="default" className="font-mono text-[10px]">
                  {badge}
                </Badge>
              </div>
            )}
            <h3 className="text-base font-bold text-zinc-950 tracking-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 rounded-md border border-zinc-200 bg-white text-xs font-medium text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
          >
            Đóng [ESC]
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">{children}</div>
      </div>
    </div>
  );
}
