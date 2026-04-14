"use client";

import { EDGE_COLORS, EDGE_LABELS, NODE_COLORS } from "@/lib/graphUtils";

export default function Legend() {
  return (
    <div className="bg-[#12121a]/90 backdrop-blur border border-white/10 rounded-lg p-4 text-xs">
      <h3 className="text-white/60 uppercase tracking-wider font-medium mb-3">
        Legend
      </h3>

      {/* Node types */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: NODE_COLORS.nobel, boxShadow: `0 0 6px ${NODE_COLORS.nobel}` }}
          />
          <span className="text-white/70">Nobel Laureate</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: NODE_COLORS.prominent }}
          />
          <span className="text-white/70">Prominent</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: NODE_COLORS.active }}
          />
          <span className="text-white/70">Active</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: NODE_COLORS.risingStar, boxShadow: `0 0 6px ${NODE_COLORS.risingStar}` }}
          />
          <span className="text-white/70">Rising Star</span>
        </div>
      </div>

      {/* Edge types */}
      <div className="space-y-2 border-t border-white/10 pt-3">
        {(Object.keys(EDGE_COLORS) as Array<keyof typeof EDGE_COLORS>).map(
          (type) => (
            <div key={type} className="flex items-center gap-2">
              <span
                className="w-5 h-0.5 rounded"
                style={{ backgroundColor: EDGE_COLORS[type] }}
              />
              <span className="text-white/70">{EDGE_LABELS[type]}</span>
            </div>
          )
        )}
      </div>

      {/* Tags */}
      <div className="space-y-2 border-t border-white/10 pt-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm bg-purple-400/60" />
          <span className="text-white/70">Founder</span>
        </div>
      </div>

      {/* Node size */}
      <div className="border-t border-white/10 pt-3 mt-3">
        <div className="flex items-end gap-1">
          <span className="w-2 h-2 rounded-full bg-white/30" />
          <span className="w-3 h-3 rounded-full bg-white/30" />
          <span className="w-5 h-5 rounded-full bg-white/30" />
          <span className="text-white/50 ml-1">= Impact score</span>
        </div>
      </div>

      {/* Interaction hints */}
      <div className="border-t border-white/10 pt-3 mt-3 space-y-1 text-white/40">
        <p>Click node to focus</p>
        <p>Drag to pin, right-click to unpin</p>
      </div>
    </div>
  );
}
