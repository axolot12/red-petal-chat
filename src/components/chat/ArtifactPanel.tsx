import { X, Copy, Check } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ArtifactPanelProps {
  code: string;
  language: string;
  onClose: () => void;
}

export default function ArtifactPanel({ code, language, onClose }: ArtifactPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 250 }}
        className="w-[480px] h-screen flex flex-col bg-artifact border-l border-sidebar-border shrink-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-artifact-header border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-sm font-medium text-chat-foreground">Artifact</span>
            <span className="text-xs text-muted-foreground font-mono bg-code px-2 py-0.5 rounded">{language}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg hover:bg-sidebar-accent text-muted-foreground hover:text-chat-foreground transition-colors"
            >
              {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-sidebar-accent text-muted-foreground hover:text-chat-foreground transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Code */}
        <div className="flex-1 overflow-auto p-4">
          <pre className="text-[0.82rem] font-mono leading-relaxed text-chat-foreground whitespace-pre-wrap">
            <code>{code}</code>
          </pre>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
