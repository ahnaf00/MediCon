// src/services/ai/chatService.ts
// ─────────────────────────────────────────────────────────────────────────────
// AI Chat Service — connected to POST /api/v1/ai/chat (single JSON response,
// NOT SSE streaming). The backend AiChatController returns a plain 201 JSON.
// ─────────────────────────────────────────────────────────────────────────────
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from '../api/axiosClient';

// ─── Types (matching AiChatController response shapes exactly) ───────────────

export interface AiChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface AiChatSession {
  id: number;
  title: string;
  latestMessage: AiChatMessage | null;
  createdAt: string;
}

export interface SendMessageResponse {
  sessionId: number;
  message: AiChatMessage;
}

// ─── Service ──────────────────────────────────────────────────────────────────

class ChatService {
  /**
   * Goal: Send a user message to the AI and receive a single full response.
   * How: POST /api/v1/ai/chat with { message, session_id? }.
   * To continue an existing session pass sessionId; omit to start a new one.
   * The backend returns { sessionId, message: { id, role, content, createdAt } }.
   */
  async sendMessage(message: string, sessionId?: number): Promise<SendMessageResponse> {
    const res = (await axiosClient.post('/ai/chat', {
      message,
      session_id: sessionId ?? null,
    })) as any;
    return res;
  }

  /**
   * Goal: List all AI chat sessions for the authenticated user.
   * How: GET /api/v1/ai/sessions — returns paginated results; we extract the array.
   */
  async getSessions(): Promise<AiChatSession[]> {
    const res = (await axiosClient.get('/ai/sessions')) as any;
    // axiosClient unwraps Laravel's top-level .data; Laravel pagination wraps items
    // in a second .data. Handle both shapes gracefully.
    return Array.isArray(res) ? res : (res?.data ?? []);
  }

  /**
   * Goal: Fetch all messages in a specific AI chat session.
   * How: GET /api/v1/ai/sessions/{id}/messages — oldest-first, page 1 = 50 results.
   */
  async getMessages(sessionId: number): Promise<AiChatMessage[]> {
    const res = (await axiosClient.get(`/ai/sessions/${sessionId}/messages`)) as any;
    return Array.isArray(res) ? res : (res?.data ?? []);
  }
}

export const chatService = new ChatService();

// ─── TanStack Query v5 Hooks ──────────────────────────────────────────────────

/** Fetch and cache the list of AI chat sessions for the current user. */
export const useAiSessions = () =>
  useQuery({
    queryKey: ['ai-sessions'],
    queryFn: () => chatService.getSessions(),
  });

/** Fetch and cache all messages for a specific AI chat session. */
export const useAiMessages = (sessionId: number) =>
  useQuery({
    queryKey: ['ai-messages', sessionId],
    queryFn: () => chatService.getMessages(sessionId),
    enabled: !!sessionId,
  });

/**
 * Send a message to the AI.
 * On success, invalidates both the sessions list and the specific session's messages
 * so both the history screen and the active chat screen refresh automatically.
 */
export const useSendAiMessage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ message, sessionId }: { message: string; sessionId?: number }) =>
      chatService.sendMessage(message, sessionId),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['ai-sessions'] });
      qc.invalidateQueries({ queryKey: ['ai-messages', data.sessionId] });
    },
  });
};
