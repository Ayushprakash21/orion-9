import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Check, ChevronDown } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  subLabel?: string;
  searchStr?: string;
  group?: string;
}

interface SearchableDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  className = '',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0, openUpward: false });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  const filteredOptions = options.filter(o => {
    if (!search) return true;
    const s = search.toLowerCase();
    const searchable = o.searchStr || `${o.label} ${o.subLabel || ''} ${o.value}`;
    return searchable.toLowerCase().includes(s);
  });

  // Grouping
  const groupedOptions = filteredOptions.reduce((acc, opt) => {
    const g = opt.group || 'Other';
    if (!acc[g]) acc[g] = [];
    acc[g].push(opt);
    return acc;
  }, {} as Record<string, DropdownOption[]>);
  
  const hasGroups = Object.keys(groupedOptions).length > 1 || (Object.keys(groupedOptions)[0] !== 'Other');
  
  // Flat list for keyboard nav
  const flatVisibleOptions = hasGroups ? Object.values(groupedOptions).flat() : filteredOptions;

  
  const updatePosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      const dropdownHeight = 300; // estimated max height
      const openUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
      
      let left = rect.left;
      const minWidth = viewportWidth < 640 ? viewportWidth - 32 : Math.max(rect.width, 300);
      
      // Prevent horizontal overflow
      if (left + minWidth > viewportWidth - 16) {
        left = viewportWidth - minWidth - 16;
      }
      
      setDropdownPosition({
        top: openUpward ? rect.top - 8 : rect.bottom + 4,
        left: Math.max(16, left),
        width: viewportWidth < 640 ? viewportWidth - 32 : Math.max(rect.width, 300),
        openUpward
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node) && 
          listRef.current && !listRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      if (isOpen) {
        updatePosition();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isOpen]);

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
      setSearch('');
      setFocusedIndex(flatVisibleOptions.findIndex(o => o.value === value));
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, value]);

  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[role="option"]');
      const focusedItem = items[focusedIndex] as HTMLElement;
      if (focusedItem) {
        focusedItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (!disabled) setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => (prev < flatVisibleOptions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < flatVisibleOptions.length) {
        onChange(flatVisibleOptions[focusedIndex].value);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const portalContent = isOpen ? createPortal(
    <div 
      className={`fixed z-[100] min-w-[280px] bg-os-surface border border-os-border-strong rounded-lg overflow-hidden shadow-xl flex flex-col animate-in fade-in ${dropdownPosition.openUpward ? 'slide-in-from-bottom-1 -translate-y-full' : 'slide-in-from-top-1'} duration-200`}
      style={{
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width
      }}
      ref={listRef}
    >
      <div className="p-2 border-b border-os-border flex items-center gap-2 bg-os-surface-secondary">
        <Search size={14} className="text-os-text-muted shrink-0" />
        <input
          ref={inputRef}
          type="text"
          className="bg-transparent border-none outline-none w-full text-sm text-os-text-primary placeholder:text-os-text-muted"
          placeholder="Search..."
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setFocusedIndex(0);
          }}
          onKeyDown={(e) => {
            // Prevent event from propagating up to the container which might close it
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === 'Escape') {
              handleKeyDown(e);
            }
          }}
        />
      </div>
      <div className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
        {flatVisibleOptions.length === 0 ? (
          <div className="px-3 py-4 text-center text-sm text-os-text-muted">No results found</div>
        ) : hasGroups ? (
          Object.entries(groupedOptions).map(([group, opts]) => (
            <div key={group}>
              <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-semibold text-os-text-muted bg-os-surface-hover/50">
                {group}
              </div>
              {opts.map(o => {
                const idx = flatVisibleOptions.indexOf(o);
                return (
                  <div
                    key={o.value}
                    role="option"
                    aria-selected={idx === focusedIndex}
                    onClick={() => { onChange(o.value); setIsOpen(false); }}
                    className={`px-3 py-2 cursor-pointer flex items-center justify-between text-sm ${
                      idx === focusedIndex ? 'bg-os-surface-hover text-os-text-primary' : 'text-os-text-secondary hover:bg-os-surface-hover hover:text-os-text-primary'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="font-mono text-xs w-10 shrink-0 opacity-70">{o.value}</span>
                      <span className="truncate">{o.label}</span>
                      {o.subLabel && <span className="text-xs text-os-text-muted ml-2 shrink-0">{o.subLabel}</span>}
                    </div>
                    {value === o.value && <Check size={14} className="text-[#30D158] shrink-0 ml-2" />}
                  </div>
                );
              })}
            </div>
          ))
        ) : (
          flatVisibleOptions.map((o, idx) => (
            <div
              key={o.value}
              role="option"
              aria-selected={idx === focusedIndex}
              onClick={() => { onChange(o.value); setIsOpen(false); }}
              className={`px-3 py-2 cursor-pointer flex items-center justify-between text-sm ${
                idx === focusedIndex ? 'bg-os-surface-hover text-os-text-primary' : 'text-os-text-secondary hover:bg-os-surface-hover hover:text-os-text-primary'
              }`}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="font-mono text-xs w-10 shrink-0 opacity-70">{o.value}</span>
                <span className="truncate">{o.label}</span>
                {o.subLabel && <span className="text-xs text-os-text-muted ml-2 shrink-0">{o.subLabel}</span>}
              </div>
              {value === o.value && <Check size={14} className="text-[#30D158] shrink-0 ml-2" />}
            </div>
          ))
        )}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className={`relative ${className}`} ref={containerRef} onKeyDown={handleKeyDown}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-os-input-bg border border-os-border-strong rounded-lg px-3 py-2 text-sm text-left transition-colors focus:outline-none focus:border-os-surface-hover ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-os-surface-hover cursor-pointer'}`}
      >
        <span className={`block truncate ${!selectedOption ? 'text-os-text-muted' : 'text-os-text-primary'}`}>
          {selectedOption ? (
            <span className="flex items-center gap-2">
              <span className="font-mono text-os-text-secondary">{selectedOption.value}</span>
              <span>{selectedOption.label}</span>
            </span>
          ) : placeholder}
        </span>
        <ChevronDown size={16} className={`text-os-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {portalContent}
    </div>
  );
};
