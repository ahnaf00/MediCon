import { Question, QuestionAnswer } from '../../types/medical.types';
import { axiosClient } from './axiosClient';

// Helper function to map Laravel Conversation/Message to frontend Question/QuestionAnswer
const mapConversationToQuestion = (conv: any): Question => {
  return {
    id: String(conv.id),
    patientId: String(conv.patient?.id || ''),
    department: conv.department || 'General Medicine',
    symptomId: '', // Symptom ID isn't persisted on backend yet
    content: conv.firstMessage?.body || conv.subject || 'No content',
    isAnonymous: false,
    createdAt: conv.createdAt,
    answers: conv.latestMessage && conv.latestMessage.sender?.id !== conv.patient?.id 
      ? [{
          id: String(conv.latestMessage.id),
          doctorId: String(conv.latestMessage.sender?.id || ''),
          content: conv.latestMessage.body,
          createdAt: conv.latestMessage.createdAt,
        }]
      : [],
  };
};

class QnaService {
  /**
   * Fetch questions authored by a specific patient.
   */
  async getPatientQuestions(patientId: string): Promise<Question[]> {
    const response = await axiosClient.get('/conversations');
    return (response as any).map(mapConversationToQuestion);
  }

  /**
   * Fetch questions routed to a specific department for the doctor inbox.
   */
  async getDoctorInbox(department: string): Promise<Question[]> {
    const response = await axiosClient.get('/conversations', { params: { department } });
    return (response as any).map(mapConversationToQuestion);
  }

  /**
   * Patient submits a new question.
   */
  async askQuestion(
    patientId: string,
    department: string,
    content: string,
    isAnonymous?: boolean,
    symptomId?: string,
  ): Promise<Question> {
    // 1. Create the conversation
    const response = await axiosClient.post('/conversations', {
      subject: content.substring(0, 255), // Use content as subject
      department: department,
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
    doctorId: string,
    content: string,
  ): Promise<QuestionAnswer> {
    const message: any = await axiosClient.post(`/conversations/${questionId}/messages`, {
      body: content,
    });
    
    return {
      id: String(message.id),
      doctorId: String(message.sender?.id || ''),
      content: message.body,
      createdAt: message.createdAt,
    };
  }

  /**
   * Doctor updates their own answer.
   */
  async updateAnswer(
    questionId: string,
    answerId: string,
    doctorId: string,
    content: string,
  ): Promise<QuestionAnswer> {
    // The backend doesn't support updating messages yet, so we fallback to answering again
    // or just return the edited data locally if not supported.
    // For now we will create a new message since editing isn't in ConversationController.
    return this.answerQuestion(questionId, doctorId, content);
  }

  /**
   * Delete a question.
   */
  async deleteQuestion(questionId: string, userId?: string): Promise<void> {
    // Backend doesn't have a DELETE conversation route yet.
    // We would add it or just ignore for now.
    return Promise.resolve();
  }

  /**
   * Patient updates their own question.
   */
  async updateQuestion(
    questionId: string,
    patientId: string,
    content: string,
    department: string,
    isAnonymous?: boolean,
    symptomId?: string,
  ): Promise<Question> {
    // The backend doesn't support updating conversations yet.
    // We would need to implement it, or just ignore.
    return mapConversationToQuestion({ id: questionId, department, subject: content, createdAt: new Date().toISOString() });
  }
}

export const qnaService = new QnaService();
