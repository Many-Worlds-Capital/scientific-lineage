"use client";

import { useState } from "react";
import { Scientist, Relationship } from "@/lib/types";
import { EDGE_COLORS } from "@/lib/graphUtils";

interface ScientistPanelProps {
  scientist: Scientist | null;
  relationships: Relationship[];
  onClose: () => void;
}

export default function ScientistPanel({
  scientist,
  relationships,
  onClose,
}: ScientistPanelProps) {
  const [showAllAffiliations, setShowAllAffiliations] = useState(false);

  if (!scientist) return null;

  // Compute connections for this scientist
  const connections = relationships.filter(
    (r) => {
      const srcId = typeof r.source === "object" ? (r.source as Scientist).id : r.source;
      const tgtId = typeof r.target === "object" ? (r.target as Scientist).id : r.target;
      return srcId === scientist.id || tgtId === scientist.id;
    }
  );

  const connectionsByType = {
    "student-of": connections.filter((r) => r.type === "student-of"),
    "co-authored": connections.filter((r) => r.type === "co-authored"),
    "same-lab": connections.filter((r) => r.type === "same-lab"),
  };

  const affiliations = scientist.affiliationHistory;
  const visibleAffiliations = showAllAffiliations
    ? affiliations
    : affiliations.slice(0, 5);

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-[#12121a] border-l border-white/10 shadow-2xl overflow-y-auto z-50 animate-slide-in">
      {/* Header */}
      <div className="sticky top-0 bg-[#12121a] border-b border-white/10 p-5 z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1 mr-3">
            <h2 className="text-xl font-heading font-bold text-white">
              {scientist.name}
            </h2>
            {scientist.institution && (
              <p className="text-sm text-white/60 mt-1">
                {scientist.institution}
                {scientist.country && ` (${scientist.country})`}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Tags */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {scientist.isNobelLaureate && (
            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full font-medium">
              Nobel Laureate
            </span>
          )}
          {scientist.tags.map((tag) => (
            <span
              key={tag}
              className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                tag === "pioneer"
                  ? "bg-primary-dark/20 text-blue-400"
                  : tag === "rising-star"
                  ? "bg-accent-green/20 text-green-400"
                  : "bg-white/10 text-white/60"
              }`}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Metrics */}
      <div className="p-5 border-b border-white/10">
        <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
          Metrics
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <MetricCard label="h-index" value={scientist.hIndex} />
          <MetricCard
            label="Citations"
            value={formatNumber(scientist.citedByCount)}
          />
          <MetricCard label="Papers" value={scientist.worksCount} />
        </div>
      </div>

      {/* Connections in the graph */}
      <div className="p-5 border-b border-white/10">
        <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
          Connections in graph
        </h3>
        <div className="space-y-2">
          {(Object.entries(connectionsByType) as [Relationship["type"], Relationship[]][]).map(
            ([type, rels]) =>
              rels.length > 0 && (
                <div key={type} className="flex items-center gap-2 text-sm">
                  <span
                    className="w-3 h-0.5 rounded shrink-0"
                    style={{ backgroundColor: EDGE_COLORS[type] }}
                  />
                  <span className="text-white/70">
                    {rels.length}{" "}
                    {type === "student-of"
                      ? "advisor/student"
                      : type === "co-authored"
                      ? "co-author"
                      : "same-lab"}{" "}
                    {rels.length === 1 ? "link" : "links"}
                  </span>
                </div>
              )
          )}
          {connections.length === 0 && (
            <p className="text-sm text-white/40">No connections in current view</p>
          )}
        </div>
      </div>

      {/* Known for */}
      {scientist.knownFor.length > 0 && (
        <div className="p-5 border-b border-white/10">
          <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
            Known for
          </h3>
          <ul className="space-y-1.5">
            {scientist.knownFor.map((item, i) => (
              <li key={i} className="text-sm text-white/80 flex items-start">
                <span className="text-primary mr-2 mt-0.5">&#x2022;</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Top Topics */}
      {scientist.topTopics.length > 0 && (
        <div className="p-5 border-b border-white/10">
          <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
            Research Topics
          </h3>
          <div className="flex flex-wrap gap-2">
            {scientist.topTopics.map((topic, i) => (
              <span
                key={i}
                className="px-2 py-1 bg-white/5 text-white/70 text-xs rounded"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Affiliations */}
      {affiliations.length > 0 && (
        <div className="p-5 border-b border-white/10">
          <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
            Affiliations
          </h3>
          <ul className="space-y-2">
            {visibleAffiliations.map((aff, i) => (
              <li key={i} className="text-sm">
                <span className="text-white/80">{aff.name}</span>
                <span className="text-white/40 ml-2 text-xs">{aff.years}</span>
              </li>
            ))}
          </ul>
          {affiliations.length > 5 && (
            <button
              onClick={() => setShowAllAffiliations(!showAllAffiliations)}
              className="text-xs text-primary hover:text-primary-dark mt-2 transition-colors"
            >
              {showAllAffiliations
                ? "Show less"
                : `Show all ${affiliations.length} affiliations`}
            </button>
          )}
        </div>
      )}

      {/* Links */}
      <div className="p-5">
        <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
          Links
        </h3>
        <div className="flex flex-col gap-2">
          <a
            href={scientist.openAlexUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:text-primary-dark transition-colors"
          >
            View on OpenAlex &rarr;
          </a>
          {scientist.orcid && (
            <a
              href={scientist.orcid}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:text-primary-dark transition-colors"
            >
              ORCID Profile &rarr;
            </a>
          )}
          <a
            href={`https://scholar.google.com/scholar?q=author:"${encodeURIComponent(scientist.name)}"`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:text-primary-dark transition-colors"
          >
            Google Scholar &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white/5 rounded-lg p-3 text-center">
      <div className="text-lg font-heading font-bold text-white">{value}</div>
      <div className="text-xs text-white/40 mt-0.5">{label}</div>
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}
