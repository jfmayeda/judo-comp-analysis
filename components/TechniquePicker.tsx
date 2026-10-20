'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Technique, ScoreTechniqueCategory } from '@/lib/types';
import { listTechniquesWithoutQuery, techniqueMatchesScoreCategory } from '@/lib/capture-score';
import { getAllTechniques, getTechniquesByIds } from '@/lib/supabase-store';

type TechniquePickerProps = {
  selectedIds: string[];
  onChange: (techniqueIds: string[]) => void;
  techniques?: Technique[];
  allowCustom?: boolean;
  placeholder?: string;
  label?: string;
  categoryFilter?: 'Tachi-waza' | 'Ne-waza' | null;
  scoreCategory?: ScoreTechniqueCategory | null;
  /** Newest-first ids from recent captures; shown without typing. */
  recentIds?: string[];
};

export default function TechniquePicker({
  selectedIds,
  onChange,
  techniques: techniquesProp,
  allowCustom = true,
  placeholder = 'Search techniques...',
  label = 'Techniques',
  categoryFilter = null,
  scoreCategory = null,
  recentIds = [],
}: TechniquePickerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
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
    const openList = listTechniquesWithoutQuery(scoreCategory);
    const query = searchQuery.trim().toLowerCase();
    if (!query && !openList && recentIds.length === 0) return [];

    let filtered = techniques;

    if (scoreCategory) {
      filtered = filtered.filter((t) => techniqueMatchesScoreCategory(t, scoreCategory));
    } else if (categoryFilter) {
      filtered = filtered.filter((t) => t.category === categoryFilter);
    }

    const matchesQuery = (t: Technique) =>
      !query || t.name.toLowerCase().includes(query) || t.subcategory.toLowerCase().includes(query);

    const recentSet = new Set(recentIds);
    const recents = recentIds
      .map((id) => filtered.find((t) => t.id === id))
      .filter((t): t is Technique => Boolean(t) && matchesQuery(t));

    if (!query && !openList) return recents;

    const rest = filtered.filter((t) => matchesQuery(t) && !recentSet.has(t.id));
    return [...recents, ...rest];
  }, [techniques, searchQuery, categoryFilter, scoreCategory, recentIds]);

  const recentTechniques = useMemo(() => {
    const allowed = new Set(filteredTechniques.map((t) => t.id));
    return recentIds
      .map((id) => techniques.find((t) => t.id === id))
      .filter((t): t is Technique => Boolean(t) && allowed.has(t.id));
  }, [recentIds, techniques, filteredTechniques]);

  const groupedTechniques = useMemo(() => {
    const recentSet = new Set(recentIds);
    const groups: Record<string, Record<string, Technique[]>> = {
      'Tachi-waza': {},
      'Ne-waza': {},
    };

    filteredTechniques.forEach(technique => {
      if (recentSet.has(technique.id)) return;
      if (!groups[technique.category][technique.subcategory]) {
        groups[technique.category][technique.subcategory] = [];
      }
      groups[technique.category][technique.subcategory].push(technique);
    });

    return Object.entries(groups).filter(([, subcategories]) =>
      Object.keys(subcategories).length > 0
    );
  }, [filteredTechniques, recentIds]);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

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

  useEffect(() => {
    if (listTechniquesWithoutQuery(scoreCategory) || recentIds.length > 0) setIsOpen(true);
  }, [scoreCategory, recentIds]);

  const showResults =
    isOpen &&
    (searchQuery.trim().length > 0 || listTechniquesWithoutQuery(scoreCategory) || recentIds.length > 0);

  if (loading) {
    return <div className="text-sm text-svj-gray-600">Loading techniques...</div>;
  }

  return (
    <div ref={rootRef} className="technique-picker">
      {label && (
        <label className="eyebrow block text-svj-gray-800">
          {label}
        </label>
      )}

      <div className="technique-picker-body">
        {selectedTechniques.length > 0 && (
          <div className="technique-picker-chips">
            {selectedTechniques.map(technique => (
              <div
                key={technique.id}
                className="technique-picker-chip"
              >
                <span>{technique.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTechnique(technique.id)}
                  aria-label={`Remove ${technique.name}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="form-input"
          aria-expanded={showResults}
          aria-controls="technique-picker-results"
          autoComplete="off"
          data-testid="technique-search"
        />

        {showResults && (
          <div
            id="technique-picker-results"
            className="technique-picker-panel"
            role="listbox"
          >
            {recentTechniques.length > 0 ? (
              <div className="technique-picker-group" data-testid="recent-techniques">
                <div className="technique-picker-category">Recent</div>
                {recentTechniques.map((technique) => {
                  const selected = selectedIds.includes(technique.id);
                  return (
                    <button
                      key={`recent-${technique.id}`}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        handleToggleTechnique(technique.id);
                        setSearchQuery('');
                        setIsOpen(false);
                      }}
                      className="technique-picker-option"
                    >
                      {technique.name}
                      {selected ? <span aria-hidden> ✓</span> : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
            {groupedTechniques.map(([category, subcategories]) => (
              <div key={category} className="technique-picker-group">
                <div className="technique-picker-category">
                  {category}
                </div>
                {Object.entries(subcategories).map(([subcategory, techs]) => (
                  <div key={subcategory} className="technique-picker-subcategory">
                    <div className="technique-picker-subhead">
                      {subcategory}
                    </div>
                    {techs.map(technique => {
                      const selected = selectedIds.includes(technique.id);
                      return (
                        <button
                          key={technique.id}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          onClick={() => {
                            handleToggleTechnique(technique.id);
                            setSearchQuery('');
                            setIsOpen(false);
                          }}
                          className="technique-picker-option"
                        >
                          {technique.name}
                          {selected ? <span aria-hidden> ✓</span> : null}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}

            {filteredTechniques.length === 0 && (
              <div className="technique-picker-empty">
                No techniques found
              </div>
            )}
          </div>
        )}
      </div>

      {allowCustom && (
        <p className="technique-picker-hint">
          Can't find a technique? You can still use the free-text fields for custom entries.
        </p>
      )}
    </div>
  );
}
