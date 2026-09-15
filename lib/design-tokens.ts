export type TokenKind = 'color' | 'type' | 'space' | 'radius' | 'shadow' | 'motion';

export type DesignToken = {
  name: string;
  label: string;
  kind: TokenKind;
};

export type TokenGroup = {
  id: string;
  label: string;
  tokens: readonly DesignToken[];
};

/** Inventory of CSS variables. Values live in app/globals.css — do not duplicate hex here. */
export const DESIGN_TOKEN_GROUPS: readonly TokenGroup[] = [
  {
    id: 'brand',
    label: 'Brand blue',
    tokens: [
      { name: '--svj-blue-500', label: 'Blue 500', kind: 'color' },
      { name: '--svj-blue-600', label: 'Blue 600 · primary', kind: 'color' },
      { name: '--svj-blue-700', label: 'Blue 700 · hover', kind: 'color' },
      { name: '--svj-blue-800', label: 'Blue 800', kind: 'color' },
    ],
  },
  {
    id: 'navy',
    label: 'Navy',
    tokens: [
      { name: '--svj-navy-600', label: 'Navy 600', kind: 'color' },
      { name: '--svj-navy-700', label: 'Navy 700', kind: 'color' },
      { name: '--svj-navy-800', label: 'Navy 800', kind: 'color' },
      { name: '--svj-navy-900', label: 'Navy 900', kind: 'color' },
    ],
  },
  {
    id: 'neutrals',
    label: 'Neutrals',
    tokens: [
      { name: '--svj-white', label: 'White', kind: 'color' },
      { name: '--svj-paper', label: 'Paper', kind: 'color' },
      { name: '--svj-gray-100', label: 'Gray 100', kind: 'color' },
      { name: '--svj-gray-200', label: 'Gray 200', kind: 'color' },
      { name: '--svj-gray-400', label: 'Gray 400', kind: 'color' },
      { name: '--svj-gray-600', label: 'Gray 600', kind: 'color' },
      { name: '--svj-gray-800', label: 'Gray 800', kind: 'color' },
      { name: '--svj-black', label: 'Black', kind: 'color' },
    ],
  },
  {
    id: 'tatami',
    label: 'Tatami washes',
    tokens: [
      { name: '--svj-tatami-red', label: 'Tatami red', kind: 'color' },
      { name: '--svj-tatami-green', label: 'Tatami green', kind: 'color' },
      { name: '--svj-tatami-gray', label: 'Tatami gray', kind: 'color' },
    ],
  },
  {
    id: 'belts',
    label: 'Belt ranks',
    tokens: [
      { name: '--svj-belt-white', label: 'White', kind: 'color' },
      { name: '--svj-belt-yellow', label: 'Yellow', kind: 'color' },
      { name: '--svj-belt-orange', label: 'Orange', kind: 'color' },
      { name: '--svj-belt-green', label: 'Green', kind: 'color' },
      { name: '--svj-belt-blue', label: 'Blue', kind: 'color' },
      { name: '--svj-belt-purple', label: 'Purple', kind: 'color' },
      { name: '--svj-belt-brown', label: 'Brown', kind: 'color' },
      { name: '--svj-belt-black', label: 'Black', kind: 'color' },
    ],
  },
  {
    id: 'semantic',
    label: 'Semantic',
    tokens: [
      { name: '--svj-text-strong', label: 'Text strong', kind: 'color' },
      { name: '--svj-text-body', label: 'Text body', kind: 'color' },
      { name: '--svj-text-muted', label: 'Text muted', kind: 'color' },
      { name: '--svj-text-inverse', label: 'Text inverse', kind: 'color' },
      { name: '--svj-surface-page', label: 'Surface page', kind: 'color' },
      { name: '--svj-surface-alt', label: 'Surface alt', kind: 'color' },
      { name: '--svj-surface-card', label: 'Surface card', kind: 'color' },
      { name: '--svj-surface-dark', label: 'Surface dark', kind: 'color' },
      { name: '--svj-surface-brand', label: 'Surface brand', kind: 'color' },
      { name: '--svj-border-subtle', label: 'Border subtle', kind: 'color' },
      { name: '--svj-border-default', label: 'Border default', kind: 'color' },
      { name: '--svj-border-strong', label: 'Border strong', kind: 'color' },
      { name: '--svj-action-primary-bg', label: 'Action primary', kind: 'color' },
      { name: '--svj-focus-ring', label: 'Focus ring', kind: 'color' },
      { name: '--svj-danger', label: 'Danger (app)', kind: 'color' },
    ],
  },
  {
    id: 'type',
    label: 'Type',
    tokens: [
      { name: '--svj-font-logo', label: 'Font logo', kind: 'type' },
      { name: '--svj-font-heading', label: 'Font heading', kind: 'type' },
      { name: '--svj-font-body', label: 'Font body', kind: 'type' },
      { name: '--svj-fs-display', label: 'Display', kind: 'type' },
      { name: '--svj-fs-h1', label: 'H1', kind: 'type' },
      { name: '--svj-fs-h2', label: 'H2', kind: 'type' },
      { name: '--svj-fs-h3', label: 'H3', kind: 'type' },
      { name: '--svj-fs-h4', label: 'H4', kind: 'type' },
      { name: '--svj-fs-body', label: 'Body', kind: 'type' },
      { name: '--svj-fs-caption', label: 'Caption', kind: 'type' },
      { name: '--svj-fs-eyebrow', label: 'Eyebrow', kind: 'type' },
      { name: '--svj-lh-heading', label: 'LH heading', kind: 'type' },
      { name: '--svj-lh-body', label: 'LH body', kind: 'type' },
      { name: '--svj-ls-eyebrow', label: 'Tracking eyebrow', kind: 'type' },
      { name: '--svj-ls-heading', label: 'Tracking heading', kind: 'type' },
      { name: '--svj-ls-button', label: 'Tracking button', kind: 'type' },
    ],
  },
  {
    id: 'spacing',
    label: 'Spacing',
    tokens: [
      { name: '--svj-space-1', label: 'Space 1 · 4', kind: 'space' },
      { name: '--svj-space-2', label: 'Space 2 · 8', kind: 'space' },
      { name: '--svj-space-3', label: 'Space 3 · 12', kind: 'space' },
      { name: '--svj-space-4', label: 'Space 4 · 16', kind: 'space' },
      { name: '--svj-space-5', label: 'Space 5 · 24', kind: 'space' },
      { name: '--svj-space-6', label: 'Space 6 · 32', kind: 'space' },
      { name: '--svj-space-7', label: 'Space 7 · 48', kind: 'space' },
      { name: '--svj-space-8', label: 'Space 8 · 64', kind: 'space' },
      { name: '--svj-space-9', label: 'Space 9 · 96', kind: 'space' },
      { name: '--svj-space-10', label: 'Space 10 · 128', kind: 'space' },
      { name: '--svj-gutter', label: 'Gutter', kind: 'space' },
      { name: '--svj-header-h', label: 'Header height', kind: 'space' },
    ],
  },
  {
    id: 'radii',
    label: 'Radii & borders',
    tokens: [
      { name: '--svj-radius-control', label: 'Control 2px', kind: 'radius' },
      { name: '--svj-radius-input', label: 'Input 4px', kind: 'radius' },
      { name: '--svj-radius-card', label: 'Card 8px', kind: 'radius' },
      { name: '--svj-radius-pill', label: 'Pill', kind: 'radius' },
      { name: '--svj-border-width-hairline', label: 'Hairline', kind: 'radius' },
      { name: '--svj-border-width-neo', label: 'Neo 2px', kind: 'radius' },
      { name: '--svj-border-width-stroke', label: 'Stroke 4px', kind: 'radius' },
    ],
  },
  {
    id: 'shadows',
    label: 'Shadows',
    tokens: [
      { name: '--svj-shadow-neo', label: 'Neo (app default)', kind: 'shadow' },
      { name: '--svj-shadow-neo-hover', label: 'Neo hover', kind: 'shadow' },
      { name: '--svj-shadow-card', label: 'Marketing card', kind: 'shadow' },
      { name: '--svj-shadow-raised', label: 'Marketing raised', kind: 'shadow' },
      { name: '--svj-shadow-header', label: 'Header', kind: 'shadow' },
    ],
  },
  {
    id: 'motion',
    label: 'Motion',
    tokens: [
      { name: '--svj-dur-fast', label: 'Fast 120ms', kind: 'motion' },
      { name: '--svj-dur-base', label: 'Base 200ms', kind: 'motion' },
      { name: '--svj-dur-slow', label: 'Slow 420ms', kind: 'motion' },
      { name: '--svj-ease-standard', label: 'Ease standard', kind: 'motion' },
    ],
  },
];
