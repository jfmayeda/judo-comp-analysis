'use client';

import { useEffect, useState } from 'react';
import { Technique } from '@/lib/types';
import { getTechniquesByIds } from '@/lib/supabase-store';
import { Tag } from '@/components/ui/Chip';

type TechniqueDisplayProps = { techniqueIds: string[]; label?: string; className?: string };

/** Resolves technique ids to names and renders them as quiet tags. Renders nothing when empty. */
export default function TechniqueDisplay({ techniqueIds, label, className = '' }: TechniqueDisplayProps) {
  const [techniques, setTechniques] = useState<Technique[]>([]);
  const key = techniqueIds.join(',');

  useEffect(() => {
    let cancelled = false;
    if (!key) {
      setTechniques([]);
      return;
    }
    getTechniquesByIds(key.split(','))
      .then((data) => {
        if (!cancelled) setTechniques(data);
      })
      .catch((error) => {
        console.error('Error loading techniques:', error);
        if (!cancelled) setTechniques([]);
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  if (techniques.length === 0) return null;

  return (
    <div className={className}>
      {label ? <span className="meta-key block mb-1">{label}</span> : null}
      <div className="tag-row">
        {techniques.map((technique) => (
          <Tag key={technique.id}>{technique.name}</Tag>
        ))}
      </div>
    </div>
  );
}
