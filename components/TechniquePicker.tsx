'use client';

import { useState, useEffect, useMemo } from 'react';
import { Technique } from '@/lib/types';
import { getAllTechniques, getTechniquesByIds } from '@/lib/supabase-store';

type TechniquePickerProps = {
  selectedIds: string[];
  onChange: (techniqueIds: string[]) => void;
  techniques?: Technique[];
  allowCustom?: boolean;
  placeholder?: string;
  label?: string;
  categoryFilter?: 'Tachi-waza' | 'Ne-waza' | null;
};

export default function TechniquePicker({
  selectedIds,
  onChange,
  techniques: techniquesProp,
  allowCustom = true,
  placeholder = 'Search techniques...',
  label = 'Techniques',
  categoryFilter = null,
}: TechniquePickerProps) {
  const [techniques, setTechniques] = useState<Technique[]>([]);
  const [selectedTechniques, setSelectedTechniques] = useState<Technique[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (techniquesProp) {
      setTechniques(techniquesProp);
      setLoading(false);
    } else {
      loadTechniques();
    }
  }, [techniquesProp]);

  useEffect(() => {
    if (selectedIds.length > 0) {
      loadSelectedTechniques();
    } else {
      setSelectedTechniques([]);
    }
  }, [selectedIds]);

  const loadTechniques = async () => {
    try {
      const data = await getAllTechniques();
      setTechniques(data);
    } catch (error) {
      console.error('Error loading techniques:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedTechniques = async () => {
    try {
      const data = await getTechniquesByIds(selectedIds);
      setSelectedTechniques(data);
    } catch (error) {
      console.error('Error loading selected techniques:', error);
    }
  };

  const filteredTechniques = useMemo(() => {
    if (!searchQuery) return techniques;
    
    const query = searchQuery.toLowerCase();
    return techniques.filter(t => 
      t.name.toLowerCase().includes(query) ||
      t.subcategory.toLowerCase().includes(query)
    );
  }, [techniques, searchQuery]);

  const groupedTechniques = useMemo(() => {
    const groups: Record<string, Record<string, Technique[]>> = {
      'Tachi-waza': {},
      'Ne-waza': {},
    };

    filteredTechniques.forEach(technique => {
      if (!groups[technique.category][technique.subcategory]) {
        groups[technique.category][technique.subcategory] = [];
      }
      groups[technique.category][technique.subcategory].push(technique);
    });

    return groups;
  }, [filteredTechniques]);

  const handleToggleTechnique = (techniqueId: string) => {
    const newSelectedIds = selectedIds.includes(techniqueId)
      ? selectedIds.filter(id => id !== techniqueId)
      : [...selectedIds, techniqueId];
    
    onChange(newSelectedIds);
  };

  const handleRemoveTechnique = (techniqueId: string) => {
    const newSelectedIds = selectedIds.filter(id => id !== techniqueId);
    onChange(newSelectedIds);
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading techniques...</div>;
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="eyebrow block text-gray-700">
          {label}
        </label>
      )}

      <div className="space-y-2">
        {selectedTechniques.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedTechniques.map(technique => (
              <div
                key={technique.id}
                className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded text-sm"
              >
                <span className="text-blue-900">{technique.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTechnique(technique.id)}
                  className="text-blue-600 hover:text-blue-800 font-bold"
                  aria-label={`Remove ${technique.name}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="form-input w-full"
          />

          {isOpen && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-10"
                onClick={() => setIsOpen(false)}
                aria-label="Close technique picker"
              />
              
              <div className="absolute z-20 w-full mt-1 max-h-96 overflow-y-auto bg-white border border-gray-300 rounded shadow-lg">
                {Object.entries(groupedTechniques).map(([category, subcategories]) => (
                  <div key={category} className="p-2">
                    <div className="text-xs font-bold uppercase tracking-wide text-gray-500 px-2 py-1 sticky top-0 bg-white">
                      {category}
                    </div>
                    {Object.entries(subcategories).map(([subcategory, techs]) => (
                      <div key={subcategory} className="mb-2">
                        <div className="text-xs font-semibold text-gray-600 px-2 py-1">
                          {subcategory}
                        </div>
                        {techs.map(technique => (
                          <button
                            key={technique.id}
                            type="button"
                            onClick={() => {
                              handleToggleTechnique(technique.id);
                              setSearchQuery('');
                            }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                              selectedIds.includes(technique.id)
                                ? 'bg-blue-50 text-blue-900 font-medium'
                                : 'text-gray-700'
                            }`}
                          >
                            {technique.name}
                            {selectedIds.includes(technique.id) && (
                              <span className="ml-2 text-blue-600">✓</span>
                            )}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
                
                {filteredTechniques.length === 0 && (
                  <div className="p-4 text-sm text-gray-500 text-center">
                    No techniques found
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {allowCustom && (
        <p className="text-xs text-gray-500">
          Can't find a technique? You can still use the free-text fields for custom entries.
        </p>
      )}
    </div>
  );
}
