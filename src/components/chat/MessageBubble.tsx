import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChatMessage } from "@/lib/openrouter";
import { Copy, Check, Eye } from "lucide-react";
import { useState, useEffect } from "react";

interface MessageBubbleProps {
  message: ChatMessage;
  onArtifact?: (code: string, lang: string) => void;
  isLast?: boolean;
}

export default function MessageBubble({ message, onArtifact, isLast }: MessageBubbleProps) {
  const isUser = message.role === "user";

  // Check if message has image
  if (isUser && message.content.startsWith("data:image")) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[300px] rounded-2xl overflow-hidden bg-chat-user">
          <img src={message.content} alt="Uploaded" className="w-full h-auto" />
        </div>
      </div>
    );
  }

  // Check for mixed content (text + image marker)
  const imageMatch = isUser ? message.content.match(/\[IMAGE:(.*?)\]/) : null;
  const textContent = isUser && imageMatch ? message.content.replace(/\[IMAGE:.*?\]/, "").trim() : message.content;
  const imageData = imageMatch ? imageMatch[1] : null;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-5`}>
      <div className={`max-w-[70%] ${isUser ? "bg-muted rounded-2xl px-4 py-3" : ""}`}>
        {imageData && (
          <div className="mb-2 rounded-xl overflow-hidden max-w-[250px]">
            <img src={imageData} alt="Uploaded" className="w-full h-auto" />
          </div>
        )}
        {isUser ? (
          <p className="text-[0.925rem] leading-relaxed text-foreground whitespace-pre-wrap">{textContent}</p>
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

  // Auto-open artifact for last message code blocks
  useEffect(() => {
    if (isLast && code && onArtifact) {
      onArtifact(code, lang);
    }
  }, [code, isLast]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-3 rounded-xl overflow-hidden border border-border">
      <div className="flex items-center justify-between px-3 py-2 bg-card text-xs text-muted-foreground">
        <span className="font-mono">{lang}</span>
        <div className="flex gap-1.5">
          {onArtifact && code && (
            <button
              onClick={() => onArtifact(code, lang)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-primary/20 hover:text-primary transition-colors"
            >
              <Eye size={12} />
              View
            </button>
          )}
          <button onClick={handleCopy} className="p-1 rounded-md hover:bg-primary/20 transition-colors">
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          </button>
        </div>
      </div>
      <pre className="!m-0 !rounded-none p-4 overflow-x-auto !bg-[hsl(var(--code-bg))]">
        <code className={`language-${lang} font-mono text-[0.82rem]`}>{code}</code>
      </pre>
    </div>
  );
}
