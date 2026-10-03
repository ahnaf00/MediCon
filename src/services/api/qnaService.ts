// src/services/api/qnaService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Ask-a-doctor Q&A, backed by conversations:
//   GET    /conversations                          → patient: own questions; doctor: inbox
//   POST   /conversations                          → ask (then POST the first message)
//   PATCH  /conversations/{id}                     → patient edits, only while unanswered
//   DELETE /conversations/{id}                     → patient deletes, only while unanswered
//   GET    /conversations/{id}/messages            → the full thread
//   POST   /conversations/{id}/messages            → reply
//   PATCH  /conversations/{id}/messages/{msgId}    → sender edits their own message
// ─────────────────────────────────────────────────────────────────────────────
import { Question, QuestionAnswer } from '../../types/medical.types';
import { axiosClient } from './axiosClient';

const mapMessageToAnswer = (msg: any): QuestionAnswer => ({
  id: String(msg.id),
  doctorId: String(msg.sender?.id ?? ''),
  doctorName: msg.sender?.name ?? undefined,
  content: msg.body,
  createdAt: msg.createdAt,
});

// Map a Laravel Conversation to the frontend Question. The listing only carries the latest
// message, so `answers` holds at most one reply here; getThread() loads them all.
const mapConversationToQuestion = (conv: any): Question => {
  const latestIsReply = conv.latestMessage && conv.latestMessage.fromPatient === false;
  return {
    id: String(conv.id),
    patientId: conv.patient?.id != null ? String(conv.patient.id) : '',
    patientName: conv.patient?.name ?? null,
    department: conv.department || 'General Medicine',
    symptomId: '', // Symptom ID isn't persisted on backend yet
    content: conv.firstMessage?.body || conv.subject || 'No content',
    isAnonymous: conv.isAnonymous === true,
    createdAt: conv.createdAt,
    answerCount: typeof conv.replyCount === 'number' ? conv.replyCount : latestIsReply ? 1 : 0,
    answers: latestIsReply ? [mapMessageToAnswer(conv.latestMessage)] : [],
  };
};

class QnaService {
  /**
   * Fetch the caller's own questions (the server scopes by the authenticated patient).
   */
  async getPatientQuestions(_patientId: string): Promise<Question[]> {
    const response = await axiosClient.get('/conversations');
    return (response as any).map(mapConversationToQuestion);
  }

  /**
   * Fetch the doctor's inbox. The server scopes it to the doctor's own specialty
   * and ignores `department`.
   */
  async getDoctorInbox(department: string): Promise<Question[]> {
    const response = await axiosClient.get('/conversations', { params: { department } });
    return (response as any).map(mapConversationToQuestion);
  }

  /**
   * Every reply in a question's thread (excluding the patient's own messages), oldest first.
   */
  async getThread(questionId: string): Promise<QuestionAnswer[]> {
    const messages = (await axiosClient.get(`/conversations/${questionId}/messages`)) as any;
    return (Array.isArray(messages) ? messages : [])
      .filter((m: any) => m.fromPatient === false)
      .map(mapMessageToAnswer);
  }

  /**
   * Patient submits a new question.
   */
  async askQuestion(
    _patientId: string,
    department: string,
    content: string,
    isAnonymous?: boolean,
    _symptomId?: string,
  ): Promise<Question> {
    // 1. Create the conversation
    const response = await axiosClient.post('/conversations', {
      subject: content.substring(0, 255), // Use content as subject
      department: department,
      is_anonymous: isAnonymous === true,
    });

    const conversationId = (response as any).conversation.id;

    // 2. Post the first message with the full content
    await axiosClient.post(`/conversations/${conversationId}/messages`, {
      body: content,
    });

    const mapped = mapConversationToQuestion((response as any).conversation);
    mapped.content = content;
    return mapped;
  }

  /**
   * Doctor submits an answer to a question.
   */
  async answerQuestion(
    questionId: string,
    _doctorId: string,
    content: string,
  ): Promise<QuestionAnswer> {
    const message: any = await axiosClient.post(`/conversations/${questionId}/messages`, {
      body: content,
    });
    return mapMessageToAnswer(message);
  }

  /**
   * Doctor edits their own answer in place. The server allows only the message's sender.
   */
  async updateAnswer(
    questionId: string,
    answerId: string,
    _doctorId: string,
    content: string,
  ): Promise<QuestionAnswer> {
    const message: any = await axiosClient.patch(
      `/conversations/${questionId}/messages/${answerId}`,
      { body: content },
    );
    return mapMessageToAnswer(message);
  }

  /**
   * Patient deletes their own question. The server refuses (403) once anyone has replied.
   */
  async deleteQuestion(questionId: string, _userId?: string): Promise<void> {
    await axiosClient.delete(`/conversations/${questionId}`);
  }

  /**
   * Patient edits their own question. The server refuses (403) once anyone has replied.
   */
  async updateQuestion(
    questionId: string,
    _patientId: string,
    content: string,
    department: string,
    isAnonymous?: boolean,
    _symptomId?: string,
  ): Promise<Question> {
    const response = await axiosClient.patch(`/conversations/${questionId}`, {
      body: content,
      department,
      is_anonymous: isAnonymous === true,
    });
    return mapConversationToQuestion((response as any).conversation);
  }
}

export const qnaService = new QnaService();
