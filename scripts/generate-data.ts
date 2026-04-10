import * as fs from "fs";
import * as path from "path";

// --- Types ---

interface SeedEntry {
  id: string;
  name: string;
}

interface AdvisorEntry {
  student: string;
  advisor: string;
  details?: string;
  _skip?: boolean;
}

interface CompanyEntry {
  company: string;
  scientists: { id: string; role: string }[];
}

interface Affiliation {
  name: string;
  years: string;
}

interface YearCount {
  year: number;
  worksCount: number;
  citedByCount: number;
}

interface Scientist {
  id: string;
  name: string;
  hIndex: number;
  citedByCount: number;
  worksCount: number;
  impactScore: number;
  institution: string | null;
  country: string | null;
  affiliationHistory: Affiliation[];
  topTopics: string[];
  knownFor: string[];
  isNobelLaureate: boolean;
  orcid: string | null;
  openAlexUrl: string;
  tags: string[];
  countsByYear: YearCount[];
  subfields: string[];
  companies: { name: string; role: string }[];
  risingStarSignals?: {
    publicationAcceleration: number;
    citationAcceleration: number;
    collaborationBreadth: number;
    momentum: number;
  };
}

interface CoAuthoredPaper {
  title: string;
  year: number;
  openAlexId: string;
  arxivId: string | null;
  doi: string | null;
}

interface Relationship {
  source: string;
  target: string;
  type: "student-of" | "co-authored";
  weight: number;
  details?: string;
  papers?: CoAuthoredPaper[];
  yearRange?: [number, number];
}

// --- Constants ---

const NOBEL_LAUREATES = new Set([
  "A5037710835", // Feynman (1965)
  "A5001105113", // Zeilinger (2022)
  "A5046427077", // Aspect (2022)
  "A5001536933", // Wineland (2012)
  "A5108398851", // Haroche (2012)
  "A5089631322", // Devoret (2025)
  "A5043106778", // Martinis (2025)
]);

const KNOWN_FOR: Record<string, string[]> = {
  A5020744800: ["Shor's algorithm", "Quantum error correction"],
  A5061874000: ["Quantum error correction", "Quantum information theory", "Preskill's lecture notes"],
  A5020769134: ["Computational complexity & quantum", "Quantum supremacy arguments"],
  A5053166798: ["Quantum teleportation", "BB84 protocol"],
  A5050850280: ["Quantum computing pioneer", "Deutsch-Jozsa algorithm", "Constructor theory"],
  A5037710835: ["Quantum electrodynamics", "Feynman diagrams", "Quantum simulation concept"],
  A5038060570: ["Quantum simulation", "Quantum thermodynamics"],
  A5031023857: ["Grover's search algorithm"],
  A5083228566: ["Quantum simulation", "Tensor networks", "Trapped-ion QC theory"],
  A5016282235: ["Quantum simulation", "Cold atoms", "Trapped-ion QC theory"],
  A5040977712: ["Trapped-ion quantum computing", "Experimental quantum information"],
  A5005759724: ["Trapped-ion quantum computing", "IonQ co-founder"],
  A5066245772: ["Quantum networks", "Neutral-atom quantum computing", "QuEra co-founder"],
  A5042449260: ["Quantum communication", "Satellite quantum key distribution"],
  A5059030616: ["Quantum cryptography", "Ekert protocol (E91)"],
  A5001105113: ["Quantum entanglement experiments", "Bell test experiments"],
  A5046427077: ["Bell inequality experiments", "Quantum optics"],
  A5001536933: ["Trapped-ion precision measurements", "Quantum logic clock"],
  A5108398851: ["Cavity quantum electrodynamics", "Photon trapping"],
  A5078255491: ["Quantum error correction", "Institute for Quantum Computing founding director"],
  A5006327208: ["Stabilizer codes", "Quantum error correction theory"],
  A5027759442: ["Topological quantum computing", "Kitaev model"],
  A5068097121: ["Quantum Computation and Quantum Information textbook"],
  A5103046966: ["Quantum Computation and Quantum Information textbook", "NMR quantum computing"],
  A5036253306: ["Quantum approximate optimization (QAOA)", "Adiabatic quantum computing"],
  A5018837979: ["Quantum walk algorithms", "Quantum simulation algorithms"],
  A5058819109: ["Quantum error correction", "Hamiltonian complexity"],
  A5001154267: ["Tensor networks", "PEPS"],
  A5111058882: ["DMRG / tensor network methods", "Entanglement renormalization (MERA)"],
  A5043106778: ["Superconducting qubits", "Google quantum supremacy experiment"],
  A5012231169: ["Quantum AI at Google"],
  A5084929692: ["Circuit QED", "Superconducting qubits", "3D transmon"],
  A5089631322: ["Circuit QED pioneer", "Superconducting quantum circuits"],
  A5016075205: ["Superconducting circuits", "Circuit QED experiments"],
  A5064155719: ["Topological quantum computing theory", "Station Q"],
  A5060980314: ["Topological quantum computing", "Majorana fermions theory"],
  A5006639172: ["Majorana experiments", "Topological qubits"],
  A5103068314: ["Majorana zero modes", "Topological qubits"],
  A5030701195: ["IBM Quantum", "Quantum volume benchmark"],
  A5064909614: ["Quantum error correction", "IBM Quantum"],
  A5071105459: ["Quantum information theory", "Black hole information"],
  A5005794608: ["Quantum complexity theory", "Adiabatic QC"],
  A5071039750: ["Quantum complexity theory", "BQP"],
  A5066563480: ["Quantum query complexity"],
  A5023685398: ["Quantum algorithms", "Quantum computational advantage"],
  A5028440699: ["Quantum Monte Carlo", "Microsoft quantum"],
  A5019716296: ["Quantum programming", "Q# language"],
  A5032976159: ["Quantum characterization", "Randomized benchmarking"],
  A5046083937: ["Circuit QED theory", "Superconducting qubits theory"],
  A5068826612: ["Bosonic quantum error correction", "Quantum networks"],
  A5004169905: ["Topological phases", "Anyons"],
  A5008766821: ["Quantum algorithms", "Quantum information theory"],
  A5078065002: ["Quantum entanglement measures", "No-cloning theorem"],
  A5110284072: ["BB84 quantum key distribution", "Quantum teleportation"],
  A5056095913: ["DiVincenzo criteria", "Quantum dots for QC"],
  A5010879789: ["Loss-DiVincenzo quantum dot proposal", "Spin qubits"],
  A5012503150: ["Spin qubit experiments", "Silicon quantum dots"],
  A5049405877: ["Silicon quantum computing", "Phosphorus-in-silicon qubits"],
  A5047414815: ["Silicon spin qubits", "Single-atom transistors"],
  A5027716155: ["Trapped-ion quantum computing", "Microwave-driven ions"],
  A5082160956: ["Trapped-ion networks", "Quantum communication"],
  A5066295139: ["Trapped-ion quantum computing", "Innsbruck experiments"],
  A5052107957: ["Blind quantum computing", "Quantum verification"],
  A5034032202: ["Quantum cryptography", "Universal blind quantum computing"],
  A5065681671: ["Quantum supremacy experiments", "Google Sycamore"],
  A5030940558: ["Quantum algorithms", "Quantum error correction theory"],
  A5019616211: ["Interactive proofs", "Quantum complexity"],
  A5011207998: ["Verification of quantum computations"],
  A5020583189: ["Quantum-inspired classical algorithms", "Dequantization"],
  A5024414185: ["Bosonic codes", "Cat qubits"],
  A5007129549: ["Quantum tomography", "Randomized benchmarking"],
  A5009791247: ["Neutral-atom quantum computing", "Logical qubit demonstrations"],
  A5003369827: ["Neutral-atom arrays", "Rydberg gates"],
  A5110481134: ["Atomic physics", "Quantum networks"],
  A5073521804: ["Superconducting qubit experiments", "Google Sycamore"],
  A5039127008: ["Quantum error correction architectures"],
  A5018132307: ["Magic state distillation", "Quantum error correction"],
  A5012132706: ["Quantum error correction", "NQIT"],
  A5090412627: ["Variational quantum algorithms", "Quantum machine learning"],
  A5023852532: ["Lattice-based cryptography", "Post-quantum cryptography"],
  A5065994445: ["Fault-tolerant quantum computing"],
};

// Subfield classification by keyword matching on OpenAlex topics
const SUBFIELD_KEYWORDS: Record<string, string[]> = {
  "superconducting-qubits": [
    "superconducting", "transmon", "circuit qed", "josephson", "microwave",
  ],
  "trapped-ions": [
    "trapped ion", "ion trap", "trapped-ion", "paul trap",
  ],
  "neutral-atoms": [
    "neutral atom", "rydberg", "optical tweezer", "cold atom", "optical lattice",
  ],
  "photonics": [
    "photon", "optical", "linear optic", "boson sampling", "squeezed",
  ],
  "spin-qubits": [
    "spin qubit", "quantum dot", "silicon qubit", "electron spin",
  ],
  "topological": [
    "topological", "majorana", "anyon", "non-abelian", "toric code",
  ],
  "algorithms-theory": [
    "quantum algorithm", "computational complexity", "query complexity",
    "quantum walk", "quantum speed", "bqp", "quantum advantage",
    "quantum machine learning", "variational quantum",
  ],
  "error-correction": [
    "error correct", "fault tolerant", "stabilizer", "surface code",
    "magic state", "logical qubit", "bosonic code", "cat qubit",
  ],
  "quantum-networks": [
    "quantum network", "quantum internet", "quantum communication",
    "quantum key distribution", "quantum cryptograph", "quantum repeater",
    "entanglement distribution",
  ],
  "quantum-sensing": [
    "quantum sensing", "quantum metrology", "precision measurement",
    "atomic clock", "magnetometry",
  ],
};

// --- Helpers ---

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// OpenAlex "polite pool" — add email to get 10 req/s instead of 1 req/s
function politeUrl(url: string): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}mailto=contact@manyworlds.vc`;
}

async function fetchJson(url: string, retries = 5): Promise<any> {
  const polite = politeUrl(url);
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(polite, {
      headers: { "User-Agent": "ManyWorlds-ScientificLineage/2.0 (mailto:contact@manyworlds.vc)" },
    });
    if (res.status === 429) {
      const waitMs = 5000 * (attempt + 1);
      console.log(`    Rate limited, waiting ${waitMs / 1000}s (attempt ${attempt + 1}/${retries})...`);
      await delay(waitMs);
      continue;
    }
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${url}`);
    }
    return res.json();
  }
  throw new Error(`Rate limited after ${retries} retries for ${url}`);
}

async function fetchAuthor(id: string): Promise<any> {
  const url = `https://api.openalex.org/authors/${id}`;
  return fetchJson(url);
}

async function fetchCoauthoredWorks(
  id1: string,
  id2: string
): Promise<{ count: number; papers: CoAuthoredPaper[] }> {
  const url = `https://api.openalex.org/works?filter=authorships.author.id:${id1},authorships.author.id:${id2}&per_page=10&sort=cited_by_count:desc`;
  const data = await fetchJson(url);
  const count = data.meta?.count ?? 0;
  const papers: CoAuthoredPaper[] = [];

  if (data.results) {
    for (const work of data.results) {
      const openAlexId = work.id?.replace("https://openalex.org/", "") ?? "";
      let arxivId: string | null = null;
      const locations = [
        work.primary_location,
        ...(work.locations ?? []),
      ].filter(Boolean);
      for (const loc of locations) {
        const url = loc.landing_page_url ?? loc.pdf_url ?? "";
        const match = url.match(/arxiv\.org\/(?:abs|pdf)\/(.+?)(?:v\d+)?$/);
        if (match) {
          arxivId = match[1];
          break;
        }
      }
      if (!arxivId && work.doi) {
        const arxivDoiMatch = work.doi.match(/10\.48550\/arXiv\.(.+)/);
        if (arxivDoiMatch) {
          arxivId = arxivDoiMatch[1];
        }
      }

      papers.push({
        title: work.title ?? "Untitled",
        year: work.publication_year ?? 0,
        openAlexId,
        arxivId,
        doi: work.doi?.replace("https://doi.org/", "") ?? null,
      });
    }
  }

  return { count, papers };
}

function parseAffiliations(author: any): Affiliation[] {
  const affiliations: Affiliation[] = [];
  if (author.affiliations) {
    for (const aff of author.affiliations) {
      const name = aff.institution?.display_name;
      if (!name) continue;
      const years: number[] = aff.years ?? [];
      const yearsStr =
        years.length > 0
          ? `${Math.min(...years)}-${Math.max(...years)}`
          : "unknown";
      affiliations.push({ name, years: yearsStr });
    }
  }
  return affiliations;
}

function getCurrentInstitution(author: any): { name: string | null; country: string | null } {
  if (author.last_known_institutions && author.last_known_institutions.length > 0) {
    const inst = author.last_known_institutions[0];
    return {
      name: inst.display_name ?? null,
      country: inst.country_code ?? null,
    };
  }
  return { name: null, country: null };
}

function getTopTopics(author: any): string[] {
  if (author.topics) {
    return author.topics
      .slice(0, 5)
      .map((t: any) => t.display_name)
      .filter(Boolean);
  }
  return [];
}

function getCountsByYear(author: any): YearCount[] {
  if (!author.counts_by_year) return [];
  return author.counts_by_year
    .map((c: any) => ({
      year: c.year,
      worksCount: c.works_count ?? 0,
      citedByCount: c.cited_by_count ?? 0,
    }))
    .sort((a: YearCount, b: YearCount) => a.year - b.year);
}

function classifySubfields(topics: string[]): string[] {
  const matched = new Set<string>();
  const topicsLower = topics.map((t) => t.toLowerCase());
  for (const [subfield, keywords] of Object.entries(SUBFIELD_KEYWORDS)) {
    for (const kw of keywords) {
      if (topicsLower.some((t) => t.includes(kw))) {
        matched.add(subfield);
        break;
      }
    }
  }
  return Array.from(matched);
}

function computeRisingStarSignals(
  countsByYear: YearCount[]
): { publicationAcceleration: number; citationAcceleration: number } {
  // Compare last 3 years vs prior 3 years
  const currentYear = new Date().getFullYear();
  const recent = countsByYear.filter((c) => c.year >= currentYear - 3 && c.year < currentYear);
  const prior = countsByYear.filter((c) => c.year >= currentYear - 6 && c.year < currentYear - 3);

  const recentPubs = recent.reduce((s, c) => s + c.worksCount, 0);
  const priorPubs = prior.reduce((s, c) => s + c.worksCount, 0);
  const recentCites = recent.reduce((s, c) => s + c.citedByCount, 0);
  const priorCites = prior.reduce((s, c) => s + c.citedByCount, 0);

  const pubAccel = priorPubs > 0 ? (recentPubs - priorPubs) / priorPubs : recentPubs > 0 ? 1 : 0;
  const citeAccel = priorCites > 0 ? (recentCites - priorCites) / priorCites : recentCites > 0 ? 1 : 0;

  return {
    publicationAcceleration: Math.round(pubAccel * 1000) / 1000,
    citationAcceleration: Math.round(citeAccel * 1000) / 1000,
  };
}


// --- Discovery ---

async function discoverCoauthors(
  seedIds: string[],
  existingIds: Set<string>,
  maxTotal: number
): Promise<SeedEntry[]> {
  const discovered: Map<string, { name: string; coauthorships: number }> = new Map();
  const seedSet = new Set(seedIds);

  console.log(`\nDiscovering co-authors for ${seedIds.length} seed researchers...`);

  for (let i = 0; i < seedIds.length; i++) {
    const id = seedIds[i];
    if (i % 10 === 0) {
      console.log(`  Discovery progress: ${i}/${seedIds.length} seeds processed, ${discovered.size} candidates found`);
    }

    try {
      // Use OpenAlex works API grouped by co-author
      const url = `https://api.openalex.org/works?filter=authorships.author.id:${id}&group_by=authorships.author.id&per_page=50`;
      const data = await fetchJson(url);

      if (data.group_by) {
        for (const group of data.group_by) {
          const coauthorId = group.key?.replace("https://openalex.org/", "") ?? "";
          const count = group.count ?? 0;

          if (!coauthorId || seedSet.has(coauthorId) || existingIds.has(coauthorId)) continue;
          if (count < 3) continue; // At least 3 co-authored works

          const existing = discovered.get(coauthorId);
          if (existing) {
            existing.coauthorships += count;
          } else {
            discovered.set(coauthorId, {
              name: group.key_display_name ?? coauthorId,
              coauthorships: count,
            });
          }
        }
      }
    } catch {
      // skip
    }
    await delay(200);
  }

  // Sort by total coauthorships and filter
  const candidates = Array.from(discovered.entries())
    .sort((a, b) => b[1].coauthorships - a[1].coauthorships)
    .slice(0, maxTotal * 3); // fetch more than needed, will filter by h-index

  console.log(`  Found ${candidates.length} co-author candidates, filtering by h-index...`);

  const filtered: SeedEntry[] = [];
  for (const [id, info] of candidates) {
    if (filtered.length + seedIds.length >= maxTotal) break;

    try {
      const author = await fetchAuthor(id);
      const hIndex = author.summary_stats?.h_index ?? 0;
      const topics = getTopTopics(author);
      const topicsLower = topics.map((t) => t.toLowerCase()).join(" ");

      // Must have h-index >= 15 and quantum-related topics
      const isQuantum = topicsLower.includes("quantum") ||
        topicsLower.includes("qubit") ||
        topicsLower.includes("entangle");

      if (hIndex >= 15 && isQuantum) {
        filtered.push({
          id,
          name: author.display_name ?? info.name,
        });
        console.log(`    Discovered: ${author.display_name} (h=${hIndex}, ${info.coauthorships} co-authorships)`);
      }
    } catch {
      // skip
    }
    await delay(200);
  }

  console.log(`  Discovered ${filtered.length} new researchers`);
  return filtered;
}

// --- Main ---

async function main() {
  const rootDir = path.resolve(__dirname, "..");
  const seedPath = path.join(__dirname, "seed.json");
  const advisorsPath = path.join(__dirname, "advisors.json");
  const companiesPath = path.join(__dirname, "companies.json");
  const outputDir = path.join(rootDir, "public", "data");

  const seeds: SeedEntry[] = JSON.parse(fs.readFileSync(seedPath, "utf-8"));
  const advisorEntries: AdvisorEntry[] = JSON.parse(
    fs.readFileSync(advisorsPath, "utf-8")
  ).filter((a: AdvisorEntry) => !a._skip);

  // Load companies data
  let companyEntries: CompanyEntry[] = [];
  try {
    companyEntries = JSON.parse(fs.readFileSync(companiesPath, "utf-8"));
  } catch {
    console.log("No companies.json found, skipping company overlay");
  }

  // Build company lookup
  const companyLookup = new Map<string, { name: string; role: string }[]>();
  for (const entry of companyEntries) {
    for (const sci of entry.scientists) {
      const existing = companyLookup.get(sci.id) ?? [];
      existing.push({ name: entry.company, role: sci.role });
      companyLookup.set(sci.id, existing);
    }
  }

  console.log(`Fetching ${seeds.length} seed scientists from OpenAlex...`);

  // Step 1: Fetch all seed author profiles
  const scientists: Scientist[] = [];
  const idSet = new Set(seeds.map((s) => s.id));

  for (let i = 0; i < seeds.length; i++) {
    const seed = seeds[i];
    console.log(`  [${i + 1}/${seeds.length}] ${seed.name}...`);
    try {
      const author = await fetchAuthor(seed.id);
      const sci = buildScientist(seed.id, seed.name, author, companyLookup, false);
      scientists.push(sci);
    } catch (err: any) {
      console.error(`  Failed to fetch ${seed.name}: ${err.message}`);
    }
    await delay(200);
  }

  // Step 2: Auto-discovery of new researchers
  const MAX_TOTAL = 350;
  const discoveredSeeds = await discoverCoauthors(
    seeds.map((s) => s.id),
    idSet,
    MAX_TOTAL
  );

  console.log(`\nFetching ${discoveredSeeds.length} discovered scientists...`);
  for (let i = 0; i < discoveredSeeds.length; i++) {
    const seed = discoveredSeeds[i];
    if (idSet.has(seed.id)) continue;
    idSet.add(seed.id);

    console.log(`  [${i + 1}/${discoveredSeeds.length}] ${seed.name}...`);
    try {
      const author = await fetchAuthor(seed.id);
      const sci = buildScientist(seed.id, seed.name, author, companyLookup, true);
      scientists.push(sci);
    } catch (err: any) {
      console.error(`  Failed to fetch ${seed.name}: ${err.message}`);
    }
    await delay(200);
  }

  // Step 3: Compute impact scores
  const hIndices = scientists.map((s) => s.hIndex);
  const citations = scientists.map((s) => s.citedByCount);
  const maxH = Math.max(...hIndices, 1);
  const maxC = Math.max(...citations, 1);

  for (const s of scientists) {
    const normH = s.hIndex / maxH;
    const normC = s.citedByCount / maxC;
    const nobel = s.isNobelLaureate ? 1 : 0;
    s.impactScore = Math.round((0.5 * normH + 0.3 * normC + 0.2 * nobel) * 1000) / 1000;
  }

  // Step 4: Tag scientists
  const sortedH = [...scientists].sort((a, b) => b.hIndex - a.hIndex);
  const top20pct = sortedH[Math.floor(sortedH.length * 0.2)]?.hIndex ?? 80;

  for (const s of scientists) {
    // Keep "discovered" tag if present
    const baseTag = s.tags.includes("discovered") ? "discovered" : null;
    s.tags = baseTag ? [baseTag] : [];

    if (s.isNobelLaureate) {
      s.tags.push("pioneer");
    } else if (s.hIndex >= top20pct) {
      s.tags.push("pioneer");
    } else if (s.worksCount < 120 && s.hIndex < 40) {
      s.tags.push("rising-star");
    } else {
      s.tags.push("active");
    }

    // Add founder tag
    if (s.companies.length > 0 && s.companies.some((c) => c.role.toLowerCase().includes("founder") || c.role.toLowerCase().includes("co-founder"))) {
      s.tags.push("founder");
    }
  }

  // Step 5: Compute rising star signals
  console.log(`\nComputing rising star signals...`);
  for (const s of scientists) {
    const { publicationAcceleration, citationAcceleration } = computeRisingStarSignals(s.countsByYear);
    s.risingStarSignals = {
      publicationAcceleration,
      citationAcceleration,
      collaborationBreadth: 0, // filled after relationships
      momentum: 0, // computed after normalization
    };
  }

  console.log(`\nBuilding relationships...`);

  // Step 6: Build edges
  const relationships: Relationship[] = [];

  // 6a: Student-of from advisors.json
  for (const adv of advisorEntries) {
    if (idSet.has(adv.student) && idSet.has(adv.advisor) && adv.student !== adv.advisor) {
      relationships.push({
        source: adv.student,
        target: adv.advisor,
        type: "student-of",
        weight: 1,
        details: adv.details,
      });
    }
  }
  console.log(`  ${relationships.length} student-of edges from advisors.json`);

  // 6b: Co-authored edges via group_by (one API call per researcher)
  const scientistIdSet = new Set(scientists.map((s) => s.id));
  const processedPairs = new Set<string>();
  let coauthorCount = 0;
  let errorCount = 0;

  console.log(`  Fetching co-authorships for ${scientists.length} researchers (group_by approach)...`);

  for (let i = 0; i < scientists.length; i++) {
    const sci = scientists[i];
    if ((i + 1) % 20 === 0) {
      console.log(`    Progress: ${i + 1}/${scientists.length} (${coauthorCount} edges found)`);
    }

    try {
      const url = `https://api.openalex.org/works?filter=authorships.author.id:${sci.id}&group_by=authorships.author.id&per_page=200`;
      const data = await fetchJson(url);

      if (data.group_by) {
        for (const group of data.group_by) {
          const coauthorId = group.key?.replace("https://openalex.org/", "") ?? "";
          const count = group.count ?? 0;

          // Skip self, non-dataset members, already processed, and weak links
          if (!coauthorId || coauthorId === sci.id || !scientistIdSet.has(coauthorId)) continue;
          if (count < 2) continue;

          const pk = [sci.id, coauthorId].sort().join("|");
          if (processedPairs.has(pk)) continue;
          processedPairs.add(pk);

          // For significant collaborations, fetch paper details (for timeline yearRange)
          if (count >= 3) {
            try {
              const result = await fetchCoauthoredWorks(sci.id, coauthorId);
              const years = result.papers.map((p) => p.year).filter((y) => y > 0);
              relationships.push({
                source: sci.id,
                target: coauthorId,
                type: "co-authored",
                weight: count,
                papers: result.papers,
                yearRange: years.length > 0 ? [Math.min(...years), Math.max(...years)] : undefined,
              });
              await delay(200);
            } catch {
              // Fallback: add edge without paper details
              relationships.push({
                source: sci.id,
                target: coauthorId,
                type: "co-authored",
                weight: count,
              });
            }
          } else {
            relationships.push({
              source: sci.id,
              target: coauthorId,
              type: "co-authored",
              weight: count,
            });
          }
          coauthorCount++;
        }
      }
    } catch (err: any) {
      errorCount++;
      if (errorCount <= 10) {
        console.log(`    Error for ${sci.name}: ${err.message}`);
      }
    }
    await delay(200);
  }
  console.log(`  ${coauthorCount} co-authored edges found (${errorCount} errors)`);

  // Step 7: Fill collaboration breadth and compute momentum
  const coauthorCountMap = new Map<string, Set<string>>();
  for (const r of relationships) {
    if (r.type !== "co-authored") continue;
    const src = typeof r.source === "string" ? r.source : (r.source as any).id;
    const tgt = typeof r.target === "string" ? r.target : (r.target as any).id;
    if (!coauthorCountMap.has(src)) coauthorCountMap.set(src, new Set());
    if (!coauthorCountMap.has(tgt)) coauthorCountMap.set(tgt, new Set());
    coauthorCountMap.get(src)!.add(tgt);
    coauthorCountMap.get(tgt)!.add(src);
  }

  // Normalize and compute momentum
  let maxPubAccel = 0, maxCiteAccel = 0, maxBreadth = 0;
  for (const s of scientists) {
    if (!s.risingStarSignals) continue;
    s.risingStarSignals.collaborationBreadth = coauthorCountMap.get(s.id)?.size ?? 0;
    maxPubAccel = Math.max(maxPubAccel, Math.abs(s.risingStarSignals.publicationAcceleration));
    maxCiteAccel = Math.max(maxCiteAccel, Math.abs(s.risingStarSignals.citationAcceleration));
    maxBreadth = Math.max(maxBreadth, s.risingStarSignals.collaborationBreadth);
  }

  for (const s of scientists) {
    if (!s.risingStarSignals) continue;
    const normPub = maxPubAccel > 0 ? Math.max(0, s.risingStarSignals.publicationAcceleration) / maxPubAccel : 0;
    const normCite = maxCiteAccel > 0 ? Math.max(0, s.risingStarSignals.citationAcceleration) / maxCiteAccel : 0;
    const normBreadth = maxBreadth > 0 ? s.risingStarSignals.collaborationBreadth / maxBreadth : 0;
    s.risingStarSignals.momentum = Math.round((0.3 * normPub + 0.4 * normCite + 0.3 * normBreadth) * 1000) / 1000;
  }

  // Step 8: Write output
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(
    path.join(outputDir, "scientists.json"),
    JSON.stringify(scientists, null, 2)
  );
  fs.writeFileSync(
    path.join(outputDir, "relationships.json"),
    JSON.stringify(relationships, null, 2)
  );

  console.log(
    `\nDone! Wrote ${scientists.length} scientists and ${relationships.length} relationships.`
  );
}

function buildScientist(
  id: string,
  name: string,
  author: any,
  companyLookup: Map<string, { name: string; role: string }[]>,
  isDiscovered: boolean
): Scientist {
  const { name: instName, country } = getCurrentInstitution(author);
  const hIndex = author.summary_stats?.h_index ?? 0;
  const citedByCount = author.cited_by_count ?? 0;
  const worksCount = author.works_count ?? 0;
  const topics = getTopTopics(author);
  const countsByYear = getCountsByYear(author);

  return {
    id,
    name: author.display_name ?? name,
    hIndex,
    citedByCount,
    worksCount,
    impactScore: 0,
    institution: instName,
    country,
    affiliationHistory: parseAffiliations(author),
    topTopics: topics,
    knownFor: KNOWN_FOR[id] ?? [],
    isNobelLaureate: NOBEL_LAUREATES.has(id),
    orcid: author.orcid ?? null,
    openAlexUrl: `https://openalex.org/authors/${id}`,
    tags: isDiscovered ? ["discovered"] : [],
    countsByYear,
    subfields: classifySubfields(topics),
    companies: companyLookup.get(id) ?? [],
  };
}

main().catch(console.error);
