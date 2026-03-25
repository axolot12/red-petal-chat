import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChatMessage } from "@/lib/openrouter";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface MessageBubbleProps {
  message: ChatMessage;
  onArtifact?: (code: string, lang: string) => void;
}

export default function MessageBubble({ message, onArtifact }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-chat-user text-chat-foreground"
            : "bg-transparent text-chat-foreground"
        }`}
      >
        {isUser ? (
          <p className="text-[0.938rem] leading-relaxed whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="chat-prose">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                pre({ children, ...props }) {
                  return <PreBlock onArtifact={onArtifact}>{children}</PreBlock>;
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

function PreBlock({ children, onArtifact }: { children: React.ReactNode; onArtifact?: (code: string, lang: string) => void }) {
  const [copied, setCopied] = useState(false);

  // Extract text and language from children
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

  return (
    <div className="relative group my-3 rounded-lg overflow-hidden bg-code">
      <div className="flex items-center justify-between px-3 py-1.5 bg-artifact-header text-xs text-muted-foreground">
        <span className="font-mono">{lang}</span>
        <div className="flex gap-1">
          {onArtifact && code && (
            <button
              onClick={() => onArtifact(code, lang)}
              className="px-2 py-0.5 rounded hover:bg-primary/20 hover:text-primary transition-colors"
            >
              Open Artifact
            </button>
          )}
          <button onClick={handleCopy} className="p-1 rounded hover:bg-primary/20 transition-colors">
            {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
          </button>
        </div>
      </div>
      <pre className="!m-0 !rounded-none p-4 overflow-x-auto">
        <code className={`language-${lang} font-mono text-[0.82rem]`}>{code}</code>
      </pre>
    </div>
  );
}
