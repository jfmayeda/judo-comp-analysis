'use client';

import { useEffect, useState } from 'react';
import { Technique } from '@/lib/types';
import { getTechniquesByIds } from '@/lib/supabase-store';

type TechniqueDisplayProps = {
  techniqueIds: string[];
  label?: string;
  className?: string;
};

export default function TechniqueDisplay({
  techniqueIds,
  label,
  className = '',
}: TechniqueDisplayProps) {
  const [techniques, setTechniques] = useState<Technique[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (techniqueIds.length > 0) {
      loadTechniques();
    } else {
      setTechniques([]);
      setLoading(false);
    }
  }, [techniqueIds]);

  const loadTechniques = async () => {
    try {
      const data = await getTechniquesByIds(techniqueIds);
      setTechniques(data);
    } catch (error) {
      console.error('Error loading techniques:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  if (techniques.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {label && (
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
          {label}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {techniques.map(technique => (
          <span
            key={technique.id}
            className="inline-block px-2 py-1 bg-blue-50 border border-blue-200 rounded text-sm text-blue-900"
          >
            {technique.name}
          </span>
        ))}
      </div>
    </div>
  );
}
