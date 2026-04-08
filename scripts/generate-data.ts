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

interface Affiliation {
  name: string;
  years: string;
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
}

interface Relationship {
  source: string;
  target: string;
  type: "student-of" | "same-lab" | "co-authored";
  weight: number;
  details?: string;
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

// --- Helpers ---

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: { "User-Agent": "ManyWorlds-ScientificLineage/1.0 (mailto:contact@manyworlds.vc)" },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.json();
}

async function fetchAuthor(id: string): Promise<any> {
  const url = `https://api.openalex.org/authors/${id}`;
  return fetchJson(url);
}

async function fetchCoauthoredWorks(id1: string, id2: string): Promise<number> {
  const url = `https://api.openalex.org/works?filter=authorships.author.id:${id1},authorships.author.id:${id2}&per_page=1`;
  const data = await fetchJson(url);
  return data.meta?.count ?? 0;
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

// --- Main ---

async function main() {
  const rootDir = path.resolve(__dirname, "..");
  const seedPath = path.join(__dirname, "seed.json");
  const advisorsPath = path.join(__dirname, "advisors.json");
  const outputDir = path.join(rootDir, "public", "data");

  const seeds: SeedEntry[] = JSON.parse(fs.readFileSync(seedPath, "utf-8"));
  const advisorEntries: AdvisorEntry[] = JSON.parse(
    fs.readFileSync(advisorsPath, "utf-8")
  ).filter((a: AdvisorEntry) => !a._skip);

  console.log(`Fetching ${seeds.length} scientists from OpenAlex...`);

  // Step 1: Fetch all author profiles
  const scientists: Scientist[] = [];
  const idSet = new Set(seeds.map((s) => s.id));

  for (let i = 0; i < seeds.length; i++) {
    const seed = seeds[i];
    console.log(`  [${i + 1}/${seeds.length}] ${seed.name}...`);
    try {
      const author = await fetchAuthor(seed.id);
      const { name: instName, country } = getCurrentInstitution(author);
      const hIndex = author.summary_stats?.h_index ?? 0;
      const citedByCount = author.cited_by_count ?? 0;
      const worksCount = author.works_count ?? 0;

      scientists.push({
        id: seed.id,
        name: author.display_name ?? seed.name,
        hIndex,
        citedByCount,
        worksCount,
        impactScore: 0, // computed later
        institution: instName,
        country,
        affiliationHistory: parseAffiliations(author),
        topTopics: getTopTopics(author),
        knownFor: KNOWN_FOR[seed.id] ?? [],
        isNobelLaureate: NOBEL_LAUREATES.has(seed.id),
        orcid: author.orcid ?? null,
        openAlexUrl: `https://openalex.org/authors/${seed.id}`,
        tags: [],
      });
    } catch (err: any) {
      console.error(`  Failed to fetch ${seed.name}: ${err.message}`);
    }
    await delay(110); // respect rate limit
  }

  // Step 2: Compute impact scores
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

  // Step 3: Tag scientists
  // Use percentile-based thresholds relative to the dataset
  const sortedH = [...scientists].sort((a, b) => b.hIndex - a.hIndex);
  const top20pct = sortedH[Math.floor(sortedH.length * 0.2)]?.hIndex ?? 80;

  for (const s of scientists) {
    if (s.isNobelLaureate) {
      s.tags.push("pioneer");
    } else if (s.hIndex >= top20pct) {
      s.tags.push("pioneer");
    } else if (s.worksCount < 120 && s.hIndex < 40) {
      s.tags.push("rising-star");
    } else {
      s.tags.push("active");
    }
  }

  console.log(`\nBuilding relationships...`);

  // Step 4: Build edges
  const relationships: Relationship[] = [];

  // 4a: Student-of from advisors.json
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

  // 4b: Co-authored edges (check all pairs — but batch to avoid too many requests)
  const scientistIds = scientists.map((s) => s.id);
  let coauthorCount = 0;
  const totalPairs = (scientistIds.length * (scientistIds.length - 1)) / 2;
  let pairIndex = 0;

  console.log(`  Checking ${totalPairs} pairs for co-authorship...`);

  for (let i = 0; i < scientistIds.length; i++) {
    for (let j = i + 1; j < scientistIds.length; j++) {
      pairIndex++;
      if (pairIndex % 100 === 0) {
        console.log(`    Progress: ${pairIndex}/${totalPairs}`);
      }
      try {
        const count = await fetchCoauthoredWorks(scientistIds[i], scientistIds[j]);
        if (count > 0) {
          relationships.push({
            source: scientistIds[i],
            target: scientistIds[j],
            type: "co-authored",
            weight: count,
          });
          coauthorCount++;
        }
      } catch {
        // skip on error
      }
      await delay(110);
    }
  }
  console.log(`  ${coauthorCount} co-authored edges found`);

  // 4c: Same-lab edges from overlapping affiliations (require 3+ years overlap)
  let sameLabCount = 0;
  const existingPairs = new Set(
    relationships.map((r) => [r.source, r.target].sort().join("|"))
  );

  for (let i = 0; i < scientists.length; i++) {
    for (let j = i + 1; j < scientists.length; j++) {
      const pairKey = [scientists[i].id, scientists[j].id].sort().join("|");
      if (existingPairs.has(pairKey)) continue;

      let bestOverlap = 0;
      let bestInst = "";

      for (const affI of scientists[i].affiliationHistory) {
        for (const affJ of scientists[j].affiliationHistory) {
          if (affI.name === affJ.name) {
            const overlap = yearsOverlapCount(affI.years, affJ.years);
            if (overlap > bestOverlap) {
              bestOverlap = overlap;
              bestInst = affI.name;
            }
          }
        }
      }

      if (bestOverlap >= 3) {
        relationships.push({
          source: scientists[i].id,
          target: scientists[j].id,
          type: "same-lab",
          weight: bestOverlap,
          details: bestInst,
        });
        existingPairs.add(pairKey);
        sameLabCount++;
      }
    }
  }
  console.log(`  ${sameLabCount} same-lab edges found`);

  // Step 5: Write output
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

function parseYearRange(s: string): [number, number] | null {
  if (s === "unknown") return null;
  const parts = s.split("-").map(Number);
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return [parts[0], parts[1]];
  }
  if (parts.length === 1 && !isNaN(parts[0])) {
    return [parts[0], parts[0]];
  }
  return null;
}

function yearsOverlapCount(a: string, b: string): number {
  const rangeA = parseYearRange(a);
  const rangeB = parseYearRange(b);
  if (!rangeA || !rangeB) return 0;
  const start = Math.max(rangeA[0], rangeB[0]);
  const end = Math.min(rangeA[1], rangeB[1]);
  return Math.max(0, end - start + 1);
}

main().catch(console.error);
