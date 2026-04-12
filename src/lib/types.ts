export interface YearCount {
  year: number;
  worksCount: number;
  citedByCount: number;
}

export interface Company {
  name: string;
  role: string;
}

export interface RisingStarSignals {
  publicationAcceleration: number; // year-over-year publication growth
  citationAcceleration: number;    // year-over-year citation growth
  collaborationBreadth: number;    // distinct co-authors in network
  momentum: number;                // composite score 0-1
}

export interface Scientist {
  id: string;
  name: string;
  hIndex: number;
  citedByCount: number;
  worksCount: number;
  impactScore: number;
  institution: string | null;
  country: string | null;
  affiliationHistory: { name: string; years: string }[];
  topTopics: string[];
  knownFor: string[];
  isNobelLaureate: boolean;
  orcid: string | null;
  openAlexUrl: string;
  tags: ("prominent" | "rising-star" | "active" | "emeritus" | "discovered" | "founder")[];
  countsByYear?: YearCount[];
  subfields?: string[];
  companies?: Company[];
  risingStarSignals?: RisingStarSignals;
}

export interface CoAuthoredPaper {
  title: string;
  year: number;
  openAlexId: string;
  arxivId: string | null;
  doi: string | null;
}

export interface Relationship {
  source: string;
  target: string;
  type: "student-of" | "co-authored";
  weight: number;
  details?: string;
  papers?: CoAuthoredPaper[];
  yearRange?: [number, number];
}

export interface GraphData {
  nodes: Scientist[];
  links: Relationship[];
}
