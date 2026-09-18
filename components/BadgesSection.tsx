'use client';

import { useState } from 'react';
import type { BadgeTier, BadgeWithProgress } from '@/lib/badge-store';
import { Dialog } from '@/components/ui/Dialog';
import { Pill } from '@/components/ui/Chip';

const TIERS: BadgeTier[] = ['white', 'blue', 'brown', 'black'];
const TIER_COLOR: Record<BadgeTier, string> = {
  white: 'var(--svj-gray-300)',
  blue: 'var(--svj-blue-600)',
  brown: 'var(--svj-belt-brown)',
  black: 'var(--svj-navy-900)',
};
const TIER_LABEL: Record<BadgeTier, string> = { white: 'White', blue: 'Blue', brown: 'Brown', black: 'Black' };

function tierIndex(tier: BadgeTier | null) {
  return tier ? TIERS.indexOf(tier) : -1;
}

export function groupBadges(badges: BadgeWithProgress[]) {
  const earned = badges.filter((b) => b.progress.earnedTier !== null);
  const inProgress = badges.filter((b) => b.progress.earnedTier === null && b.progress.currentCount > 0);
  return { earned, inProgress };
}

function BadgeTile({ badge, onOpen }: { badge: BadgeWithProgress; onOpen: () => void }) {
  const { progress, definition } = badge;
  const locked = progress.earnedTier === null;
  return (
    <li>
      <button
        type="button"
        className={`badge-tile w-full ${locked ? 'badge-tile--locked' : ''}`}
        onClick={onOpen}
        aria-label={`${definition.name}: ${locked ? 'not yet earned' : `${TIER_LABEL[progress.earnedTier!]} tier`}${progress.nextTarget ? `, ${progress.currentCount} of ${progress.nextTarget}` : ''}`}
      >
        <span className="badge-tile-art" style={{ ['--tier-color' as string]: locked ? undefined : TIER_COLOR[progress.earnedTier!] }}>
          <img src={definition.imagePath} alt="" />
        </span>
        <span className="badge-tile-name">{definition.name}</span>
        {!progress.isMaxed && progress.nextTarget ? (
          <span className="badge-tile-progress" aria-hidden>
            <span style={{ width: `${Math.round(progress.progressFraction * 100)}%` }} />
          </span>
        ) : null}
      </button>
    </li>
  );
}

/** Badge grid grouped Earned / In progress, with an accessible detail dialog. Token colours only. */
const PREVIEW_COUNT = 12;

export default function BadgesSection({ badges }: { badges: BadgeWithProgress[] }) {
  const [selected, setSelected] = useState<BadgeWithProgress | null>(null);
  const [showAll, setShowAll] = useState(false);
  const { earned, inProgress } = groupBadges(badges);
  const earnedVisible = showAll ? earned : earned.slice(0, PREVIEW_COUNT);

  return (
    <div className="stack">
      {earned.length > 0 ? (
        <div>
          <span className="meta-key block mb-2">Earned · {earned.length}</span>
          <ul className="badge-grid">
            {earnedVisible.map((badge) => (
              <BadgeTile key={badge.definition.id} badge={badge} onOpen={() => setSelected(badge)} />
            ))}
          </ul>
          {earned.length > PREVIEW_COUNT ? (
            <button type="button" className="btn-link mt-2" onClick={() => setShowAll((v) => !v)} aria-expanded={showAll}>
              {showAll ? 'Show fewer' : `Show all ${earned.length}`}
            </button>
          ) : null}
        </div>
      ) : null}
      {inProgress.length > 0 ? (
        <div>
          <span className="meta-key block mb-2">In progress · {inProgress.length}</span>
          <ul className="badge-grid">
            {inProgress.map((badge) => (
              <BadgeTile key={badge.definition.id} badge={badge} onOpen={() => setSelected(badge)} />
            ))}
          </ul>
        </div>
      ) : null}

      <Dialog
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.definition.name ?? ''}
        subtitle={selected?.definition.description}
      >
        {selected ? (
          <div className="stack">
            <div className="flex items-center gap-4">
              <span className="badge-tile-art" style={{ width: 88, height: 88, ['--tier-color' as string]: selected.progress.earnedTier ? TIER_COLOR[selected.progress.earnedTier] : undefined }}>
                <img src={selected.definition.imagePath} alt="" />
              </span>
              <div>
                <p className="text-3xl font-bold text-strong font-heading leading-none tabular-nums">
                  {selected.progress.currentCount}
                  {selected.progress.nextTarget ? <span className="text-lg text-muted font-normal"> / {selected.progress.nextTarget}</span> : null}
                </p>
                <p className="text-sm text-muted mt-1">
                  {selected.progress.isMaxed
                    ? 'Highest tier reached'
                    : selected.progress.nextTier
                      ? `${selected.progress.nextTarget! - selected.progress.currentCount} more for ${TIER_LABEL[selected.progress.nextTier]}`
                      : 'Not started'}
                </p>
                <Pill tone="muted" className="mt-2 capitalize">{selected.definition.category}</Pill>
              </div>
            </div>
            <ol className="grid grid-cols-4 gap-2" aria-label="Tiers">
              {TIERS.map((tier) => {
                const reached = tierIndex(selected.progress.earnedTier) >= TIERS.indexOf(tier);
                const current = selected.progress.earnedTier === tier;
                return (
                  <li key={tier} className={`stat-tile text-center ${current ? 'stat-tile-accent' : ''}`} style={{ opacity: reached ? 1 : 0.55 }}>
                    <span className="belt-mark-swatch mx-auto block mb-1" style={{ ['--belt-color' as string]: TIER_COLOR[tier] }} aria-hidden />
                    <span className="stat-tile-label">{TIER_LABEL[tier]}</span>
                    <span className="text-sm font-semibold text-strong tabular-nums">{selected.definition.tiers[tier]}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
