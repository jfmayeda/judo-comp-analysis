export type Spring = { w: number; z: number };

export const SNAP: Spring = { w: 13, z: 0.84 };
export const CAM: Spring = { w: 8, z: 1 };
export const SOFT: Spring = { w: 11, z: 0.9 };
export const TEXT: Spring = { w: 22, z: 1 };

export function clamp(v: number, a = 0, b = 1) {
  return Math.max(a, Math.min(b, v));
}

/** Closed-form damped step response, 0 → 1. Tiny overshoot when z < 1. */
export function stepR(tau: number, sp: Spring): number {
  if (tau <= 0) return 0;
  const { w, z } = sp;
  if (z >= 1) {
    const x = w * tau;
    return 1 - Math.exp(-x) * (1 + x);
  }
  const wd = w * Math.sqrt(1 - z * z);
  return (
    1 -
    Math.exp(-z * w * tau) * (Math.cos(wd * tau) + ((z * w) / wd) * Math.sin(wd * tau))
  );
}

type Event = { t: number; v: number; sp: Spring };

export function track(v0: number, events: Event[], t: number): number {
  let cur = v0;
  let v = v0;
  for (const e of events) {
    v += (e.v - cur) * stepR(t - e.t, e.sp);
    cur = e.v;
  }
  return v;
}

/** Enter on a spring, exit short and early. Content swaps through blur. */
export function vis(t: number, tin: number, tout: number | null, dOut = 0.16) {
  const e = stepR(t - tin, TEXT);
  const x = tout == null ? 0 : clamp((t - tout) / dOut);
  const xo = x * x;
  return {
    opacity: e * (1 - xo),
    blur: (1 - e) * 9 + xo * 9,
    dy: (1 - e) * 14 - xo * 10,
  };
}

export function press(t: number, tc: number) {
  const x = (t - tc) / 0.045;
  return Math.exp(-(x * x));
}
