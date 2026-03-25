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
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-chat-input text-chat-foreground text-sm hover:bg-chat-user transition-colors"
      >
        {selected.name}
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-chat-input border border-sidebar-border rounded-lg shadow-xl z-50 min-w-[200px] py-1">
          {MODELS.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                onSelect(m);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                m.id === selected.id
                  ? "text-primary bg-primary/10"
                  : "text-chat-foreground hover:bg-sidebar-accent"
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
