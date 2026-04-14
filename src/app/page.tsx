"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Graph from "@/components/Graph";
import ScientistPanel from "@/components/ScientistPanel";
import EdgePanel from "@/components/EdgePanel";
import SearchBar from "@/components/SearchBar";
import Legend from "@/components/Legend";
import FilterControls from "@/components/FilterControls";
import MethodologyModal from "@/components/MethodologyModal";
import TimelineSlider from "@/components/TimelineSlider";
import { Scientist, Relationship, GraphData } from "@/lib/types";

export default function Home() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [selectedScientist, setSelectedScientist] = useState<Scientist | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Relationship | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [edgeFilters, setEdgeFilters] = useState<Set<Relationship["type"]>>(
    () => new Set<Relationship["type"]>(["student-of", "co-authored"])
  );
  const [nodeFilters, setNodeFilters] = useState<Set<string>>(
    () => new Set(["nobel", "prominent", "active", "rising-star"])
  );
  const [minCoauthorWeight, setMinCoauthorWeight] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [showMethodology, setShowMethodology] = useState(false);
  const [timelineRange, setTimelineRange] = useState<[number, number] | null>(null);

  // Compute year bounds from data
  const yearBounds = useMemo(() => {
    if (!graphData) return { min: 2000, max: 2026 };
    let min = 2100, max = 1900;
    for (const link of graphData.links) {
      if (link.yearRange) {
        if (link.yearRange[0] < min) min = link.yearRange[0];
        if (link.yearRange[1] > max) max = link.yearRange[1];
      }
    }
    return { min: min > max ? 2000 : min, max: max < min ? 2026 : max };
  }, [graphData]);

  useEffect(() => {
    async function loadData() {
      try {
        const [scientistsRes, relationshipsRes] = await Promise.all([
          fetch("/data/scientists.json"),
          fetch("/data/relationships.json"),
        ]);
        const scientists: Scientist[] = await scientistsRes.json();
        const relationships: Relationship[] = await relationshipsRes.json();
        const data = { nodes: scientists, links: relationships };
        setGraphData(data);

        // Restore selection from URL
        const params = new URLSearchParams(window.location.search);
        const scientistId = params.get("scientist");
        if (scientistId) {
          const match = scientists.find((s) => s.id === scientistId);
          if (match) setSelectedScientist(match);
        }
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Initialize timeline range once data loads
  useEffect(() => {
    if (graphData && !timelineRange) {
      setTimelineRange([yearBounds.min, yearBounds.max]);
    }
  }, [graphData, yearBounds, timelineRange]);

  const selectScientist = useCallback((scientist: Scientist | null) => {
    setSelectedScientist(scientist);
    setSelectedEdge(null);
    const url = new URL(window.location.href);
    if (scientist) {
      url.searchParams.set("scientist", scientist.id);
    } else {
      url.searchParams.delete("scientist");
    }
    window.history.replaceState({}, "", url.toString());
  }, []);

  const handleNodeClick = useCallback(
    (node: Scientist) => selectScientist(node),
    [selectScientist]
  );

  const handleEdgeClick = useCallback((edge: Relationship) => {
    setSelectedEdge(edge);
    setSelectedScientist(null);
  }, []);

  const handleBackgroundClick = useCallback(() => {
    selectScientist(null);
    setSelectedEdge(null);
  }, [selectScientist]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleSearchSelect = useCallback(
    (scientist: Scientist) => selectScientist(scientist),
    [selectScientist]
  );

  const handleToggleEdge = useCallback((type: Relationship["type"]) => {
    setEdgeFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  const handleToggleNode = useCallback((type: string) => {
    setNodeFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  const handleTimelineChange = useCallback((range: [number, number]) => {
    setTimelineRange(range);
  }, []);

  const handleMinWeightChange = useCallback((n: number) => {
    setMinCoauthorWeight(n);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0f]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60 font-body text-sm">Loading scientific lineage...</p>
        </div>
      </div>
    );
  }

  if (!graphData) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0f]">
        <div className="text-center">
          <p className="text-white/60 font-body text-sm">
            No data found. Run{" "}
            <code className="bg-white/10 px-1 rounded">npx tsx scripts/generate-data.ts</code>{" "}
            to generate data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#0a0a0f]">
      {/* Graph */}
      <Graph
        data={graphData}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onBackgroundClick={handleBackgroundClick}
        searchQuery={searchQuery}
        edgeFilters={edgeFilters}
        nodeFilters={nodeFilters}
        highlightNodeId={selectedScientist?.id ?? null}
        timelineRange={timelineRange}
        minCoauthorWeight={minCoauthorWeight}
      />

      {/* Title */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <h1 className="font-heading text-lg font-bold text-white/80 tracking-wide">
          Quantum Computing Scientific Lineage
        </h1>
      </div>

      {/* Search - top left */}
      <div className="absolute top-5 left-5 z-20">
        <SearchBar
          scientists={graphData.nodes}
          onSearch={handleSearch}
          onSelect={handleSearchSelect}
        />
      </div>

      {/* Filter controls - top right */}
      <div className="absolute top-5 right-5 z-10">
        <FilterControls
          edgeFilters={edgeFilters}
          onToggleEdge={handleToggleEdge}
          nodeFilters={nodeFilters}
          onToggleNode={handleToggleNode}
          minCoauthorWeight={minCoauthorWeight}
          onMinCoauthorWeightChange={handleMinWeightChange}
        />
      </div>

      {/* Legend - bottom left */}
      <div className="absolute bottom-5 left-5 z-10">
        <Legend />
      </div>

      {/* Timeline slider - bottom center */}
      {timelineRange && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 w-[480px] max-w-[calc(100vw-400px)]">
          <TimelineSlider
            minYear={yearBounds.min}
            maxYear={yearBounds.max}
            value={timelineRange}
            onChange={handleTimelineChange}
          />
        </div>
      )}

      {/* Bottom right: stats + methodology */}
      <div className="absolute bottom-5 right-5 z-10 flex items-center gap-2">
        <button
          onClick={() => setShowMethodology(true)}
          className="bg-[#12121a]/90 backdrop-blur border border-white/10 rounded-lg px-4 py-3 text-xs text-white/50 hover:text-white/80 hover:border-white/20 transition-colors"
        >
          Methodology
        </button>
        <div className="bg-[#12121a]/90 backdrop-blur border border-white/10 rounded-lg px-4 py-3 text-xs text-white/50">
          {graphData.nodes.length} scientists &middot;{" "}
          {graphData.links.length} connections
        </div>
      </div>

      {/* Scientist detail panel */}
      <ScientistPanel
        scientist={selectedScientist}
        relationships={graphData.links}
        onClose={() => selectScientist(null)}
      />

      {/* Edge detail panel */}
      <EdgePanel
        edge={selectedEdge}
        scientists={graphData.nodes}
        onClose={() => setSelectedEdge(null)}
      />

      {/* Methodology modal */}
      <MethodologyModal
        isOpen={showMethodology}
        onClose={() => setShowMethodology(false)}
      />
    </main>
  );
}
