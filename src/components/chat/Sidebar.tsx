import { Plus, Trash2, MessageSquare } from "lucide-react";
import { Chat } from "@/hooks/useChatStore";
import logo from "@/assets/logo.png";

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
}

export default function Sidebar({ chats, activeChatId, onSelectChat, onNewChat, onDeleteChat }: SidebarProps) {
  return (
    <div className="w-64 h-screen flex flex-col bg-sidebar border-r border-sidebar-border shrink-0">
      {/* Header */}
      <div className="p-4 flex items-center gap-2.5">
        <img src={logo} alt="Bhosdu Cord" width={32} height={32} className="rounded-lg" />
        <span className="font-semibold text-sidebar-foreground text-base tracking-tight">Bhosdu Cord</span>
      </div>

      {/* New Chat */}
      <div className="px-3 mb-2">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-sidebar-accent text-sidebar-accent-foreground hover:bg-primary/20 hover:text-primary transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          New Chat
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${
              chat.id === activeChatId
                ? "bg-sidebar-accent text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            }`}
          >
            <MessageSquare size={14} className="shrink-0 opacity-50" />
            <span className="truncate flex-1">{chat.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteChat(chat.id);
              }}
              className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity p-0.5"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
