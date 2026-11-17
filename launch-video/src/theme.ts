export const C = {
  blue: "#005e9b",
  blue700: "#00497a",
  blue50: "#eaf3fa",
  navy: "#0b1e2e",
  navy800: "#0f273a",
  navy700: "#163e5d",
  paper: "#f5f7f9",
  white: "#ffffff",
  gray100: "#e8ecef",
  gray200: "#ced6dc",
  gray300: "#b1bdc6",
  gray600: "#54646f",
  gray800: "#2a3742",
  success: "#2f7d4a",
  success50: "#eef6f0",
  warning: "#9a6b00",
  warning50: "#fdf7e7",
  belt: {
    white: "#f7f7f7",
    yellow: "#f5d042",
    orange: "#e07a2f",
    green: "#2f7d4a",
    blue: "#005e9b",
  },
} as const;

export const F = {
  logo: '"Michroma", sans-serif',
  head: '"Archivo", sans-serif',
  body: '"Source Sans 3", sans-serif',
} as const;

export const PHONE = { w: 520, h: 900 };
export const WIDE = { w: 1680, h: 820 };
export const HOOK = { w: 1180, h: 450 };

export type Rect = { x: number; y: number; w: number; h: number };

export const RECT = {
  qc: { x: 32, y: 216, w: 214, h: 48 },
  win: { x: 28, y: 176, w: 148, h: 52 },
  ippon: { x: 28, y: 292, w: 128, h: 44 },
  save: { x: 24, y: 756, w: 472, h: 52 },
  todayNav: { x: 1436, y: 12, w: 108, h: 40 },
  printPack: { x: 1364, y: 108, w: 276, h: 48 },
} as const;

export function rectCenter(r: Rect): [number, number] {
  return [r.x + r.w / 2, r.y + r.h / 2];
}
