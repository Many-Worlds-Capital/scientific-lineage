"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Scientist } from "@/lib/types";

interface SearchBarProps {
  scientists: Scientist[];
  onSearch: (query: string) => void;
  onSelect: (scientist: Scientist) => void;
}

export default function SearchBar({ scientists, onSearch, onSelect }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const filtered = query.length >= 2
    ? scientists
        .filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 8)
    : [];

  // Debounced graph highlight
  const debouncedSearch = useCallback(
    (q: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onSearch(q), 200);
    },
    [onSearch]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setShowDropdown(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="relative">
      <div className="flex items-center bg-[#12121a]/90 backdrop-blur border border-white/10 rounded-lg px-3 py-2 w-72">
        <svg
          className="w-4 h-4 text-white/40 mr-2 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
            debouncedSearch(e.target.value);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Search scientists... (\u2318K)"
          className="bg-transparent text-white text-sm placeholder-white/30 outline-none w-full"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setShowDropdown(false);
              onSearch("");
            }}
            className="text-white/40 hover:text-white ml-1"
          >
            &times;
          </button>
        )}
      </div>

      {showDropdown && filtered.length > 0 && (
        <div className="absolute top-full mt-1 w-72 bg-[#12121a] border border-white/10 rounded-lg overflow-hidden shadow-xl z-50">
          {filtered.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                onSelect(s);
                setShowDropdown(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-white/5 transition-colors flex items-center justify-between"
            >
              <div>
                <span className="text-sm text-white">{s.name}</span>
                {s.institution && (
                  <span className="text-xs text-white/40 ml-2">
                    {s.institution}
                  </span>
                )}
              </div>
              <span className="text-xs text-white/30">h={s.hIndex}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
