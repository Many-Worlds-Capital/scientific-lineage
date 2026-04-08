"use client";

import { useState, useEffect, useCallback } from "react";
import Graph from "@/components/Graph";
import ScientistPanel from "@/components/ScientistPanel";
import SearchBar from "@/components/SearchBar";
import Legend from "@/components/Legend";
import FilterControls from "@/components/FilterControls";
import MethodologyModal from "@/components/MethodologyModal";
import { Scientist, Relationship, GraphData } from "@/lib/types";

export default function Home() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [selectedScientist, setSelectedScientist] = useState<Scientist | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [edgeFilters, setEdgeFilters] = useState<Set<Relationship["type"]>>(
    () => new Set<Relationship["type"]>(["student-of", "co-authored"])
  );
  const [loading, setLoading] = useState(true);
  const [showMethodology, setShowMethodology] = useState(false);

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

  const selectScientist = useCallback((scientist: Scientist | null) => {
    setSelectedScientist(scientist);
    // Update URL
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

  const handleBackgroundClick = useCallback(
    () => selectScientist(null),
    [selectScientist]
  );

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
        onBackgroundClick={handleBackgroundClick}
        searchQuery={searchQuery}
        edgeFilters={edgeFilters}
        highlightNodeId={selectedScientist?.id ?? null}
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
        />
      </div>

      {/* Legend - bottom left */}
      <div className="absolute bottom-5 left-5 z-10">
        <Legend />
      </div>

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

      {/* Methodology modal */}
      <MethodologyModal
        isOpen={showMethodology}
        onClose={() => setShowMethodology(false)}
      />
    </main>
  );
}
