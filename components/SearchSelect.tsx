"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

interface Option {
  id: number;
  label: string;
  sublabel?: string;
}

export interface SearchSelectHandle {
  focus: () => void;
}

const SearchSelect = forwardRef<
  SearchSelectHandle,
  {
    options: Option[];
    value?: number | "";
    onChange?: (id: number | "") => void;
    placeholder?: string;
    allowEmpty?: boolean;
    emptyLabel?: string;
    className?: string;
    allowFreeText?: boolean;
    freeTextValue?: string;
    onFreeTextChange?: (text: string) => void;
    // Appelé quand l'utilisateur appuie sur Entrée (après sélection éventuelle),
    // pour permettre au parent de déplacer le focus vers le champ suivant.
    onEnter?: () => void;
  }
>(function SearchSelect(
  {
    options,
    value,
    onChange,
    placeholder,
    allowEmpty,
    emptyLabel,
    className = "",
    allowFreeText,
    freeTextValue,
    onFreeTextChange,
    onEnter,
  },
  ref
) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }));

  const selected = options.find((o) => o.id === value);

  useEffect(() => {
    if (selected) {
      setQuery(selected.label);
    } else if (allowFreeText) {
      setQuery(freeTextValue || "");
    } else {
      setQuery("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id, selected?.label]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        if (selected) setQuery(selected.label);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selected]);

  const filtered = options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    setHighlight(0);
  }, [query, open]);

  function selectOption(o: Option) {
    if (onChange) {
      onChange(o.id);
      if (allowFreeText) onFreeTextChange?.("");
    } else if (allowFreeText) {
      onFreeTextChange?.(o.label);
    }
    setQuery(o.label);
    setOpen(false);
    // La liste se démonte à la fermeture : le focus (posé sur le bouton cliqué)
    // serait sinon perdu, empêchant toute suite au clavier. On l'enchaîne nous-même.
    onEnter?.();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && filtered.length > 0) {
        selectOption(filtered[Math.max(highlight, 0)]);
      } else {
        setOpen(false);
        onEnter?.();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      if (selected) setQuery(selected.label);
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (onChange && value !== "") onChange("");
          if (allowFreeText) onFreeTextChange?.(e.target.value);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full rounded-md border border-gray-300 px-3 py-2"
      />
      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {allowEmpty && (
            <button
              type="button"
              onMouseDown={(e) => {
                // Empêche le navigateur de redonner le focus à ce bouton (comportement
                // par défaut du mousedown), ce qui écraserait le focus posé ensuite.
                e.preventDefault();
                onChange?.("");
                setQuery("");
                setOpen(false);
              }}
              className="block w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
            >
              {emptyLabel || "-- Aucun --"}
            </button>
          )}
          {filtered.length === 0 && <p className="px-3 py-2 text-sm text-gray-400">Aucun résultat</p>}
          {filtered.map((o, i) => (
            <button
              key={o.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                selectOption(o);
              }}
              className={`block w-full text-left px-3 py-2 text-sm ${i === highlight ? "bg-blue-50" : "hover:bg-blue-50"}`}
            >
              {o.label}
              {o.sublabel && <span className="block text-xs text-gray-400">{o.sublabel}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

export default SearchSelect;
