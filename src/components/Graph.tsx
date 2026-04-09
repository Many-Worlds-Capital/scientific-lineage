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

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Spread initial positions: pioneers/Nobel outer ring, rest inner.
  // Only x/y — NO fx/fy so forces can work.
  const initializedNodes = useMemo(() => {
    const size = Math.min(dimensions.width || 1400, dimensions.height || 900);
    const outerR = size * 0.38;
    const innerR = size * 0.2;

    const outer: typeof data.nodes = [];
    const inner: typeof data.nodes = [];
    for (const node of data.nodes) {
      if (node.isNobelLaureate || node.tags.includes("pioneer")) {
        outer.push(node);
      } else {
        inner.push(node);
      }
    }

    const positioned: any[] = [];

    for (let i = 0; i < outer.length; i++) {
      const angle = (2 * Math.PI * i) / outer.length - Math.PI / 2;
      positioned.push({
        ...outer[i],
        x: Math.cos(angle) * outerR,
        y: Math.sin(angle) * outerR,
      });
    }

    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < inner.length; i++) {
      const angle = i * golden;
      const r = Math.sqrt((i + 1) / (inner.length + 1)) * innerR;
      positioned.push({
        ...inner[i],
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
      });
    }

    return positioned;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.nodes.length, dimensions.width, dimensions.height]);

  // Filter links by edge type toggles (keep all weights)
  const filteredData = useMemo(
    () => ({
      nodes: initializedNodes,
      links: data.links.filter((l) => edgeFilters.has(l.type)),
    }),
    [initializedNodes, data.links, edgeFilters]
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
      if (neighborSet) {
        // In ego-network mode, dim non-adjacent links
        const srcId =
          typeof link.source === "object" ? link.source.id : link.source;
        const tgtId =
          typeof link.target === "object" ? link.target.id : link.target;
        if (!neighborSet.has(srcId) || !neighborSet.has(tgtId)) {
          return "rgba(50,50,60,0.05)";
        }
      }

      // Fade weak co-authored edges
      if (link.type === "co-authored") {
        const w = link.weight ?? 1;
        if (w <= 2) return "rgba(115, 118, 136, 0.15)";
        if (w <= 5) return "rgba(115, 118, 136, 0.4)";
      }

      return EDGE_COLORS[link.type as Relationship["type"]] ?? "#737688";
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

  // Change cursor on link hover
  const handleLinkHover = useCallback((link: any) => {
    document.body.style.cursor = link && link.type === "co-authored" ? "pointer" : "default";
  }, []);

  // Pin node in place after dragging
  const handleNodeDragEnd = useCallback((node: any) => {
    node.fx = node.x;
    node.fy = node.y;
    node._userDragged = true;
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

  // Configure gentle forces — DON'T null them, just tune them soft.
  // Forces let nodes drift slightly while keeping the spread layout.
  const forcesConfigured = useRef(false);
  useEffect(() => {
    const fg = graphRef.current;
    if (!fg) return;

    // Gentle charge repulsion — prevents collapse
    fg.d3Force("charge")?.strength(-200);

    // Remove center force so graph doesn't pull to middle
    fg.d3Force("center", null);

    // Very weak link force — connected nodes drift closer slowly
    const linkForce = fg.d3Force("link");
    if (linkForce) {
      linkForce.distance(250);
      linkForce.strength(() => 0.003);
    }

    // Add collision detection once
    if (!forcesConfigured.current) {
      import("d3-force-3d").then((d3) => {
        fg.d3Force(
          "collide",
          d3.forceCollide().radius((node: any) => getNodeRadius(node as Scientist) + 6)
        );
      }).catch(() => {});
      forcesConfigured.current = true;
    }

    // Zoom to fit after a moment
    setTimeout(() => fg.zoomToFit(400, 40), 500);
  }, [filteredData]);

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
        onLinkHover={handleLinkHover}
        onBackgroundClick={handleBackgroundClick}
        linkPointerAreaPaint={(link: any, color: string, ctx: CanvasRenderingContext2D) => {
          const start = link.source;
          const end = link.target;
          if (!start?.x || !end?.x) return;
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.strokeStyle = color;
          ctx.lineWidth = link.type === "co-authored" ? 12 : 6;
          ctx.stroke();
        }}
        backgroundColor="#0a0a0f"
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.4}
        cooldownTicks={300}
        warmupTicks={0}
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
