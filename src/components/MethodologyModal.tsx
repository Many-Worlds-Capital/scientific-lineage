"use client";

import { EDGE_COLORS, NODE_COLORS } from "@/lib/graphUtils";

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MethodologyModal({ isOpen, onClose }: MethodologyModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#12121a] border border-white/10 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#12121a] border-b border-white/10 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-lg font-heading font-bold text-white">
            Methodology
          </h2>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-6 text-sm text-white/80 leading-relaxed">
          <section>
            <h3 className="text-white font-heading font-semibold mb-2">
              Overview
            </h3>
            <p>
              This interactive graph maps the relationships between key researchers in
              quantum computing. It is designed to help quickly identify influential
              scientists, understand how they are connected, and spot rising stars in the
              field.
            </p>
          </section>

          <section>
            <h3 className="text-white font-heading font-semibold mb-2">
              Data Source
            </h3>
            <p>
              All bibliometric data is sourced from{" "}
              <a
                href="https://openalex.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                OpenAlex
              </a>
              , a free and open catalog of the global research system. For each
              scientist, we retrieve: h-index, citation count, publication count,
              institutional affiliations (with year ranges), and research topics.
            </p>
            <p className="mt-2">
              The dataset starts with a curated seed list of ~80 key quantum computing
              researchers. Additional researchers are <strong className="text-white">automatically discovered</strong> by
              analyzing frequent co-authors of seed researchers, filtered by h-index
              (&ge;15) and quantum-related topics. The full dataset is refreshed weekly
              via a scheduled pipeline.
            </p>
          </section>

          <section>
            <h3 className="text-white font-heading font-semibold mb-2">
              Node Sizing (Impact Score)
            </h3>
            <p>
              Each node&apos;s diameter is proportional to a computed <strong>impact score</strong>{" "}
              that combines multiple signals:
            </p>
            <div className="bg-white/5 rounded-lg p-3 mt-2 font-mono text-xs">
              impact = 0.5 &times; norm(h-index) + 0.3 &times; norm(citations) + 0.2 &times; Nobel
            </div>
            <ul className="mt-2 space-y-1 ml-4 list-disc text-white/70">
              <li>
                <strong className="text-white/80">h-index</strong> (50% weight) &mdash; measures sustained research impact
              </li>
              <li>
                <strong className="text-white/80">Total citations</strong> (30% weight) &mdash; measures overall influence
              </li>
              <li>
                <strong className="text-white/80">Nobel Prize</strong> (20% weight) &mdash; binary bonus for laureates
              </li>
            </ul>
            <p className="mt-2 text-white/60">
              Values are normalized relative to the maximum in the dataset, so scores
              range from 0 to 1.
            </p>
          </section>

          <section>
            <h3 className="text-white font-heading font-semibold mb-2">
              Edge Types
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="w-5 h-0.5 rounded mt-2 shrink-0" style={{ backgroundColor: EDGE_COLORS["student-of"] }} />
                <div>
                  <strong className="text-white">Student &rarr; Advisor</strong>
                  <p className="text-white/60 mt-0.5">
                    Manually curated from known PhD advisor/student and postdoc
                    mentor/mentee relationships. Directed arrows point from student to
                    advisor.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-0.5 rounded mt-2 shrink-0" style={{ backgroundColor: EDGE_COLORS["co-authored"] }} />
                <div>
                  <strong className="text-white">Co-authored papers</strong>
                  <p className="text-white/60 mt-0.5">
                    Computed by querying OpenAlex for works co-authored by each pair of
                    scientists. Edge thickness scales with the number of shared
                    publications.
                  </p>
                </div>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-heading font-semibold mb-2">
              Scientist Categories
            </h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: NODE_COLORS.nobel, boxShadow: `0 0 6px ${NODE_COLORS.nobel}` }} />
                <span>
                  <strong className="text-white">Nobel Laureate</strong>{" "}
                  <span className="text-white/60">&mdash; recipient of the Nobel Prize in Physics</span>
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: NODE_COLORS.pioneer }} />
                <span>
                  <strong className="text-white">Pioneer</strong>{" "}
                  <span className="text-white/60">&mdash; top 20% by h-index in the dataset</span>
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: NODE_COLORS.active }} />
                <span>
                  <strong className="text-white">Active</strong>{" "}
                  <span className="text-white/60">&mdash; established researchers in the field</span>
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: NODE_COLORS.risingStar, boxShadow: `0 0 6px ${NODE_COLORS.risingStar}` }} />
                <span>
                  <strong className="text-white">Rising Star</strong>{" "}
                  <span className="text-white/60">
                    &mdash; fewer than 120 publications and h-index below 40, indicating
                    early-career researchers with growing impact
                  </span>
                </span>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-heading font-semibold mb-2">
              Rising Star Signals
            </h3>
            <p>
              The <strong className="text-white">Rising Stars</strong> panel ranks
              researchers by a composite momentum score that combines:
            </p>
            <ul className="mt-2 space-y-1 ml-4 list-disc text-white/70">
              <li>
                <strong className="text-white/80">Publication acceleration</strong> &mdash;
                year-over-year growth in publications (last 3 years vs. prior 3 years)
              </li>
              <li>
                <strong className="text-white/80">Citation acceleration</strong> &mdash;
                year-over-year growth in citations received
              </li>
              <li>
                <strong className="text-white/80">Collaboration breadth</strong> &mdash;
                number of distinct co-authors in the network
              </li>
            </ul>
            <div className="bg-white/5 rounded-lg p-3 mt-2 font-mono text-xs">
              momentum = 0.3 &times; norm(pub_accel) + 0.4 &times; norm(cite_accel) + 0.3 &times; norm(breadth)
            </div>
          </section>

          <section>
            <h3 className="text-white font-heading font-semibold mb-2">
              Timeline
            </h3>
            <p>
              The timeline slider filters co-authored edges by publication year range.
              Use the play button to animate the field&apos;s evolution over time.
              Only co-authored edges with date metadata are filtered; student-advisor
              Student-advisor edges are not filtered by timeline.
            </p>
          </section>

          <section>
            <h3 className="text-white font-heading font-semibold mb-2">
              Company Overlay
            </h3>
            <p>
              Researchers affiliated with quantum computing companies are tagged with
              a <span className="text-purple-400">founder</span> badge. Company
              affiliations are manually curated and include roles at startups like
              IonQ, QuEra, Google Quantum AI, IBM Quantum, and others.
            </p>
          </section>

          <section>
            <h3 className="text-white font-heading font-semibold mb-2">
              Interaction
            </h3>
            <ul className="space-y-1 ml-4 list-disc text-white/70">
              <li>
                <strong className="text-white/80">Drag</strong> a node to reposition it
                &mdash; it stays pinned where you drop it
              </li>
              <li>
                <strong className="text-white/80">Right-click</strong> a pinned node to
                unpin it and let it flow freely again
              </li>
              <li>
                <strong className="text-white/80">Click</strong> a node to open the
                detail panel with metrics, affiliations, and links
              </li>
              <li>
                <strong className="text-white/80">Scroll</strong> to zoom in/out
              </li>
              <li>
                <strong className="text-white/80">&#8984;K</strong> to focus the search
                bar
              </li>
              <li>Use the <strong className="text-white/80">Filter Edges</strong> panel
                to toggle edge types on or off
              </li>
              <li>
                Use the <strong className="text-white/80">Timeline</strong> slider to
                filter collaborations by year range, or press play to animate
              </li>
              <li>
                Open the <strong className="text-white/80">Rising Stars</strong> panel
                to see a ranked leaderboard of researchers with accelerating impact
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-heading font-semibold mb-2">
              Update Frequency
            </h3>
            <p>
              The dataset is regenerated every Monday at 6:00 AM UTC via a GitHub
              Actions workflow. New scientists can be added to the seed list, and all
              bibliometric data is refreshed from OpenAlex automatically.
            </p>
          </section>

          <section>
            <h3 className="text-white font-heading font-semibold mb-2">
              Limitations
            </h3>
            <ul className="space-y-1 ml-4 list-disc text-white/70">
              <li>
                Auto-discovered researchers depend on co-authorship with seed list
                members &mdash; researchers without such links will not appear
              </li>
              <li>
                Student-advisor relationships are manually maintained and may be
                incomplete
              </li>
              <li>
                Same-lab edges rely on OpenAlex affiliation data, which can have gaps
                or inaccuracies
              </li>
              <li>
                The h-index and citation counts reflect OpenAlex&apos;s coverage, which may
                differ slightly from Google Scholar or Scopus
              </li>
              <li>
                Company affiliations are manually curated and may not be exhaustive
              </li>
            </ul>
          </section>

          <div className="border-t border-white/10 pt-4 text-white/40 text-xs">
            Built by Many Worlds Capital. Data from OpenAlex (CC0).
            Graph powered by react-force-graph.
          </div>
        </div>
      </div>
    </div>
  );
}
