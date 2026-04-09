/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState, useEffect, useMemo } from "react";
import { Scientist, Relationship, GraphData } from "@/lib/types";
import {
  getNodeRadius,
  getNodeColor,
  getEdgeWidth,
  EDGE_COLORS,
  NODE_COLORS,
} from "@/lib/graphUtils";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

interface GraphProps {
  data: GraphData;
  onNodeClick: (node: Scientist) => void;
  onEdgeClick: (edge: Relationship) => void;
  onBackgroundClick: () => void;
  searchQuery: string;
  edgeFilters: Set<Relationship["type"]>;
  highlightNodeId: string | null;
}

interface TooltipState {
  node: Scientist;
  x: number;
  y: number;
}

export default function Graph({
  data,
  onNodeClick,
  onEdgeClick,
  onBackgroundClick,
  searchQuery,
  edgeFilters,
  highlightNodeId,
}: GraphProps) {
  const graphRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [initialFit, setInitialFit] = useState(false);

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Filter links based on edge type filters
  const filteredData = useMemo(
    () => ({
      nodes: data.nodes,
      links: data.links.filter((l) => edgeFilters.has(l.type)),
    }),
    [data, edgeFilters]
  );

  // Compute neighbor set for the highlighted node (ego network)
  const neighborSet = useMemo(() => {
    if (!highlightNodeId) return null;
    const neighbors = new Set<string>();
    neighbors.add(highlightNodeId);
    for (const link of filteredData.links) {
      const srcId =
        typeof link.source === "object"
          ? (link.source as any).id
          : link.source;
      const tgtId =
        typeof link.target === "object"
          ? (link.target as any).id
          : link.target;
      if (srcId === highlightNodeId) neighbors.add(tgtId);
      if (tgtId === highlightNodeId) neighbors.add(srcId);
    }
    return neighbors;
  }, [highlightNodeId, filteredData.links]);

  // Top scientists by impact (for label display at low zoom)
  const topScientistIds = useMemo(() => {
    const sorted = [...data.nodes].sort(
      (a, b) => b.impactScore - a.impactScore
    );
    const top = new Set<string>();
    for (let i = 0; i < Math.min(15, sorted.length); i++) {
      top.add(sorted[i].id);
    }
    // Always include Nobel laureates
    for (const n of data.nodes) {
      if (n.isNobelLaureate) top.add(n.id);
    }
    return top;
  }, [data.nodes]);

  const isSearchMatch = useCallback(
    (node: Scientist) => {
      if (!searchQuery) return false;
      return node.name.toLowerCase().includes(searchQuery.toLowerCase());
    },
    [searchQuery]
  );

  const nodeCanvasObject = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const scientist = node as Scientist & { x: number; y: number; fx?: number };
      const radius = getNodeRadius(scientist);
      const searchMatch = isSearchMatch(scientist);
      const isHighlighted = highlightNodeId === scientist.id;
      const isNeighbor = neighborSet ? neighborSet.has(scientist.id) : true;
      const isHovered = hoveredNode === scientist.id;

      // Dimming logic: dim if search active and not matching, OR if ego network active and not in it
      const dimmedBySearch = searchQuery && !searchMatch && !isHighlighted;
      const dimmedByNeighbor = neighborSet && !isNeighbor;
      const dimmed = dimmedBySearch || dimmedByNeighbor;

      const alpha = dimmed ? 0.08 : 1;

      // Node circle
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(scientist.x, scientist.y, radius, 0, 2 * Math.PI, false);
      ctx.fillStyle = getNodeColor(scientist);
      ctx.fill();

      // Glow effects
      if (!dimmed) {
        if (scientist.tags.includes("rising-star")) {
          ctx.shadowColor = NODE_COLORS.risingStar;
          ctx.shadowBlur = 12;
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (scientist.isNobelLaureate) {
          ctx.shadowColor = NODE_COLORS.nobel;
          ctx.shadowBlur = 15;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // Pin indicator
      if (scientist.fx !== undefined && !dimmed) {
        ctx.beginPath();
        ctx.arc(
          scientist.x + radius * 0.7,
          scientist.y - radius * 0.7,
          2,
          0,
          2 * Math.PI
        );
        ctx.fillStyle = "#ffffff";
        ctx.fill();
      }

      // Border for selected/hovered
      if ((searchMatch || isHighlighted || isHovered) && !dimmed) {
        ctx.beginPath();
        ctx.arc(scientist.x, scientist.y, radius, 0, 2 * Math.PI, false);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = isHighlighted ? 2.5 : 1.5;
        ctx.stroke();
      }

      ctx.globalAlpha = 1;

      // Smart label rendering based on zoom level
      const shouldShowLabel = (() => {
        // Always show for hovered, selected, search matches
        if (isHovered || isHighlighted || searchMatch) return true;
        if (dimmed) return false;
        // Zoom-dependent
        if (globalScale > 3) return true; // Close zoom: all labels
        if (globalScale > 1.5) return radius > 10; // Medium: larger nodes
        // Far zoom: only top scientists
        return topScientistIds.has(scientist.id);
      })();

      if (shouldShowLabel) {
        const fontSize = Math.max(10, Math.min(14, radius * 0.8));
        const scaledFontSize = fontSize / globalScale;
        ctx.font = `500 ${scaledFontSize}px Inter, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";

        // Text outline for readability
        ctx.strokeStyle = "rgba(10, 10, 15, 0.8)";
        ctx.lineWidth = 3 / globalScale;
        ctx.lineJoin = "round";
        ctx.strokeText(
          scientist.name,
          scientist.x,
          scientist.y + radius + 3 / globalScale
        );

        ctx.fillStyle = dimmed
          ? "rgba(200,200,200,0.1)"
          : "rgba(255,255,255,0.9)";
        ctx.fillText(
          scientist.name,
          scientist.x,
          scientist.y + radius + 3 / globalScale
        );
      }
    },
    [
      searchQuery,
      highlightNodeId,
      hoveredNode,
      neighborSet,
      isSearchMatch,
      topScientistIds,
    ]
  );

  const linkColor = useCallback(
    (link: any) => {
      if (!neighborSet) {
        return EDGE_COLORS[link.type as Relationship["type"]] ?? "#737688";
      }
      // In ego-network mode, dim non-adjacent links
      const srcId =
        typeof link.source === "object" ? link.source.id : link.source;
      const tgtId =
        typeof link.target === "object" ? link.target.id : link.target;
      if (neighborSet.has(srcId) && neighborSet.has(tgtId)) {
        return EDGE_COLORS[link.type as Relationship["type"]] ?? "#737688";
      }
      return "rgba(50,50,60,0.05)";
    },
    [neighborSet]
  );

  const linkWidth = useCallback(
    (link: any) => {
      if (neighborSet) {
        const srcId =
          typeof link.source === "object" ? link.source.id : link.source;
        const tgtId =
          typeof link.target === "object" ? link.target.id : link.target;
        if (!neighborSet.has(srcId) || !neighborSet.has(tgtId)) {
          return 0.2;
        }
      }
      return getEdgeWidth(link as Relationship);
    },
    [neighborSet]
  );

  const handleNodeClick = useCallback(
    (node: any) => onNodeClick(node as Scientist),
    [onNodeClick]
  );

  const handleNodeHover = useCallback(
    (node: any) => {
      const scientist = node as Scientist | null;
      setHoveredNode(scientist ? scientist.id : null);
      document.body.style.cursor = scientist ? "pointer" : "default";

      if (scientist && node) {
        // Position tooltip near the node's screen position
        const coords = graphRef.current?.graph2ScreenCoords(node.x, node.y);
        if (coords) {
          setTooltip({ node: scientist, x: coords.x, y: coords.y });
        }
      } else {
        setTooltip(null);
      }
    },
    []
  );

  // Pin node in place after dragging
  const handleNodeDragEnd = useCallback((node: any) => {
    node.fx = node.x;
    node.fy = node.y;
  }, []);

  // Right-click to unpin
  const handleNodeRightClick = useCallback((node: any) => {
    node.fx = undefined;
    node.fy = undefined;
  }, []);

  // Click edge to show papers
  const handleLinkClick = useCallback(
    (link: any) => {
      if (link.type === "co-authored") {
        onEdgeClick(link as Relationship);
      }
    },
    [onEdgeClick]
  );

  // Click empty space to deselect
  const handleBackgroundClick = useCallback(() => {
    onBackgroundClick();
  }, [onBackgroundClick]);

  // Configure forces + zoom-to-fit on first load
  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.d3Force("charge")?.strength(-400);
      graphRef.current.d3Force("link")?.distance(120);
      graphRef.current.d3Force("center")?.strength(0.03);
    }
  }, [filteredData]);

  // Auto zoom-to-fit after initial layout settles
  useEffect(() => {
    if (graphRef.current && !initialFit && dimensions.width > 0) {
      const timer = setTimeout(() => {
        graphRef.current?.zoomToFit(400, 60);
        setInitialFit(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [dimensions, initialFit]);

  if (dimensions.width === 0) return null;

  return (
    <>
      <ForceGraph2D
        ref={graphRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={filteredData}
        nodeId="id"
        nodeCanvasObject={nodeCanvasObject}
        nodePointerAreaPaint={(
          node: any,
          color: string,
          ctx: CanvasRenderingContext2D
        ) => {
          const radius = getNodeRadius(node as Scientist);
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius + 4, 0, 2 * Math.PI, false);
          ctx.fillStyle = color;
          ctx.fill();
        }}
        linkColor={linkColor}
        linkWidth={linkWidth}
        linkDirectionalArrowLength={(link: any) =>
          link.type === "student-of" ? 6 : 0
        }
        linkDirectionalArrowRelPos={0.9}
        linkCurvature={(link: any) =>
          link.type === "student-of" ? 0.15 : 0
        }
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        onNodeDragEnd={handleNodeDragEnd}
        onNodeRightClick={handleNodeRightClick}
        onLinkClick={handleLinkClick}
        onBackgroundClick={handleBackgroundClick}
        linkPointerAreaPaint={(link: any, _color: string, ctx: CanvasRenderingContext2D) => {
          // Make co-authored edges easier to click with a wider hit area
          if (link.type !== "co-authored") return;
          const start = link.source;
          const end = link.target;
          if (!start?.x || !end?.x) return;
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.strokeStyle = "rgba(0,0,0,0)";
          ctx.lineWidth = 10;
          ctx.stroke();
        }}
        backgroundColor="#0a0a0f"
        cooldownTicks={100}
        warmupTicks={50}
        enableNodeDrag={true}
        enableZoomInteraction={true}
        enablePanInteraction={true}
      />

      {/* Hover tooltip */}
      {tooltip && !highlightNodeId && (
        <div
          className="fixed z-50 pointer-events-none bg-[#1a1a24] border border-white/15 rounded-lg px-3 py-2 shadow-xl"
          style={{
            left: Math.min(tooltip.x + 12, dimensions.width - 220),
            top: Math.max(tooltip.y - 60, 8),
          }}
        >
          <div className="text-sm font-medium text-white">
            {tooltip.node.name}
          </div>
          {tooltip.node.institution && (
            <div className="text-xs text-white/50 mt-0.5">
              {tooltip.node.institution}
            </div>
          )}
          <div className="flex items-center gap-3 mt-1.5 text-xs">
            <span className="text-white/70">
              h={tooltip.node.hIndex}
            </span>
            <span className="text-white/40">
              {tooltip.node.worksCount} papers
            </span>
            {tooltip.node.tags[0] && (
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  tooltip.node.isNobelLaureate
                    ? "bg-yellow-500/20 text-yellow-400"
                    : tooltip.node.tags[0] === "rising-star"
                    ? "bg-green-500/20 text-green-400"
                    : tooltip.node.tags[0] === "pioneer"
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-white/10 text-white/50"
                }`}
              >
                {tooltip.node.isNobelLaureate
                  ? "Nobel"
                  : tooltip.node.tags[0]}
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );
}
