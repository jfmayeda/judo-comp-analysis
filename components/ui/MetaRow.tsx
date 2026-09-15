import { type ReactElement } from 'react';
import { type MetaRowItem, visibleMetaItems } from './meta-row';

export type { MetaRowItem };

export function MetaRow({ items }: { items: MetaRowItem[] }): ReactElement | null {
  const visible = visibleMetaItems(items);
  if (visible.length === 0) return null;

  return (
    <div className="meta-row">
      {visible.map((item, index) => (
        <span key={item.label} className="meta-row-item">
          {index > 0 ? ' ' : null}
          <span className="meta-row-label">{item.label}:</span>{' '}
          <span
            className={
              item.capitalize ? 'meta-row-value meta-row-value-cap' : 'meta-row-value'
            }
          >
            {item.value}
          </span>
        </span>
      ))}
    </div>
  );
}
