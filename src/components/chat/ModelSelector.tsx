import { MODELS, Model } from "@/lib/openrouter";
import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface ModelSelectorProps {
  selected: Model;
  onSelect: (model: Model) => void;
}

export default function ModelSelector({ selected, onSelect }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-muted-foreground text-xs hover:text-foreground transition-colors"
      >
        {selected.name}
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute bottom-full right-0 mb-1 bg-popover border border-border rounded-xl shadow-2xl z-50 min-w-[180px] py-1 overflow-hidden">
          {MODELS.map((m) => (
            <button
              key={m.id}
              onClick={() => { onSelect(m); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                m.id === selected.id
                  ? "text-primary bg-primary/10"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
