"use client";

import { Scientist, Relationship } from "@/lib/types";

const BRAIN_BASE = "https://brain.manyworldscapital.com";

interface EdgePanelProps {
  edge: Relationship | null;
  scientists: Scientist[];
  onClose: () => void;
}

export default function EdgePanel({ edge, scientists, onClose }: EdgePanelProps) {
  if (!edge || edge.type !== "co-authored") return null;

  const scientistMap = new Map(scientists.map((s) => [s.id, s]));
  const srcId = typeof edge.source === "object" ? (edge.source as Scientist).id : edge.source;
  const tgtId = typeof edge.target === "object" ? (edge.target as Scientist).id : edge.target;
  const src = scientistMap.get(srcId);
  const tgt = scientistMap.get(tgtId);

  if (!src || !tgt) return null;

  const papers = edge.papers ?? [];

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-[#12121a] border-l border-white/10 shadow-2xl overflow-y-auto z-50 animate-slide-in">
      {/* Header */}
      <div className="sticky top-0 bg-[#12121a] border-b border-white/10 p-5 z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1 mr-3">
            <h2 className="text-lg font-heading font-bold text-white">
              {src.name}
            </h2>
            <p className="text-sm text-white/40 my-1">&amp;</p>
            <h2 className="text-lg font-heading font-bold text-white">
              {tgt.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors text-2xl leading-none"
          >
            &times;
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="w-3 h-0.5 rounded bg-[#737688]" />
          <span className="text-sm text-white/60">
            {edge.weight} co-authored paper{edge.weight !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Papers list */}
      <div className="p-5">
        {papers.length > 0 ? (
          <>
            <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-4">
              Top papers together
            </h3>
            <div className="space-y-4">
              {papers.map((paper, i) => (
                <div
                  key={paper.openAlexId || i}
                  className="bg-white/[0.03] rounded-lg p-3 border border-white/5"
                >
                  <h4 className="text-sm text-white/90 font-medium leading-snug">
                    {paper.title}
                  </h4>
                  <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
                    {paper.year > 0 && <span>{paper.year}</span>}
                    {paper.doi && (
                      <span className="truncate max-w-[150px]">
                        DOI: {paper.doi}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 mt-3">
                    {paper.arxivId ? (
                      <a
                        href={`${BRAIN_BASE}/papers/${encodeURIComponent(paper.arxivId)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary-dark transition-colors font-medium"
                      >
                        <BrainIcon />
                        Explore on Quantum Brain &rarr;
                      </a>
                    ) : (
                      <a
                        href={`${BRAIN_BASE}/papers?q=${encodeURIComponent(paper.title)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary-dark transition-colors font-medium"
                      >
                        <BrainIcon />
                        Search on Quantum Brain &rarr;
                      </a>
                    )}
                    {paper.openAlexId && (
                      <a
                        href={`https://openalex.org/works/${paper.openAlexId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-white/30 hover:text-white/50 transition-colors"
                      >
                        View on OpenAlex &rarr;
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {edge.weight > papers.length && (
              <p className="text-xs text-white/30 mt-4 text-center">
                Showing top {papers.length} of {edge.weight} co-authored papers
              </p>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-white/40 mb-3">
              {edge.weight} co-authored paper{edge.weight !== 1 ? "s" : ""} found
            </p>
            <a
              href={`${BRAIN_BASE}/papers?q=${encodeURIComponent(src.name + " " + tgt.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary-dark transition-colors font-medium"
            >
              <BrainIcon />
              Search on Quantum Brain &rarr;
            </a>
          </div>
        )}
      </div>

      {/* Footer links */}
      <div className="p-5 border-t border-white/10">
        <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
          Explore individually
        </h3>
        <div className="flex flex-col gap-2">
          <a
            href={`${BRAIN_BASE}/papers?q=${encodeURIComponent(src.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:text-primary-dark transition-colors"
          >
            {src.name} on Quantum Brain &rarr;
          </a>
          <a
            href={`${BRAIN_BASE}/papers?q=${encodeURIComponent(tgt.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:text-primary-dark transition-colors"
          >
            {tgt.name} on Quantum Brain &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}

function BrainIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      />
    </svg>
  );
}
