'use client';

import { useState, type FormEvent } from 'react';
import type { JudoBelt, Promotion } from '@/lib/types';
import { formatBeltName, getBeltOptions } from '@/lib/belt-utils';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { IconPlus } from '@/components/ui/Icons';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { beltColor } from '@/components/ui/BeltMark';

export type PromotionFormValues = { promotionDate: string; fromBelt: JudoBelt; toBelt: JudoBelt; notes: string };

function todayInput() {
  return new Date().toISOString().split('T')[0];
}

type Props = {
  promotions: Promotion[];
  currentBelt: JudoBelt;
  onAdd: (values: PromotionFormValues) => Promise<void>;
  onDelete: (promotion: Promotion) => void;
};

/** Belt history with a compact inline add form (the current belt updates on add, as before). */
export function PromotionsCard({ promotions, currentBelt, onAdd, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<PromotionFormValues>({ promotionDate: todayInput(), fromBelt: currentBelt, toBelt: 'unset', notes: '' });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onAdd(values);
      setValues({ promotionDate: todayInput(), fromBelt: values.toBelt, toBelt: 'unset', notes: '' });
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const sorted = [...promotions].sort((a, b) => (a.promotionDate < b.promotionDate ? 1 : -1));

  return (
    <section className="card" aria-labelledby="promotions-heading">
      <SectionHeading
        id="promotions-heading"
        title="Belt history"
        count={promotions.length}
        action={!open ? <Button variant="ghost" size="sm" className="no-print" onClick={() => setOpen(true)}><IconPlus size={16} /> Promotion</Button> : null}
      />
      {open ? (
        <form onSubmit={submit} className="panel stack mb-4 no-print">
          <div className="form-grid-3">
            <Field label="Date" required>
              <input type="date" className="form-input" required value={values.promotionDate} onChange={(e) => setValues({ ...values, promotionDate: e.target.value })} />
            </Field>
            <Field label="From">
              <select className="form-input" value={values.fromBelt} onChange={(e) => setValues({ ...values, fromBelt: e.target.value as JudoBelt })}>
                {getBeltOptions().map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="To" required>
              <select className="form-input" value={values.toBelt} onChange={(e) => setValues({ ...values, toBelt: e.target.value as JudoBelt })}>
                {getBeltOptions().map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Notes" optional>
            <input type="text" className="form-input" value={values.notes} placeholder="e.g. Grading location, kata set" onChange={(e) => setValues({ ...values, notes: e.target.value })} />
          </Field>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" size="sm" disabled={saving || values.toBelt === 'unset'}>{saving ? 'Saving…' : 'Add promotion'}</Button>
          </div>
        </form>
      ) : null}
      {sorted.length === 0 ? (
        <p className="text-sm text-muted">No promotions recorded. Add one to build the career timeline.</p>
      ) : (
        <ul>
          {sorted.map((promotion) => (
            <li key={promotion.id} className="list-row">
              <span className="belt-mark-swatch" style={{ ['--belt-color' as string]: beltColor(promotion.toBelt) }} aria-hidden />
              <div className="list-row-main">
                <p className="list-row-title">
                  {formatBeltName(promotion.fromBelt)} → {formatBeltName(promotion.toBelt)}
                </p>
                <p className="list-row-meta">
                  {new Date(promotion.promotionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  {promotion.notes ? ` · ${promotion.notes}` : ''}
                </p>
              </div>
              <Button variant="ghost-danger" size="sm" className="no-print" onClick={() => onDelete(promotion)} aria-label={`Delete promotion to ${formatBeltName(promotion.toBelt)}`}>
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
