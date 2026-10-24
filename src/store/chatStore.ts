import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai' | 'system';
  timestamp: string; // ISO string
}

interface ChatState {
  conversations: Record<string, ChatMessage[]>;
  addMessage: (consultationId: string, text: string, sender: 'user' | 'ai' | 'system') => string;
  updateMessage: (consultationId: string, messageId: string, text: string) => void;
  removeMessage: (consultationId: string, messageId: string) => void;
  clearHistory: (consultationId: string) => void;
}

// Memory only: the server owns chat history and the screens reload it, so
// nothing about a health conversation is written to the phone.
export const useChatStore = create<ChatState>()((set) => ({
  conversations: {},
  addMessage: (consultationId, text, sender) => {
    const id = Math.random().toString(36).substring(7) + Date.now();
    const newMessage: ChatMessage = {
      id,
      text,
      sender,
      timestamp: new Date().toISOString(),
    };
    set((state) => {
      const currentConvo = state.conversations[consultationId] || [];
      return {
        conversations: {
          ...state.conversations,
          [consultationId]: [...currentConvo, newMessage],
        },
      };
    });
    return id;
  },
  updateMessage: (consultationId, messageId, text) => {
    set((state) => {
      const currentConvo = state.conversations[consultationId] || [];
      return {
        conversations: {
          ...state.conversations,
          [consultationId]: currentConvo.map((msg) =>
            msg.id === messageId ? { ...msg, text } : msg,
          ),
        },
      };
    });
  },
  removeMessage: (consultationId, messageId) => {
    set((state) => ({
      conversations: {
        ...state.conversations,
        [consultationId]: (state.conversations[consultationId] || []).filter(
          (msg) => msg.id !== messageId,
        ),
      },
    }));
  },
  clearHistory: (consultationId) => {
    set((state) => {
      const nextConvos = { ...state.conversations };
      delete nextConvos[consultationId];
      return { conversations: nextConvos };
    });
  },
}));
