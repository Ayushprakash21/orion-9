import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  options: Option[];
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
  searchable?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({ value, options, onChange, className = '', placeholder = 'Select...', searchable = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const filteredOptions = searchable 
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()) || o.value.toLowerCase().includes(search.toLowerCase()))
    : options;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => { setIsOpen(!isOpen); setSearch(''); }}
        className="w-full flex items-center justify-between bg-os-input-bg border border-os-border text-os-text-primary px-3 py-2 rounded-sm text-xs focus:outline-none focus:border-os-accent transition-colors"
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown size={14} className="text-os-text-muted shrink-0 ml-2" />
      </button>

      {isOpen && (
        <div className="absolute z-[100] mt-1 w-full bg-os-surface border border-os-border rounded-sm shadow-xl max-h-60 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          {searchable && (
            <div className="p-2 border-b border-os-border shrink-0">
              <input 
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full bg-os-bg border border-os-border text-os-text-primary px-2 py-1 text-xs rounded-sm focus:outline-none focus:border-os-accent"
              />
            </div>
          )}
          <div className="overflow-y-auto overflow-x-hidden flex-1 scrollbar-thin scrollbar-thumb-os-surface-hover">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors ${value === opt.value ? 'bg-os-accent/10 text-os-accent font-medium' : 'text-os-text-primary hover:bg-os-surface-hover'}`}
                >
                  <span className="truncate pr-2">{opt.label}</span>
                  {value === opt.value && <Check size={14} className="shrink-0" />}
                </button>
              ))
            ) : (
              <div className="px-3 py-3 text-xs text-os-text-muted text-center">No options found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
