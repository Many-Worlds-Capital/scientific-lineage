"use client";

import { useMemo, useState } from "react";
import { Scientist } from "@/lib/types";
import { NODE_COLORS } from "@/lib/graphUtils";

interface RisingStarsPanelProps {
  scientists: Scientist[];
  isOpen: boolean;
  onClose: () => void;
  onSelectScientist: (scientist: Scientist) => void;
}

type SortKey = "momentum" | "citationAcceleration" | "publicationAcceleration" | "collaborationBreadth";

export default function RisingStarsPanel({
  scientists,
  isOpen,
  onClose,
  onSelectScientist,
}: RisingStarsPanelProps) {
  const [sortBy, setSortBy] = useState<SortKey>("momentum");

  const rankedScientists = useMemo(() => {
    return scientists
      .filter((s) => s.risingStarSignals && s.risingStarSignals.momentum > 0)
      .sort((a, b) => {
        const aVal = a.risingStarSignals?.[sortBy] ?? 0;
        const bVal = b.risingStarSignals?.[sortBy] ?? 0;
        return bVal - aVal;
      })
      .slice(0, 30);
  }, [scientists, sortBy]);

  if (!isOpen) return null;

  return (
    <div className="fixed left-0 top-0 h-full w-96 bg-[#12121a] border-r border-white/10 shadow-2xl overflow-y-auto z-50 animate-slide-in-left">
      {/* Header */}
      <div className="sticky top-0 bg-[#12121a] border-b border-white/10 p-5 z-10">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-heading font-bold text-white flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: NODE_COLORS.risingStar,
                  boxShadow: `0 0 8px ${NODE_COLORS.risingStar}`,
                }}
              />
              Rising Stars
            </h2>
            <p className="text-xs text-white/40 mt-1">
              Researchers with accelerating impact
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Sort controls */}
        <div className="flex gap-1 mt-3 flex-wrap">
          {(
            [
              { key: "momentum", label: "Overall" },
              { key: "citationAcceleration", label: "Citations" },
              { key: "publicationAcceleration", label: "Papers" },
              { key: "collaborationBreadth", label: "Collaborations" },
            ] as { key: SortKey; label: string }[]
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                sortBy === key
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-white/5 text-white/50 border border-transparent hover:text-white/70"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="p-3">
        {rankedScientists.map((scientist, index) => {
          const signals = scientist.risingStarSignals!;
          return (
            <button
              key={scientist.id}
              onClick={() => onSelectScientist(scientist)}
              className="w-full text-left p-3 rounded-lg hover:bg-white/5 transition-colors group"
            >
              <div className="flex items-start gap-3">
                <span className="text-white/30 text-sm font-mono w-6 text-right shrink-0 pt-0.5">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium text-sm truncate group-hover:text-green-400 transition-colors">
                      {scientist.name}
                    </span>
                    {scientist.tags.includes("founder") && (
                      <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] rounded font-medium shrink-0">
                        founder
                      </span>
                    )}
                  </div>
                  {scientist.institution && (
                    <div className="text-xs text-white/40 truncate mt-0.5">
                      {scientist.institution}
                    </div>
                  )}

                  {/* Signal bars */}
                  <div className="flex gap-3 mt-2 text-[10px]">
                    <SignalBadge
                      label="Momentum"
                      value={signals.momentum}
                      max={1}
                      highlight={sortBy === "momentum"}
                    />
                    <SignalBadge
                      label="Cite accel"
                      value={signals.citationAcceleration}
                      max={2}
                      highlight={sortBy === "citationAcceleration"}
                      format="pct"
                    />
                    <SignalBadge
                      label="Collabs"
                      value={signals.collaborationBreadth}
                      max={50}
                      highlight={sortBy === "collaborationBreadth"}
                      format="int"
                    />
                  </div>
                </div>
              </div>
            </button>
          );
        })}

        {rankedScientists.length === 0 && (
          <p className="text-sm text-white/40 text-center py-8">
            No rising star data available
          </p>
        )}
      </div>
    </div>
  );
}

function SignalBadge({
  label,
  value,
  max,
  highlight,
  format = "score",
}: {
  label: string;
  value: number;
  max: number;
  highlight: boolean;
  format?: "score" | "pct" | "int";
}) {
  const pct = Math.min(100, (Math.max(0, value) / max) * 100);
  const displayValue =
    format === "pct"
      ? `${value > 0 ? "+" : ""}${Math.round(value * 100)}%`
      : format === "int"
      ? String(Math.round(value))
      : value.toFixed(2);

  return (
    <div className="flex-1">
      <div className={`${highlight ? "text-green-400" : "text-white/30"}`}>
        {label}
      </div>
      <div className="mt-0.5 h-1 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            backgroundColor: highlight ? NODE_COLORS.risingStar : "rgba(255,255,255,0.2)",
          }}
        />
      </div>
      <div className={`mt-0.5 ${highlight ? "text-green-400" : "text-white/50"}`}>
        {displayValue}
      </div>
    </div>
  );
}
