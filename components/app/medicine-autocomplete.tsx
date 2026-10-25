"use client";

import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Medicine = { id: number; name: string; composition: string; pack_size: string; manufacturer: string };

// A text box that suggests medicines from the imported CSV as you type.
// The doctor can also type any name that isn't in the list.
export function MedicineAutocomplete({ value, onChange }: { value: string; onChange: (name: string) => void }) {
  const [suggestions, setSuggestions] = useState<Medicine[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const request = useRef<AbortController>(undefined);

  // We only search when the doctor types (not when a saved prescription loads).
  function onType(text: string) {
    onChange(text);
    clearTimeout(timer.current);
    request.current?.abort();

    const q = text.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    // Wait 200ms after the last keystroke, and cancel out-of-date requests.
    timer.current = setTimeout(async () => {
      const controller = (request.current = new AbortController());
      try {
        const res = await fetch(`/api/medicines?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        if (!res.ok) return;
        setSuggestions(await res.json());
        setHighlight(0);
        setOpen(true);
      } catch {
        // Aborted because the user kept typing: nothing to do.
      }
    }, 200);
  }

  function choose(medicine: Medicine) {
    onChange(medicine.name);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => Math.min(h + 1, suggestions.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); choose(suggestions[highlight]); }
    else if (e.key === "Escape") setOpen(false);
  }

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => onType(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Start typing a medicine…"
        aria-label="Medicine name"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <ul role="listbox" className="absolute z-20 mt-1 max-h-72 w-full min-w-80 overflow-auto border bg-popover text-popover-foreground shadow-lg">
          {suggestions.map((m, i) => (
            <li
              key={m.id}
              role="option"
              aria-selected={i === highlight}
              onMouseDown={(e) => { e.preventDefault(); choose(m); }}
              onMouseEnter={() => setHighlight(i)}
              className={cn("cursor-pointer px-3 py-2 text-sm", i === highlight && "bg-muted")}
            >
              <span className="font-medium">{m.name}</span>
              <span className="block text-xs text-muted-foreground">
                {m.composition} · {m.pack_size}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
