"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X, Plus } from 'lucide-react';
import { createPortal } from 'react-dom';

export interface SelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string, label?: string) => void;
  placeholder?: string;
  disabled?: boolean;
  creatable?: boolean;
}

export default function SearchableSelect({ options, value, onChange, placeholder = "Pilih opsi...", disabled = false, creatable = false }: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dropdownStyles, setDropdownStyles] = useState<React.CSSProperties>({});
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Debounce the search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const updateDropdownPosition = () => {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      // Determine if there is enough space below, otherwise render above
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 250; // estimated max height

      const renderAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

      setDropdownStyles({
        position: 'fixed',
        width: `${rect.width}px`,
        left: `${rect.left}px`,
        ...(renderAbove 
            ? { bottom: `${window.innerHeight - rect.top + 4}px` }
            : { top: `${rect.bottom + 4}px` }
        ),
        zIndex: 99999, // Ensure it's above any modal
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      
      const handleScroll = (e: Event) => {
        // If scrolling inside the dropdown itself, don't close
        if ((e.target as HTMLElement)?.closest?.('.searchable-dropdown-portal')) return;
        setIsOpen(false); // Close on any other scroll to prevent detachment
      };
      
      window.addEventListener('resize', updateDropdownPosition);
      window.addEventListener('scroll', handleScroll, true); // capture phase to catch all scrolls
      
      return () => {
        window.removeEventListener('resize', updateDropdownPosition);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        // Also check if click is inside the portal
        if (!(event.target as Element).closest('.searchable-dropdown-portal')) {
          setIsOpen(false);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const handleSelect = (val: string, label?: string) => {
    onChange(val, label);
    setIsOpen(false);
    setSearchTerm('');
    setDebouncedSearch('');
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
    setDebouncedSearch('');
  };

  const toggleOpen = () => {
    if (!disabled) {
      if (!isOpen) {
        setSearchTerm('');
        setDebouncedSearch('');
        updateDropdownPosition();
      }
      setIsOpen(!isOpen);
    }
  };

  const dropdownMenu = (
    <div 
      className="searchable-dropdown-portal bg-white border border-outline-variant rounded-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
      style={dropdownStyles}
    >
      <div className="p-2 border-b border-table-border">
        <div className="relative">
          <Search className="absolute left-2 top-2 h-4 w-4 text-on-surface-variant" />
          <input
            type="text"
            className="w-full pl-8 pr-3 py-1.5 text-sm border-none focus:outline-none focus:ring-0 bg-surface-container-lowest rounded text-black placeholder:text-on-surface-variant/70"
            placeholder="Ketik untuk mencari..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        </div>
      </div>
      <div className="max-h-60 overflow-y-auto">
        {filteredOptions.length === 0 && !creatable ? (
          <div className="p-3 text-sm text-center text-on-surface-variant">Tidak ada opsi ditemukan.</div>
        ) : (
          <>
            {filteredOptions.map((opt) => (
              <div
                key={opt.value}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-surface-container flex items-center justify-between ${value === opt.value ? 'bg-primary/5 font-medium text-primary' : 'text-black'}`}
                onClick={() => handleSelect(opt.value, opt.label)}
              >
                <span className="truncate">{opt.label}</span>
                {value === opt.value && <Check className="w-4 h-4 text-primary" />}
              </div>
            ))}
            {creatable && searchTerm && !options.some(opt => opt.label.toLowerCase() === searchTerm.toLowerCase()) && (
              <div
                className="px-3 py-2 text-sm cursor-pointer bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center border-t border-blue-100 font-medium"
                onClick={() => handleSelect("0", searchTerm)}
              >
                <Plus className="w-4 h-4 mr-2" /> Tambahkan "{searchTerm}"
              </div>
            )}
            {filteredOptions.length === 0 && creatable && !searchTerm && (
              <div className="p-3 text-sm text-center text-on-surface-variant">Ketik untuk menambahkan data baru.</div>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div 
        className={`flex items-center justify-between w-full px-3 py-2 border border-outline-variant rounded text-sm bg-white cursor-pointer transition-colors ${disabled ? 'bg-gray-100 opacity-70 cursor-not-allowed' : 'hover:border-primary'}`}
        onClick={toggleOpen}
      >
        <span className={selectedOption ? 'text-black truncate' : (value === '0' ? 'text-black font-medium truncate' : 'text-on-surface-variant truncate')}>
          {selectedOption ? selectedOption.label : (value === '0' ? 'Custom / Data Baru' : placeholder)}
        </span>
        <div className="flex items-center gap-1">
          {value && !disabled && (
            <div 
              onClick={clearSelection}
              className="p-1 hover:bg-gray-100 rounded-full text-on-surface-variant"
            >
              <X className="w-3 h-3" />
            </div>
          )}
          <ChevronDown className="w-4 h-4 text-on-surface-variant" />
        </div>
      </div>

      {isMounted && isOpen && !disabled && createPortal(dropdownMenu, document.body)}
    </div>
  );
}
