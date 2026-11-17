// Pure functions of time. Every animated value in the film is computed from t
// (seconds) with closed-form damped springs, so any frame renders identically
// in isolation.

export type Spring = { w: number; z: number };

export const SNAP: Spring = { w: 26, z: 1 };
export const MORPH: Spring = { w: 13, z: 0.86 };
export const CAMERA: Spring = { w: 6.5, z: 1 };
export const PUSH: Spring = { w: 9, z: 1 };
export const CURSOR: Spring = { w: 11, z: 0.92 };

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));

export function stepR(tau: number, { w, z }: Spring): number {
  if (tau <= 0) return 0;
  if (z >= 1) {
    const x = w * tau;
    return 1 - Math.exp(-x) * (1 + x);
  }
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * tau) * (Math.cos(wd * tau) + ((z * w) / wd) * Math.sin(wd * tau));
}

// A value that changes target many times: the sum of one spring per change.
export class Track {
  private ev: Array<[number, number, Spring]> = [];
  private cur: number;
  constructor(private v0: number) {
    this.cur = v0;
  }
  to(t: number, v: number, sp: Spring = MORPH) {
    if (v !== this.cur) {
      this.ev.push([t, v - this.cur, sp]);
      this.cur = v;
    }
    return this;
  }
  at(t: number) {
    let v = this.v0;
    for (const [ti, d, sp] of this.ev) v += d * stepR(t - ti, sp);
    return v;
  }
}

// Enter on a spring, exit short and early, with a blur on both edges.
export function vis(t: number, tin: number, tout: number | null, dOut = 0.14) {
  const e = stepR(t - tin, SNAP);
  const x = tout == null ? 0 : clamp((t - tout) / dOut);
  const xo = x * x;
  return { o: e * (1 - xo), b: (1 - e) * 12 + xo * 12, dy: (1 - e) * 22 - xo * 12, e };
}

// Press dip for a click at tc.
export const press = (t: number, tc: number) => 1 - 0.18 * Math.exp(-(((t - tc) / 0.05) ** 2));
