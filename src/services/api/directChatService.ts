// src/services/api/directChatService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Direct doctor-patient chat (audit M1). Not the AI chat (src/services/ai/chatService).
//   GET  /chats                           → my chats, newest message first, with unreadCount
//   POST /chats { user_id }               → open (or reuse) the chat with someone I have a visit with;
//                                           403 with a message when there is no visit
//   GET  /conversations/{id}/messages     → the thread, oldest first; marks the other side's messages read
//   POST /conversations/{id}/messages     → send
// There is no live connection yet, so an open thread polls every few seconds.
// ─────────────────────────────────────────────────────────────────────────────
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from './axiosClient';
import { getAllPages } from './pagination';

export interface ChatPerson {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface DirectChat {
  id: string;
  patient: ChatPerson | null;
  doctor: ChatPerson | null;
  unreadCount: number;
  latestMessage: { body: string; createdAt: string; fromPatient: boolean } | null;
}

export interface ChatMessage {
  id: string;
  body: string;
  fromPatient: boolean;
  createdAt: string;
  readAt: string | null;
}

const toPerson = (u: any): ChatPerson | null =>
  u ? { id: String(u.id), name: u.name ?? '', avatarUrl: u.avatarUrl ?? null } : null;

const toChat = (c: any): DirectChat => ({
  id: String(c.id),
  patient: toPerson(c.patient),
  doctor: toPerson(c.doctor),
  unreadCount: typeof c.unreadCount === 'number' ? c.unreadCount : 0,
  latestMessage: c.latestMessage
    ? {
        body: c.latestMessage.body,
        createdAt: c.latestMessage.createdAt,
        fromPatient: c.latestMessage.fromPatient === true,
      }
    : null,
});

const toMessage = (m: any): ChatMessage => ({
  id: String(m.id),
  body: m.body,
  fromPatient: m.fromPatient === true,
  createdAt: m.createdAt,
  readAt: m.readAt ?? null,
});

/** The other person in a chat, seen from `myUserId`. */
export const chatPartner = (chat: DirectChat, myUserId: string | null): ChatPerson | null =>
  chat.patient?.id === myUserId ? chat.doctor : chat.patient;

/** Whether I am the patient in this chat (decides which messages are mine). */
export const iAmPatient = (chat: DirectChat, myUserId: string | null): boolean =>
  chat.patient?.id === myUserId;

/** Short time for today's messages, otherwise the date. */
export const chatTime = (iso: string): string => {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString()
    ? d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : d.toLocaleDateString([], { day: 'numeric', month: 'short' });
};

export const directChatService = {
  listChats: async (): Promise<DirectChat[]> => (await getAllPages<any>('/chats')).map(toChat),

  openChat: async (userId: string): Promise<DirectChat> => {
    const res: any = await axiosClient.post('/chats', { user_id: Number(userId) });
    return toChat(res.conversation);
  },

  messages: async (chatId: string): Promise<ChatMessage[]> =>
    (await getAllPages<any>(`/conversations/${chatId}/messages`)).map(toMessage),

  send: async (chatId: string, body: string): Promise<ChatMessage> =>
    toMessage(await axiosClient.post(`/conversations/${chatId}/messages`, { body })),
};

const CHATS_KEY = ['direct-chats'];
const THREAD_POLL_MS = 5000;

export const useDirectChats = () =>
  useQuery({ queryKey: CHATS_KEY, queryFn: directChatService.listChats, refetchInterval: 30000 });

export const useChatMessages = (chatId: string | undefined) =>
  useQuery({
    queryKey: ['direct-chat-messages', chatId],
    queryFn: () => directChatService.messages(chatId as string),
    enabled: !!chatId,
    refetchInterval: THREAD_POLL_MS,
  });

export const useOpenChat = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: directChatService.openChat,
    onSuccess: () => qc.invalidateQueries({ queryKey: CHATS_KEY }),
  });
};

export const useSendChatMessage = (chatId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => directChatService.send(chatId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['direct-chat-messages', chatId] });
      qc.invalidateQueries({ queryKey: CHATS_KEY });
    },
  });
};
