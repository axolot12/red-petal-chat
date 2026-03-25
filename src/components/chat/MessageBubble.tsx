import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChatMessage } from "@/lib/openrouter";
import { Copy, Check, Eye, Code2 } from "lucide-react";
import { useState } from "react";

interface MessageBubbleProps {
  message: ChatMessage;
  onArtifact?: (code: string, lang: string) => void;
  isLast?: boolean;
}

export default function MessageBubble({ message, onArtifact, isLast }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-5`}>
      <div className={`max-w-[85%] md:max-w-[70%] ${isUser ? "bg-muted rounded-2xl px-4 py-3" : ""}`}>
        {isUser ? (
          <p className="text-[0.925rem] leading-relaxed text-foreground whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="chat-prose">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                pre({ children }) {
                  return <PreBlock onArtifact={onArtifact} isLast={isLast}>{children}</PreBlock>;
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

function PreBlock({ children, onArtifact, isLast }: { children: React.ReactNode; onArtifact?: (code: string, lang: string) => void; isLast?: boolean }) {
  const [copied, setCopied] = useState(false);

  let code = "";
  let lang = "text";
  const child = Array.isArray(children) ? children[0] : children;
  if (child && typeof child === "object" && "props" in child) {
    code = typeof child.props.children === "string" ? child.props.children : "";
    const className = child.props.className || "";
    const match = className.match(/language-(\w+)/);
    if (match) lang = match[1];
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Show clickable artifact box (no inline code), clicking opens artifact panel

  // Desktop: show clickable artifact box (no inline code), clicking opens artifact panel
  return (
    <div className="my-3">
      <button
        onClick={() => onArtifact?.(code, lang)}
        className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors text-left"
      >
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Code2 size={18} className="text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">Artifact</p>
          <p className="text-xs text-muted-foreground">{lang} • Click to view</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); handleCopy(); }}
            className="p-1.5 rounded-md hover:bg-primary/20 transition-colors text-muted-foreground"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          </button>
          <Eye size={16} className="text-muted-foreground shrink-0" />
        </div>
      </button>
    </div>
  );
}
