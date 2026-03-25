import { X, Copy, Check, Code, Eye } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ArtifactPanelProps {
  code: string;
  language: string;
  onClose: () => void;
}

export default function ArtifactPanel({ code, language, onClose }: ArtifactPanelProps) {
  const [copied, setCopied] = useState(false);
  const isHtml = language === "html" || language === "htm";
  const [showPreview, setShowPreview] = useState(isHtml);

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
        className="w-[500px] h-screen flex flex-col bg-popover border-l border-border shrink-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-sm font-semibold text-foreground">Artifact</span>
            <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded-md">{language}</span>
          </div>
          <div className="flex items-center gap-1">
            {isHtml && (
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`p-1.5 rounded-lg transition-colors ${
                  showPreview ? "bg-primary/15 text-primary" : "hover:bg-muted text-muted-foreground"
                }`}
                title={showPreview ? "Show code" : "Show preview"}
              >
                {showPreview ? <Code size={16} /> : <Eye size={16} />}
              </button>
            )}
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {showPreview && isHtml ? (
            <iframe
              srcDoc={code}
              title="HTML Preview"
              className="w-full h-full border-0 bg-white"
              sandbox="allow-scripts"
            />
          ) : (
            <pre className="p-4 text-[0.82rem] font-mono leading-relaxed text-foreground whitespace-pre-wrap">
              <code>{code}</code>
            </pre>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
