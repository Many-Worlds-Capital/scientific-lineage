import { Scientist, Relationship } from "./types";

export const NODE_COLORS = {
  nobel: "#ffd700",
  prominent: "#0043c8",
  active: "#0057ff",
  risingStar: "#15e60d",
} as const;

export const EDGE_COLORS: Record<Relationship["type"], string> = {
  "student-of": "#0057ff",
  "co-authored": "#737688",
};

export const EDGE_LABELS: Record<Relationship["type"], string> = {
  "student-of": "Student \u2192 Advisor",
  "co-authored": "Co-authored papers",
};

export function getNodeRadius(node: Scientist): number {
  const MIN_RADIUS = 6;
  const MAX_RADIUS = 28;
  return MIN_RADIUS + node.impactScore * (MAX_RADIUS - MIN_RADIUS);
}

export function getNodeColor(node: Scientist): string {
  if (node.isNobelLaureate) return NODE_COLORS.nobel;
  if (node.tags.includes("rising-star")) return NODE_COLORS.risingStar;
  if (node.tags.includes("prominent")) return NODE_COLORS.prominent;
  return NODE_COLORS.active;
}

export function getEdgeWidth(link: Relationship): number {
  if (link.type === "co-authored") {
    return Math.min(0.5 + link.weight * 0.3, 4);
  }
  if (link.type === "student-of") return 1.5;
  return 1;
}
