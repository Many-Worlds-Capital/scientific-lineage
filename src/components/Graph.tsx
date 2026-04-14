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
  nodeFilters: Set<string>;
  highlightNodeId: string | null;
  timelineRange: [number, number] | null;
  minCoauthorWeight: number;
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
  nodeFilters,
  highlightNodeId,
  timelineRange,
  minCoauthorWeight,
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

  // Determine which filter category a scientist belongs to
  const getNodeCategory = useCallback((node: Scientist): string => {
    if (node.isNobelLaureate) return "nobel";
    if (node.tags.includes("rising-star")) return "rising-star";
    if (node.tags.includes("prominent")) return "prominent";
    return "active";
  }, []);

  // Constellation layout: three concentric shells with positional anchors.
  // __anchorX/__anchorY are consumed by forceX/forceY; __shell tunes their strength.
  const initializedNodes = useMemo(() => {
    const R =
      Math.max(dimensions.width || 1400, dimensions.height || 900) * 0.55;

    const outer: typeof data.nodes = [];
    const mid: typeof data.nodes = [];
    const inner: typeof data.nodes = [];
    for (const node of data.nodes) {
      if (node.isNobelLaureate) outer.push(node);
      else if (node.tags.includes("prominent")) mid.push(node);
      else inner.push(node);
    }

    const positioned: any[] = [];
    const golden = Math.PI * (3 - Math.sqrt(5));

    // Outer shell: Nobel laureates on a ~0.95R ring with ±3% jitter
    const outerBase = R * 0.95;
    for (let i = 0; i < outer.length; i++) {
      const angle = (2 * Math.PI * i) / outer.length - Math.PI / 2;
      const jitter = 1 + (Math.sin(i * 12.9898) * 43758.5453) % 0.06 - 0.03;
      const r = outerBase * jitter;
      positioned.push({
        ...outer[i],
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
        __anchorX: Math.cos(angle) * r,
        __anchorY: Math.sin(angle) * r,
        __shell: "outer",
      });
    }

    // Middle shell: prominent on a 0.5R–0.75R annulus via golden-angle
    for (let i = 0; i < mid.length; i++) {
      const angle = i * golden;
      const t = (i + 0.5) / Math.max(mid.length, 1);
      const r = R * (0.5 + t * 0.25);
      positioned.push({
        ...mid[i],
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
        __anchorX: Math.cos(angle) * r,
        __anchorY: Math.sin(angle) * r,
        __shell: "mid",
      });
    }

    // Inner shell: everyone else via Vogel spiral up to 0.45R
    const innerR = R * 0.45;
    for (let i = 0; i < inner.length; i++) {
      const angle = i * golden;
      const r = Math.sqrt((i + 1) / (inner.length + 1)) * innerR;
      positioned.push({
        ...inner[i],
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
        __anchorX: Math.cos(angle) * r,
        __anchorY: Math.sin(angle) * r,
        __shell: "inner",
      });
    }

    return positioned;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.nodes.length, dimensions.width, dimensions.height]);

  // Filter links by edge type toggles and timeline range
  const filteredData = useMemo(
    () => ({
      nodes: initializedNodes,
      links: data.links.filter((l) => {
        if (!edgeFilters.has(l.type)) return false;
        if (l.type === "co-authored" && l.weight < minCoauthorWeight) return false;
        // Timeline filtering: only filter co-authored edges with yearRange data
        if (timelineRange && l.type === "co-authored" && l.yearRange) {
          const [filterMin, filterMax] = timelineRange;
          const [edgeMin, edgeMax] = l.yearRange;
          // Show edge if its year range overlaps with the filter range
          if (edgeMax < filterMin || edgeMin > filterMax) return false;
        }
        return true;
      }),
    }),
    [initializedNodes, data.links, edgeFilters, timelineRange, minCoauthorWeight]
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

  // Per-node degree from currently-filtered links — used to fade hub-to-hub mesh
  const degreeMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const link of filteredData.links) {
      const srcId =
        typeof link.source === "object"
          ? (link.source as any).id
          : (link.source as string);
      const tgtId =
        typeof link.target === "object"
          ? (link.target as any).id
          : (link.target as string);
      m.set(srcId, (m.get(srcId) ?? 0) + 1);
      m.set(tgtId, (m.get(tgtId) ?? 0) + 1);
    }
    return m;
  }, [filteredData.links]);

  // Top scientists by impact (for label display at low zoom). Kept small so
  // the initial view isn't a wall of overlapping names.
  const topScientistIds = useMemo(() => {
    const sorted = [...data.nodes].sort(
      (a, b) => b.impactScore - a.impactScore
    );
    const top = new Set<string>();
    for (let i = 0; i < Math.min(8, sorted.length); i++) {
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

      // Dimming logic: dim if search active and not matching, OR if ego network active and not in it, OR if node type filtered out
      const dimmedBySearch = searchQuery && !searchMatch && !isHighlighted;
      const dimmedByNeighbor = neighborSet && !isNeighbor;
      const dimmedByFilter = !nodeFilters.has(getNodeCategory(scientist));
      const dimmed = dimmedBySearch || dimmedByNeighbor || dimmedByFilter;

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

        const labelY = scientist.y + radius + 4 / globalScale;

        // Pill background so names read against the constellation mesh
        if (!dimmed) {
          const metrics = ctx.measureText(scientist.name);
          const padX = 5 / globalScale;
          const padY = 2.5 / globalScale;
          const w = metrics.width + padX * 2;
          const h = scaledFontSize + padY * 2;
          const rx = 3 / globalScale;
          const x = scientist.x - w / 2;
          ctx.fillStyle = "rgba(10, 10, 15, 0.72)";
          ctx.beginPath();
          ctx.moveTo(x + rx, labelY);
          ctx.lineTo(x + w - rx, labelY);
          ctx.quadraticCurveTo(x + w, labelY, x + w, labelY + rx);
          ctx.lineTo(x + w, labelY + h - rx);
          ctx.quadraticCurveTo(x + w, labelY + h, x + w - rx, labelY + h);
          ctx.lineTo(x + rx, labelY + h);
          ctx.quadraticCurveTo(x, labelY + h, x, labelY + h - rx);
          ctx.lineTo(x, labelY + rx);
          ctx.quadraticCurveTo(x, labelY, x + rx, labelY);
          ctx.closePath();
          ctx.fill();
        }

        ctx.fillStyle = dimmed
          ? "rgba(200,200,200,0.1)"
          : "rgba(255,255,255,0.95)";
        ctx.fillText(scientist.name, scientist.x, labelY + 2.5 / globalScale);
      }
    },
    [
      searchQuery,
      highlightNodeId,
      hoveredNode,
      neighborSet,
      nodeFilters,
      getNodeCategory,
      isSearchMatch,
      topScientistIds,
    ]
  );

  const linkColor = useCallback(
    (link: any) => {
      const srcId =
        typeof link.source === "object" ? link.source.id : link.source;
      const tgtId =
        typeof link.target === "object" ? link.target.id : link.target;

      if (neighborSet) {
        if (!neighborSet.has(srcId) || !neighborSet.has(tgtId)) {
          return "rgba(50,50,60,0.05)";
        }
      }

      // Hub-to-hub fade only matters when the full mesh is visible; once the
      // co-author filter is at 5+ it has already done the decluttering work.
      const bothHubs =
        (degreeMap.get(srcId) ?? 0) > 30 && (degreeMap.get(tgtId) ?? 0) > 30;
      const hubMul = bothHubs && minCoauthorWeight < 5 ? 0.6 : 1;

      if (link.type === "co-authored") {
        const w = link.weight ?? 1;
        const alpha =
          w <= 2 ? 0.05 : w <= 5 ? 0.18 : w <= 15 ? 0.4 : 0.7;
        return `rgba(140, 145, 170, ${alpha * hubMul})`;
      }

      if (link.type === "student-of") {
        return EDGE_COLORS["student-of"];
      }

      return EDGE_COLORS[link.type as Relationship["type"]] ?? "#737688";
    },
    [neighborSet, degreeMap, minCoauthorWeight]
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
      return Math.max(0.3, getEdgeWidth(link as Relationship));
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

  // Pin node in place after dragging. Gentle reheat so neighbors jostle a little,
  // not a shockwave — the "bit of force, not huge" feel.
  const handleNodeDragEnd = useCallback((node: any) => {
    node.fx = node.x;
    node.fy = node.y;
    node._userDragged = true;
    const fg = graphRef.current;
    if (fg?.d3ReheatSimulation) {
      fg.d3ReheatSimulation();
    }
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

  // Constellation physics: charge dominates, links are purely visual,
  // per-node anchors replace the global center force with a distributed one.
  useEffect(() => {
    const fg = graphRef.current;
    if (!fg) return;

    const chargeForce = fg.d3Force("charge");
    if (chargeForce) {
      chargeForce.strength(-1800);
      chargeForce.distanceMax?.(900);
      chargeForce.theta?.(0.9);
    }

    fg.d3Force("center", null);

    const linkForce = fg.d3Force("link");
    if (linkForce) {
      linkForce.distance(250);
      linkForce.strength(() => 0);
    }

    import("d3-force-3d")
      .then((d3) => {
        fg.d3Force(
          "collide",
          d3
            .forceCollide()
            .radius((node: any) => getNodeRadius(node as Scientist) + 28)
            .strength(1)
            .iterations(2)
        );

        const anchorStrength = (node: any) =>
          node.__shell === "outer"
            ? 0.08
            : node.__shell === "mid"
            ? 0.04
            : 0.03;

        fg.d3Force(
          "x",
          d3
            .forceX((node: any) => node.__anchorX ?? 0)
            .strength(anchorStrength)
        );
        fg.d3Force(
          "y",
          d3
            .forceY((node: any) => node.__anchorY ?? 0)
            .strength(anchorStrength)
        );
      })
      .catch(() => {});

    // Frame the initial seed immediately, then again after the simulation
    // settles so the final view accounts for any force-driven drift.
    const firstFit = setTimeout(() => fg.zoomToFit(400, 80), 500);
    const settledFit = setTimeout(() => fg.zoomToFit(600, 80), 2500);
    return () => {
      clearTimeout(firstFit);
      clearTimeout(settledFit);
    };
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
        d3AlphaDecay={0.035}
        d3VelocityDecay={0.55}
        cooldownTicks={150}
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
                    : tooltip.node.tags.includes("rising-star")
                    ? "bg-green-500/20 text-green-400"
                    : tooltip.node.tags.includes("prominent")
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-white/10 text-white/50"
                }`}
              >
                {tooltip.node.isNobelLaureate
                  ? "Nobel"
                  : tooltip.node.tags.includes("rising-star")
                  ? "rising-star"
                  : tooltip.node.tags.includes("prominent")
                  ? "prominent"
                  : tooltip.node.tags[0]}
              </span>
            )}
            {tooltip.node.tags.includes("founder") && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/20 text-purple-400">
                founder
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );
}
