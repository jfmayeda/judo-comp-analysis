import type { SVGProps } from 'react';

/* Lucide-style 2px stroke glyphs on a 24px grid (DESIGN.md: no emoji). */
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 20, ...rest }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false,
    ...rest,
  };
}

export const IconSearch = (p: IconProps) => (
  <svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
);
export const IconChevronDown = (p: IconProps) => (
  <svg {...base(p)}><path d="m6 9 6 6 6-6" /></svg>
);
export const IconChevronRight = (p: IconProps) => (
  <svg {...base(p)}><path d="m9 6 6 6-6 6" /></svg>
);
export const IconArrowLeft = (p: IconProps) => (
  <svg {...base(p)}><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>
);
export const IconPlus = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 5v14" /><path d="M5 12h14" /></svg>
);
export const IconClose = (p: IconProps) => (
  <svg {...base(p)}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
);
export const IconCheck = (p: IconProps) => (
  <svg {...base(p)}><path d="m5 12 5 5L20 7" /></svg>
);
export const IconPrint = (p: IconProps) => (
  <svg {...base(p)}><path d="M6 9V3h12v6" /><rect x="4" y="9" width="16" height="8" rx="1" /><path d="M6 14h12v7H6z" /></svg>
);
export const IconUsers = (p: IconProps) => (
  <svg {...base(p)}><circle cx="9" cy="8" r="4" /><path d="M2 21a7 7 0 0 1 14 0" /><path d="M17 4a4 4 0 0 1 0 8" /><path d="M22 21a7 7 0 0 0-5-6.7" /></svg>
);
export const IconShield = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" /></svg>
);
export const IconCalendar = (p: IconProps) => (
  <svg {...base(p)}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></svg>
);
export const IconMore = (p: IconProps) => (
  <svg {...base(p)}><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg>
);
export const IconWifiOff = (p: IconProps) => (
  <svg {...base(p)}><path d="m2 2 20 20" /><path d="M8.5 16.5a5 5 0 0 1 7 0" /><path d="M5 12.5a10 10 0 0 1 4.2-2.6" /><path d="M2 9a15 15 0 0 1 4.4-3" /><path d="M12 20h.01" /></svg>
);
export const IconAlert = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 3 2 21h20z" /><path d="M12 10v5" /><path d="M12 18h.01" /></svg>
);
export const IconInfo = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 8h.01" /></svg>
);
export const IconLock = (p: IconProps) => (
  <svg {...base(p)}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
);
export const IconStar = (p: IconProps) => (
  <svg {...base(p)}><path d="m12 3 2.8 5.9 6.4.8-4.7 4.4 1.2 6.3L12 17.3 6.3 20.4l1.2-6.3L2.8 9.7l6.4-.8z" /></svg>
);
export const IconDownload = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 4v12" /><path d="m7 11 5 5 5-5" /><path d="M4 20h16" /></svg>
);
