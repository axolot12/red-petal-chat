import { useState, useCallback, useEffect } from "react";
import { ChatMessage } from "@/lib/openrouter";

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  modelId: string;
}

const STORAGE_KEY = "bhosdu-cord-chats";

function loadChats(): Chat[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveChats(chats: Chat[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
}

export function useChatStore() {
  const [chats, setChats] = useState<Chat[]>(loadChats);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  useEffect(() => {
    saveChats(chats);
  }, [chats]);

  const activeChat = chats.find((c) => c.id === activeChatId) || null;

  const createChat = useCallback((modelId: string) => {
    const id = crypto.randomUUID();
    const chat: Chat = {
      id,
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
      modelId,
    };
    setChats((prev) => [chat, ...prev]);
    setActiveChatId(id);
    return id;
  }, []);

  const updateMessages = useCallback((chatId: string, messages: ChatMessage[]) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, messages } : c))
    );
  }, []);

  const updateTitle = useCallback((chatId: string, title: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, title } : c))
    );
  }, []);

  const deleteChat = useCallback((chatId: string) => {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    if (activeChatId === chatId) setActiveChatId(null);
  }, [activeChatId]);

  return {
    chats,
    activeChat,
    activeChatId,
    setActiveChatId,
    createChat,
    updateMessages,
    updateTitle,
    deleteChat,
  };
}
