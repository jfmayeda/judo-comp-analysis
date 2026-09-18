'use client';

import { useEffect, useState } from 'react';
import type { AthleteWithNotes } from '@/lib/types';
import { getTechniquesByIds } from '@/lib/supabase-store';
import { techniqueChipLabels } from '@/components/technique-chips';
import { Tag } from '@/components/ui/Chip';
import { SectionHeading } from '@/components/ui/SectionHeading';

function TagGroup({ label, items, tone }: { label: string; items: string[]; tone?: 'blue' | 'navy' }) {
  return (
    <div className="min-w-0">
      <span className="meta-key block mb-2">{label}</span>
      {items.length > 0 ? (
        <div className="tag-row">
          {items.map((item) => (
            <Tag key={item} tone={tone}>{item}</Tag>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">Not recorded</p>
      )}
    </div>
  );
}

/** Tokui-waza, ne-waza and grips as scannable tags. Resolves technique ids once. */
export function TechniqueCard({ athlete, onEdit }: { athlete: AthleteWithNotes; onEdit: () => void }) {
  const [tokuiNames, setTokuiNames] = useState<string[]>([]);
  const [newazaNames, setNewazaNames] = useState<string[]>([]);
  const tokuiKey = (athlete.tokuiTechniqueIds ?? []).join(',');
  const newazaKey = (athlete.newazaTechniqueIds ?? []).join(',');

  useEffect(() => {
    let cancelled = false;
    const tokuiIds = tokuiKey ? tokuiKey.split(',') : [];
    const newazaIds = newazaKey ? newazaKey.split(',') : [];
    Promise.all([getTechniquesByIds(tokuiIds), getTechniquesByIds(newazaIds)])
      .then(([tokui, newaza]) => {
        if (cancelled) return;
        setTokuiNames(tokui.map((t) => t.name));
        setNewazaNames(newaza.map((t) => t.name));
      })
      .catch(() => {
        if (cancelled) return;
        setTokuiNames([]);
        setNewazaNames([]);
      });
    return () => {
      cancelled = true;
    };
  }, [tokuiKey, newazaKey]);

  const tokuiItems = techniqueChipLabels(athlete.tokuiWaza, tokuiNames);
  const newazaItems = techniqueChipLabels(athlete.neWaza, newazaNames);
  const isEmpty = tokuiItems.length === 0 && newazaItems.length === 0 && !athlete.kumiKata;

  return (
    <section className="card" aria-labelledby="techniques-heading">
      <SectionHeading id="techniques-heading" title="Techniques" />
      {isEmpty ? (
        <p className="text-sm text-muted">
          No techniques recorded.{' '}
          <button type="button" className="btn-link" onClick={onEdit}>Add tokui-waza</button>
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <TagGroup label="Tokui-waza · standing" items={tokuiItems} />
          <TagGroup label="Ne-waza · ground" items={newazaItems} tone="navy" />
          {athlete.kumiKata ? (
            <div className="md:col-span-2">
              <span className="meta-key block mb-1">Kumi-kata</span>
              <p className="text-sm text-body">{athlete.kumiKata}</p>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
