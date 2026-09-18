'use client';

import Link from 'next/link';
import type { AthleteWithNotes } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { BeltMark } from '@/components/ui/BeltMark';
import { MetaRow } from '@/components/ui/MetaRow';
import { IconPlus, IconPrint } from '@/components/ui/Icons';
import { SampleDataTag } from '@/components/ui/SampleData';
import { athleteDisplayName } from './AthleteCard';

type Props = {
  athlete: AthleteWithNotes;
  isSample: boolean;
  onQuickCapture: () => void;
  onEdit: () => void;
  captureOpen: boolean;
  editing: boolean;
};

/** Identity + the two primary actions. Everything a coach needs in the first glance. */
export function AthleteHero({ athlete, isSample, onQuickCapture, onEdit, captureOpen, editing }: Props) {
  return (
    <header className="card no-print" aria-label="Athlete">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="page-title">{athleteDisplayName(athlete)}</h1>
            {isSample ? <SampleDataTag label="Sample athlete" /> : null}
          </div>
          <BeltMark belt={athlete.currentBelt} className="mt-2" />
          <MetaRow
            items={[
              { label: 'Stance', value: athlete.stance, capitalize: true },
              { label: 'Weight', value: athlete.weightClass },
              { label: 'Division', value: athlete.ageDivision },
            ]}
          />
        </div>
        <div className="flex flex-wrap gap-2 md:flex-none md:justify-end">
          <Button onClick={onQuickCapture} disabled={captureOpen} aria-controls="quick-capture" className="flex-1 md:flex-none" data-testid="open-quick-capture">
            <IconPlus size={18} /> Quick capture
          </Button>
          <Button as={Link} href={`/athletes/${athlete.id}/print`} variant="secondary" className="flex-1 md:flex-none">
            <IconPrint size={18} /> Print
          </Button>
          <Button variant="secondary" onClick={onEdit} className="flex-1 md:flex-none" aria-pressed={editing}>
            {editing ? 'Close editor' : 'Edit'}
          </Button>
        </div>
      </div>
    </header>
  );
}
