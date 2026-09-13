'use client';

import { useState, useEffect, useRef } from 'react';
import { Technique } from '@/lib/types';

interface TechniquePickerProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  techniques: Technique[];
  categoryFilter?: 'Tachi-waza' | 'Ne-waza' | null;
  placeholder?: string;
  label?: string;
}

export default function TechniquePicker({
  selectedIds,
  onChange,
  techniques,
  categoryFilter = null,
  placeholder = 'Type to search techniques...',
  label = 'Techniques',
}: TechniquePickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredTechniques, setFilteredTechniques] = useState<Technique[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter techniques based on search query and category
  useEffect(() => {
    let filtered = techniques;

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter((t) => t.category === categoryFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((t) =>
        t.name.toLowerCase().includes(query)
      );
    }

    // Sort: standard techniques first, then custom, alphabetically within each group
    filtered.sort((a, b) => {
      if (a.isCustom !== b.isCustom) return a.isCustom ? 1 : -1;
      return a.name.localeCompare(b.name);
    });

    setFilteredTechniques(filtered);
  }, [searchQuery, techniques, categoryFilter]);

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedTechniques = techniques.filter((t) =>
    selectedIds.includes(t.id)
  );

  const handleToggleTechnique = (techniqueId: string) => {
    if (selectedIds.includes(techniqueId)) {
      onChange(selectedIds.filter((id) => id !== techniqueId));
    } else {
      onChange([...selectedIds, techniqueId]);
    }
  };

  const handleRemoveTechnique = (techniqueId: string) => {
    onChange(selectedIds.filter((id) => id !== techniqueId));
  };

  const handleDone = () => {
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="space-y-2">
      <label className="eyebrow block text-gray-700">{label}</label>

      {/* Selected techniques - compact chips */}
      {selectedTechniques.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedTechniques.map((technique) => (
            <span
              key={technique.id}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded"
            >
              {technique.name}
              {technique.isCustom && (
                <span className="text-xs text-blue-600">*</span>
              )}
              <button
                type="button"
                onClick={() => handleRemoveTechnique(technique.id)}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative" ref={containerRef}>
        <input
          ref={inputRef}
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

        {/* Dropdown results */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-y-auto">
            {/* Mobile: Done button at top */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-2 flex justify-between items-center md:hidden">
              <span className="text-sm text-gray-600">
                {selectedIds.length} selected
              </span>
              <button
                type="button"
                onClick={handleDone}
                className="text-sm font-semibold text-blue-600 hover:text-blue-800"
              >
                Done
              </button>
            </div>

            {searchQuery.trim() === '' && filteredTechniques.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                Type to search techniques
              </div>
            ) : filteredTechniques.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No techniques found
              </div>
            ) : (
              <ul>
                {filteredTechniques.map((technique) => {
                  const isSelected = selectedIds.includes(technique.id);
                  return (
                    <li key={technique.id}>
                      <button
                        type="button"
                        onClick={() => handleToggleTechnique(technique.id)}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center justify-between ${
                          isSelected ? 'bg-blue-50' : ''
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{technique.name}</span>
                          {technique.isCustom && (
                            <span className="text-xs text-gray-500 italic">
                              (custom)
                            </span>
                          )}
                        </span>
                        {isSelected && (
                          <span className="text-blue-600 font-semibold">✓</span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Desktop: Done button at bottom */}
            <div className="hidden md:block sticky bottom-0 bg-white border-t border-gray-200 p-2">
              <button
                type="button"
                onClick={handleDone}
                className="w-full text-sm font-semibold text-blue-600 hover:text-blue-800"
              >
                Done ({selectedIds.length} selected)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
