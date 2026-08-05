import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from './storage';

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
  clearHistory: (consultationId: string) => void;
  seedLongConversation: (consultationId: string) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
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
      clearHistory: (consultationId) => {
        set((state) => {
          const nextConvos = { ...state.conversations };
          delete nextConvos[consultationId];
          return { conversations: nextConvos };
        });
      },
      seedLongConversation: (consultationId) => {
        if (!__DEV__) return;
        const mockMessages: ChatMessage[] = [];
        for (let i = 0; i < 50; i++) {
          mockMessages.push({
            id: `seed-user-${i}`,
            text: `Mock question number ${i + 1}?`,
            sender: 'user',
            timestamp: new Date(Date.now() - 1000000 + i * 10000).toISOString(),
          });
          mockMessages.push({
            id: `seed-ai-${i}`,
            text: `Here is the mock response to your question number ${i + 1}. Please remember to consult a real doctor if symptoms persist.`,
            sender: 'ai',
            timestamp: new Date(Date.now() - 995000 + i * 10000).toISOString(),
          });
        }
        set((state) => ({
          conversations: {
            ...state.conversations,
            [consultationId]: mockMessages,
          },
        }));
      },
    }),
    {
      name: 'medicon-chat-storage',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
