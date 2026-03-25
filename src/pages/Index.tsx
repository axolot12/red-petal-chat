import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Square, Plus, MessageSquare, ImagePlus } from "lucide-react";
import { MODELS, Model, streamChat, generateTitle, ChatMessage } from "@/lib/openrouter";
import { useChatStore } from "@/hooks/useChatStore";
import ModelSelector from "@/components/chat/ModelSelector";
import MessageBubble from "@/components/chat/MessageBubble";
import ArtifactPanel from "@/components/chat/ArtifactPanel";
import ChatsDrawer from "@/components/chat/ChatsDrawer";
import logo from "@/assets/logo.png";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Index() {
  const store = useChatStore();
  const [model, setModel] = useState<Model>(MODELS[0]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [artifact, setArtifact] = useState<{ code: string; language: string } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(scrollToBottom, [store.activeChat?.messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [input]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setInput((prev) => prev + `[IMAGE:${base64}]`);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    let chatId = store.activeChatId;
    if (!chatId) {
      chatId = store.createChat(model.id);
    }

    const chat = store.chats.find((c) => c.id === chatId) || { messages: [] };
    const userMsg: ChatMessage = { role: "user", content: text };
    const newMessages = [...chat.messages, userMsg];
    store.updateMessages(chatId, newMessages);
    setInput("");
    setIsStreaming(true);

    // For API, strip image data from content (send text only to LLM)
    const apiMessages = newMessages.map((m) => ({
      ...m,
      content: m.content.replace(/\[IMAGE:.*?\]/g, "").trim() || m.content,
    }));

    if (chat.messages.length === 0) {
      const titleText = text.replace(/\[IMAGE:.*?\]/g, "").trim();
      if (titleText) {
        generateTitle(titleText, model).then((title) => store.updateTitle(chatId!, title));
      } else {
        store.updateTitle(chatId!, "Image Chat");
      }
    }

    const controller = new AbortController();
    abortRef.current = controller;

    let assistantContent = "";
    store.updateMessages(chatId, [...newMessages, { role: "assistant", content: "" }]);

    try {
      await streamChat({
        messages: apiMessages,
        model,
        signal: controller.signal,
        onDelta: (delta) => {
          assistantContent += delta;
          store.updateMessages(chatId!, [...newMessages, { role: "assistant", content: assistantContent }]);
        },
        onDone: () => {},
      });
    } catch (err: any) {
      if (err.name !== "AbortError") {
        assistantContent += "\n\n*Error: " + err.message + "*";
        store.updateMessages(chatId!, [...newMessages, { role: "assistant", content: assistantContent }]);
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [input, isStreaming, model, store]);

  const handleStop = () => abortRef.current?.abort();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const messages = store.activeChat?.messages || [];
  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "hsl(var(--chat-bg))" }}>
      {/* Chats Drawer */}
      <ChatsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        chats={store.chats}
        activeChatId={store.activeChatId}
        onSelectChat={store.setActiveChatId}
        onDeleteChat={store.deleteChat}
      />

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Top bar - minimal */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => store.createChat(model.id)}
              className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
              title="New Chat"
            >
              <Plus size={18} />
            </button>
            <button
              onClick={() => setDrawerOpen(true)}
              className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Your Chats"
            >
              <MessageSquare size={17} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <img src={logo} alt="BhosduAi" width={24} height={24} className="opacity-70" />
            <span className="text-sm font-semibold text-foreground tracking-tight">BhosduAi</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {!hasMessages ? (
            /* Empty state - Claude-like centered greeting */
            <div className="flex flex-col items-center justify-center h-full px-4">
              <div className="flex items-center gap-3 mb-8">
                <img src={logo} alt="BhosduAi" width={40} height={40} />
                <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "hsl(var(--greeting))" }}>
                  {getGreeting()}
                </h1>
              </div>

              {/* Input box - Claude style centered */}
              <div className="w-full max-w-2xl">
                <div className="bg-card rounded-2xl border border-border shadow-xl overflow-hidden">
                  <textarea
                    ref={textareaRef}
                    value={input.replace(/\[IMAGE:.*?\]/g, "📷 ")}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="How can I help you today?"
                    rows={1}
                    className="w-full bg-transparent px-5 pt-4 pb-2 text-foreground text-sm resize-none outline-none placeholder:text-muted-foreground"
                    style={{ minHeight: "44px", maxHeight: "160px" }}
                  />
                  <div className="flex items-center justify-between px-3 pb-3">
                    <div className="flex items-center gap-1">
                      <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageUpload} className="hidden" />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Upload image"
                      >
                        <ImagePlus size={18} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <ModelSelector selected={model} onSelect={setModel} />
                      <button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Chat messages */
            <div className="max-w-3xl mx-auto px-4 py-6">
              {messages.map((msg, i) => (
                <MessageBubble
                  key={i}
                  message={msg}
                  isLast={i === messages.length - 1 && msg.role === "assistant"}
                  onArtifact={(code, lang) => setArtifact({ code, language: lang })}
                />
              ))}
              {isStreaming && messages[messages.length - 1]?.content === "" && (
                <div className="flex gap-1.5 px-2 py-4">
                  <div className="typing-dot w-2 h-2 rounded-full bg-primary" />
                  <div className="typing-dot w-2 h-2 rounded-full bg-primary" />
                  <div className="typing-dot w-2 h-2 rounded-full bg-primary" />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Bottom input - only when in a chat */}
        {hasMessages && (
          <div className="px-4 py-3" style={{ backgroundColor: "hsl(var(--chat-bg))" }}>
            <div className="max-w-3xl mx-auto">
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <textarea
                  ref={textareaRef}
                  value={input.replace(/\[IMAGE:.*?\]/g, "📷 ")}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Reply to BhosduAi..."
                  rows={1}
                  className="w-full bg-transparent px-5 pt-4 pb-2 text-foreground text-sm resize-none outline-none placeholder:text-muted-foreground"
                  style={{ minHeight: "44px", maxHeight: "160px" }}
                />
                <div className="flex items-center justify-between px-3 pb-3">
                  <div className="flex items-center gap-1">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="file-input-bottom" />
                    <button
                      onClick={() => document.getElementById("file-input-bottom")?.click()}
                      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <ImagePlus size={18} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <ModelSelector selected={model} onSelect={setModel} />
                    {isStreaming ? (
                      <button
                        onClick={handleStop}
                        className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        <Square size={16} />
                      </button>
                    ) : (
                      <button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Send size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Artifact Panel */}
      {artifact && (
        <ArtifactPanel
          code={artifact.code}
          language={artifact.language}
          onClose={() => setArtifact(null)}
        />
      )}
    </div>
  );
}
