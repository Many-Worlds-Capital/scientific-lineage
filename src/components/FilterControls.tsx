"use client";

import { Relationship } from "@/lib/types";
import { EDGE_COLORS, EDGE_LABELS, NODE_COLORS } from "@/lib/graphUtils";

interface FilterControlsProps {
  edgeFilters: Set<Relationship["type"]>;
  onToggleEdge: (type: Relationship["type"]) => void;
  nodeFilters: Set<string>;
  onToggleNode: (type: string) => void;
  minCoauthorWeight: number;
  onMinCoauthorWeightChange: (n: number) => void;
}

const EDGE_TYPES: Relationship["type"][] = [
  "student-of",
  "co-authored",
];

const NODE_TYPES = [
  { key: "nobel", label: "Nobel Laureate", color: NODE_COLORS.nobel },
  { key: "prominent", label: "Prominent", color: NODE_COLORS.prominent },
  { key: "active", label: "Active", color: NODE_COLORS.active },
  { key: "rising-star", label: "Rising Star", color: NODE_COLORS.risingStar },
];

export default function FilterControls({
  edgeFilters,
  onToggleEdge,
  nodeFilters,
  onToggleNode,
  minCoauthorWeight,
  onMinCoauthorWeightChange,
}: FilterControlsProps) {
  return (
    <div className="bg-[#12121a]/90 backdrop-blur border border-white/10 rounded-lg p-4 text-xs">
      <h3 className="text-white/60 uppercase tracking-wider font-medium mb-3">
        Filter Nodes
      </h3>
      <div className="space-y-2 mb-4">
        {NODE_TYPES.map(({ key, label, color }) => (
          <label
            key={key}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <input
              type="checkbox"
              checked={nodeFilters.has(key)}
              onChange={() => onToggleNode(key)}
              className="sr-only"
            />
            <span
              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                nodeFilters.has(key)
                  ? "border-white/40 bg-white/10"
                  : "border-white/20"
              }`}
            >
              {nodeFilters.has(key) && (
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
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-white/70 group-hover:text-white transition-colors">
              {label}
            </span>
          </label>
        ))}
      </div>

      <h3 className="text-white/60 uppercase tracking-wider font-medium mb-3 border-t border-white/10 pt-3">
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

      <h3 className="text-white/60 uppercase tracking-wider font-medium mb-3 mt-4 border-t border-white/10 pt-3">
        Min Co-authored Papers
      </h3>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5, 10].map((n) => (
          <button
            key={n}
            onClick={() => onMinCoauthorWeightChange(n)}
            className={`flex-1 px-2 py-1.5 rounded text-xs transition-colors ${
              minCoauthorWeight === n
                ? "bg-white/15 text-white border border-white/30"
                : "bg-white/5 text-white/60 border border-white/10 hover:text-white hover:border-white/20"
            }`}
          >
            {n === 1 ? "All" : `${n}+`}
          </button>
        ))}
      </div>
    </div>
  );
}
