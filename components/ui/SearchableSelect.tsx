"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Search, ChevronDown, Check, X, Plus, Loader2 } from "lucide-react";
import { createPortal } from "react-dom";

export interface SelectOption {
  value: string;
  label: string;
  subLabel?: string;
  badge?: string;
  badgeColor?: "blue" | "green" | "amber" | "purple" | "gray";
  disabled?: boolean;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string, label?: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  creatable?: boolean;
  clearable?: boolean;
  className?: string;
  debounceMs?: number;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Pilih opsi...",
  searchPlaceholder = "Ketik untuk mencari...",
  disabled = false,
  creatable = false,
  clearable = true,
  className = "",
  debounceMs = 250,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [dropdownStyles, setDropdownStyles] = useState<React.CSSProperties>({});
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Debounce the search input
  useEffect(() => {
    if (searchTerm === debouncedSearch) {
      setIsDebouncing(false);
      return;
    }
    setIsDebouncing(true);
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setIsDebouncing(false);
      setHighlightedIndex(0); // Reset highlight to first item on search change
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, debouncedSearch, debounceMs]);

  // Dynamic dropdown positioning calculation
  const updateDropdownPosition = useCallback(() => {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 280;

      const renderAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

      setDropdownStyles({
        position: "fixed",
        width: `${rect.width}px`,
        left: `${rect.left}px`,
        ...(renderAbove
          ? { bottom: `${window.innerHeight - rect.top + 4}px` }
          : { top: `${rect.bottom + 4}px` }),
        zIndex: 99999,
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();

      const handleScroll = (e: Event) => {
        // If scrolling inside the dropdown itself, don't close
        if ((e.target as HTMLElement)?.closest?.(".searchable-dropdown-portal")) return;
        updateDropdownPosition();
      };

      window.addEventListener("resize", updateDropdownPosition);
      window.addEventListener("scroll", handleScroll, true);

      // Focus search input on open
      const focusTimer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);

      return () => {
        clearTimeout(focusTimer);
        window.removeEventListener("resize", updateDropdownPosition);
        window.removeEventListener("scroll", handleScroll, true);
      };
    }
  }, [isOpen, updateDropdownPosition]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        if (!(event.target as Element).closest(".searchable-dropdown-portal")) {
          setIsOpen(false);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Currently selected option
  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  // Filter options based on debounced search term
  const filteredOptions = useMemo(() => {
    if (!debouncedSearch.trim()) return options;
    const term = debouncedSearch.toLowerCase().trim();

    return options.filter((opt) => {
      const labelMatch = opt.label.toLowerCase().includes(term);
      const subLabelMatch = opt.subLabel?.toLowerCase().includes(term);
      const badgeMatch = opt.badge?.toLowerCase().includes(term);
      const valueMatch = opt.value.toLowerCase().includes(term);
      return labelMatch || subLabelMatch || badgeMatch || valueMatch;
    });
  }, [options, debouncedSearch]);

  const handleSelect = (val: string, label?: string) => {
    onChange(val, label);
    setIsOpen(false);
    setSearchTerm("");
    setDebouncedSearch("");
    setHighlightedIndex(-1);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearchTerm("");
    setDebouncedSearch("");
    setHighlightedIndex(-1);
  };

  const toggleOpen = () => {
    if (disabled) return;
    if (!isOpen) {
      setSearchTerm("");
      setDebouncedSearch("");
      setHighlightedIndex(-1);
      updateDropdownPosition();
    }
    setIsOpen(!isOpen);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "Enter" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        const next = prev < filteredOptions.length - 1 ? prev + 1 : 0;
        scrollHighlightedIntoView(next);
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        const next = prev > 0 ? prev - 1 : filteredOptions.length - 1;
        scrollHighlightedIntoView(next);
        return next;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        const opt = filteredOptions[highlightedIndex];
        if (!opt.disabled) {
          handleSelect(opt.value, opt.label);
        }
      } else if (
        creatable &&
        searchTerm &&
        !options.some((opt) => opt.label.toLowerCase() === searchTerm.toLowerCase())
      ) {
        handleSelect(searchTerm, searchTerm);
      }
    }
  };

  const scrollHighlightedIntoView = (index: number) => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll(".searchable-option-item");
    if (items[index]) {
      (items[index] as HTMLElement).scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  };

  const getBadgeStyle = (color?: string) => {
    switch (color) {
      case "green":
        return "bg-green-50 text-green-700 border-green-200";
      case "amber":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "purple":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "gray":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "blue":
      default:
        return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  const dropdownMenu = (
    <div
      className="searchable-dropdown-portal bg-surface-container-lowest border border-table-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 backdrop-blur-sm"
      style={dropdownStyles}
      onKeyDown={handleKeyDown}
    >
      {/* Search Bar with Debounce Indicator */}
      <div className="p-2.5 border-b border-table-border bg-surface-container-low/50">
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            className="w-full pl-8 pr-8 py-1.5 text-xs bg-surface-container-lowest border border-table-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 text-on-surface placeholder:text-on-surface-variant/70 shadow-inner"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isDebouncing && (
              <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
            )}
            {searchTerm && !isDebouncing && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchTerm("");
                  setDebouncedSearch("");
                  searchInputRef.current?.focus();
                }}
                className="text-on-surface-variant hover:text-on-surface p-0.5 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Info stats */}
        <div className="flex items-center justify-between mt-1.5 px-0.5 text-[10px] text-on-surface-variant">
          <span>
            {debouncedSearch ? "Hasil pencarian:" : "Total master data:"}
          </span>
          <span className="font-semibold">
            {filteredOptions.length} dari {options.length} opsi
          </span>
        </div>
      </div>

      {/* Options List */}
      <div
        ref={listRef}
        className="max-h-60 overflow-y-auto divide-y divide-table-border/40"
      >
        {filteredOptions.length === 0 && !creatable ? (
          <div className="p-6 text-center">
            <p className="text-xs font-medium text-on-surface-variant">
              Tidak ada data ditemukan
            </p>
            {debouncedSearch && (
              <p className="text-[11px] text-on-surface-variant/70 mt-1">
                Kata kunci &quot;{debouncedSearch}&quot; tidak cocok dengan data apapun.
              </p>
            )}
          </div>
        ) : (
          <>
            {filteredOptions.map((opt, idx) => {
              const isSelected = value === opt.value;
              const isHighlighted = idx === highlightedIndex;

              return (
                <div
                  key={opt.value}
                  className={`searchable-option-item px-3 py-2 text-xs cursor-pointer transition-colors flex items-center justify-between gap-2 ${
                    opt.disabled
                      ? "opacity-40 cursor-not-allowed bg-gray-50"
                      : isSelected
                      ? "bg-primary/10 text-primary font-medium"
                      : isHighlighted
                      ? "bg-surface-container-high text-on-surface"
                      : "text-on-surface hover:bg-surface-container"
                  }`}
                  onClick={() => {
                    if (!opt.disabled) {
                      handleSelect(opt.value, opt.label);
                    }
                  }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold truncate">
                        {opt.label}
                      </span>
                      {opt.badge && (
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded border leading-none ${getBadgeStyle(
                            opt.badgeColor
                          )}`}
                        >
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    {opt.subLabel && (
                      <p className="text-[11px] text-on-surface-variant truncate mt-0.5 font-normal">
                        {opt.subLabel}
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-primary shrink-0" />
                  )}
                </div>
              );
            })}

            {/* Creatable Option */}
            {creatable &&
              searchTerm &&
              !options.some(
                (opt) => opt.label.toLowerCase() === searchTerm.toLowerCase()
              ) && (
                <div
                  className="px-3 py-2.5 text-xs cursor-pointer bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center gap-2 border-t border-blue-100 font-semibold transition-colors"
                  onClick={() => handleSelect(searchTerm, searchTerm)}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambahkan &quot;{searchTerm}&quot;</span>
                </div>
              )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div
      className={`relative w-full ${className}`}
      ref={wrapperRef}
      onKeyDown={handleKeyDown}
    >
      <div
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        tabIndex={disabled ? -1 : 0}
        className={`flex items-center justify-between w-full px-3.5 py-2 border rounded-lg text-sm bg-surface-container-lowest transition-all cursor-pointer ${
          disabled
            ? "bg-surface-container opacity-60 cursor-not-allowed border-table-border"
            : isOpen
            ? "border-primary ring-2 ring-primary/20 shadow-sm"
            : "border-table-border hover:border-primary/60"
        }`}
        onClick={toggleOpen}
      >
        <div className="min-w-0 flex-1 mr-2">
          {selectedOption ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-on-surface font-medium truncate">
                {selectedOption.label}
              </span>
              {selectedOption.badge && (
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border leading-none ${getBadgeStyle(
                    selectedOption.badgeColor
                  )}`}
                >
                  {selectedOption.badge}
                </span>
              )}
            </div>
          ) : value ? (
            <span className="text-on-surface font-medium truncate">
              {value}
            </span>
          ) : (
            <span className="text-on-surface-variant/70 truncate text-xs sm:text-sm">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {clearable && value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Hapus pilihan"
              className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-on-surface-variant transition-transform duration-200 ${
              isOpen ? "rotate-180 text-primary" : ""
            }`}
          />
        </div>
      </div>

      {isMounted && isOpen && !disabled && createPortal(dropdownMenu, document.body)}
    </div>
  );
}
