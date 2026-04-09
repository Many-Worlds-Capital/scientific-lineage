/* eslint-disable @typescript-eslint/no-explicit-any */
declare module "d3-force-3d" {
  export function forceCollide(radius?: number | ((node: any) => number)): {
    radius(r: number | ((node: any) => number)): any;
  };
  export function forceManyBody(): {
    strength(s: number): any;
    distanceMax(d: number): any;
  };
}
