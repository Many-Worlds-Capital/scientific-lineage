/* eslint-disable @typescript-eslint/no-explicit-any */
declare module "d3-force-3d" {
  export function forceCollide(radius?: number | ((node: any) => number)): {
    radius(r: number | ((node: any) => number)): any;
    strength(s: number): any;
    iterations(n: number): any;
  };
  export function forceManyBody(): {
    strength(s: number): any;
    distanceMax(d: number): any;
  };
  export function forceX(x?: number | ((node: any) => number)): {
    strength(s: number | ((node: any) => number)): any;
    x(x: number | ((node: any) => number)): any;
  };
  export function forceY(y?: number | ((node: any) => number)): {
    strength(s: number | ((node: any) => number)): any;
    y(y: number | ((node: any) => number)): any;
  };
}
