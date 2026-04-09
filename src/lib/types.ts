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
  tags: ("pioneer" | "rising-star" | "active" | "emeritus")[];
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
  type: "student-of" | "same-lab" | "co-authored";
  weight: number;
  details?: string;
  papers?: CoAuthoredPaper[];
}

export interface GraphData {
  nodes: Scientist[];
  links: Relationship[];
}
