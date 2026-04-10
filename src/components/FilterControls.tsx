"use client";

import { Relationship } from "@/lib/types";
import { EDGE_COLORS, EDGE_LABELS } from "@/lib/graphUtils";

interface FilterControlsProps {
  edgeFilters: Set<Relationship["type"]>;
  onToggleEdge: (type: Relationship["type"]) => void;
}

const EDGE_TYPES: Relationship["type"][] = [
  "student-of",
  "co-authored",
];

export default function FilterControls({
  edgeFilters,
  onToggleEdge,
}: FilterControlsProps) {
  return (
    <div className="bg-[#12121a]/90 backdrop-blur border border-white/10 rounded-lg p-4 text-xs">
      <h3 className="text-white/60 uppercase tracking-wider font-medium mb-3">
        Filter Edges
      </h3>
      <div className="space-y-2">
        {EDGE_TYPES.map((type) => (
          <label
            key={type}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <input
              type="checkbox"
              checked={edgeFilters.has(type)}
              onChange={() => onToggleEdge(type)}
              className="sr-only"
            />
            <span
              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                edgeFilters.has(type)
                  ? "border-white/40 bg-white/10"
                  : "border-white/20"
              }`}
            >
              {edgeFilters.has(type) && (
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </span>
            <span
              className="w-3 h-0.5 rounded"
              style={{ backgroundColor: EDGE_COLORS[type] }}
            />
            <span className="text-white/70 group-hover:text-white transition-colors">
              {EDGE_LABELS[type]}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
