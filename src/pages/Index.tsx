import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Square } from "lucide-react";
import { MODELS, Model, streamChat, generateTitle, ChatMessage } from "@/lib/openrouter";
import { useChatStore } from "@/hooks/useChatStore";
import Sidebar from "@/components/chat/Sidebar";
import ModelSelector from "@/components/chat/ModelSelector";
import MessageBubble from "@/components/chat/MessageBubble";
import ArtifactPanel from "@/components/chat/ArtifactPanel";
import logo from "@/assets/logo.png";

export default function Index() {
  const store = useChatStore();
  const [model, setModel] = useState<Model>(MODELS[0]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [artifact, setArtifact] = useState<{ code: string; language: string } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [store.activeChat?.messages]);

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

    // Auto-title on first message
    if (chat.messages.length === 0) {
      generateTitle(text, model).then((title) => {
        store.updateTitle(chatId!, title);
      });
    }

    const controller = new AbortController();
    abortRef.current = controller;

    let assistantContent = "";
    const messagesWithAssistant = [...newMessages, { role: "assistant" as const, content: "" }];
    store.updateMessages(chatId, messagesWithAssistant);

    try {
      await streamChat({
        messages: newMessages,
        model,
        signal: controller.signal,
        onDelta: (delta) => {
          assistantContent += delta;
          const updated = [...newMessages, { role: "assistant" as const, content: assistantContent }];
          store.updateMessages(chatId!, updated);
        },
        onDone: () => {},
      });
    } catch (err: any) {
      if (err.name !== "AbortError") {
        assistantContent += "\n\n*Error: " + err.message + "*";
        store.updateMessages(chatId, [...newMessages, { role: "assistant" as const, content: assistantContent }]);
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [input, isStreaming, model, store]);

  const handleStop = () => {
    abortRef.current?.abort();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const messages = store.activeChat?.messages || [];

  return (
    <div className="flex h-screen bg-chat overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        chats={store.chats}
        activeChatId={store.activeChatId}
        onSelectChat={store.setActiveChatId}
        onNewChat={() => store.createChat(model.id)}
        onDeleteChat={store.deleteChat}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-sidebar-border bg-chat">
          <ModelSelector selected={model} onSelect={setModel} />
          <span className="text-xs text-muted-foreground">
            {store.activeChat?.title || "Bhosdu Cord"}
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 opacity-60">
              <img src={logo} alt="Bhosdu Cord" width={64} height={64} className="opacity-40" />
              <p className="text-muted-foreground text-lg font-medium">Start a conversation</p>
              <p className="text-muted-foreground text-sm">Choose a model and type your message</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">
              {messages.map((msg, i) => (
                <MessageBubble
                  key={i}
                  message={msg}
                  onArtifact={(code, lang) => setArtifact({ code, language: lang })}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="px-4 py-3 border-t border-sidebar-border bg-chat">
          <div className="max-w-3xl mx-auto flex items-end gap-2">
            <div className="flex-1 bg-chat-input rounded-xl border border-sidebar-border focus-within:border-primary/50 transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Bhosdu Cord..."
                rows={1}
                className="w-full bg-transparent px-4 py-3 text-chat-foreground text-sm resize-none outline-none placeholder:text-muted-foreground max-h-40"
                style={{ minHeight: "44px" }}
              />
            </div>
            {isStreaming ? (
              <button
                onClick={handleStop}
                className="p-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
              >
                <Square size={18} />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="p-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              >
                <Send size={18} />
              </button>
            )}
          </div>
        </div>
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
