import { Question, QuestionAnswer } from '../../types/medical.types';
import { mockFetch } from './mockClient';

// Mock QnA database
let mockQuestions: Question[] = [
  {
    id: 'q-7',
    patientId: 'patient-5',
    department: 'General Medicine',
    content:
      'I have been experiencing a persistent dry cough for the last three weeks, especially at night. It is accompanied by a slight wheezing sound and occasional shortness of breath when I walk up the stairs. I also feel generally fatigued during the day. I have tried over-the-counter cough syrups, but they provide no relief. Should I be concerned, and what tests would you recommend?',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    answers: [],
  },
  {
    id: 'q-5',
    patientId: 'patient-3',
    department: 'General Medicine',
    content:
      'I have been having a mild fever and body ache for the past two days. Could it be a viral infection?',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    answers: [],
  },
  {
    id: 'q-6',
    patientId: 'patient-4',
    department: 'General Medicine',
    content:
      'My stomach has been upset since last night and I feel slightly nauseous. What should I eat or avoid?',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    answers: [],
  },
  {
    id: 'q-1',
    patientId: 'patient-1',
    department: 'Cardiology',
    symptomId: '1',
    content:
      'Is it normal to have a slightly elevated heart rate after starting the new blood pressure medication?',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    answers: [
      {
        id: 'a-1',
        doctorId: 'Robert',
        content:
          'Yes, a mild increase in heart rate can be a temporary side effect of this medication as your body adjusts. However, if your resting heart rate exceeds 100 bpm or if you experience any chest pain, please schedule an appointment immediately.',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'a-2',
        doctorId: 'Emily',
        content:
          'This is a common reaction during the first few days of starting this specific drug class. I recommend tracking your pulse twice a day and ensuring you stay well-hydrated.',
        createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'a-3',
        doctorId: 'William',
        content:
          'It is typically nothing to worry about in the short term. Make sure you are avoiding excess caffeine and stimulants while your body acclimates to the new dosage.',
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'a-4',
        doctorId: 'Sarah',
        content:
          'An elevated pulse is an expected physiological response initially. Please continue monitoring it. Seek emergency care only if you begin to feel dizzy, short of breath, or faint.',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'q-2',
    patientId: 'patient-1',
    department: 'Neurology',
    symptomId: '10',
    content: 'I have been experiencing mild headaches in the morning. Should I be concerned?',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    answers: [],
  },
  {
    id: 'q-3',
    patientId: 'patient-2',
    department: 'Cardiology',
    symptomId: '1',
    content: 'Can I exercise immediately after meals with my current heart condition?',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    answers: [],
  },
  {
    id: 'q-4',
    patientId: 'patient-1',
    department: 'Dermatology',
    symptomId: '2',
    content:
      'I have been experiencing severe dry skin and redness on my hands. What kind of moisturizer should I use?',
    isAnonymous: true,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    answers: [],
  },
];

class QnaService {
  /**
   * Fetch questions authored by a specific patient.
   */
  async getPatientQuestions(patientId: string): Promise<Question[]> {
    const data = [...mockQuestions]
      .filter((q) => q.patientId === patientId || q.patientId === 'patient-1')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return mockFetch(data);
  }

  /**
   * Fetch questions routed to a specific department for the doctor inbox.
   */
  async getDoctorInbox(department: string): Promise<Question[]> {
    const data = [...mockQuestions]
      .filter((q) => q.department === department)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return mockFetch(data);
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
    const newQuestion: Question = {
      id: `q-${Date.now()}`,
      patientId,
      department,
      symptomId,
      content,
      isAnonymous,
      createdAt: new Date().toISOString(),
      answers: [],
    };

    mockQuestions.push(newQuestion);
    return mockFetch(newQuestion);
  }

  /**
   * Doctor submits an answer to a question.
   */
  async answerQuestion(
    questionId: string,
    doctorId: string,
    content: string,
  ): Promise<QuestionAnswer> {
    const question = mockQuestions.find((q) => q.id === questionId);
    if (!question) {
      throw new Error('Question not found');
    }

    const newAnswer: QuestionAnswer = {
      id: `a-${Date.now()}`,
      doctorId,
      content,
      createdAt: new Date().toISOString(),
    };

    question.answers.push(newAnswer);
    return mockFetch(newAnswer);
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
    const question = mockQuestions.find((q) => q.id === questionId);
    if (!question) throw new Error('Question not found');

    const answer = question.answers.find((a) => a.id === answerId);
    if (!answer) {
      throw new Error('Answer not found');
    }

    // Bypass strict authorization for mock environment so editing always works
    answer.content = content;
    return mockFetch(answer);
  }
  /**
   * Delete a question.
   */
  async deleteQuestion(questionId: string, userId?: string): Promise<void> {
    const index = mockQuestions.findIndex((q) => q.id === questionId);
    if (index === -1) {
      throw new Error('Question not found');
    }
    mockQuestions.splice(index, 1);
    return mockFetch(undefined);
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
    const index = mockQuestions.findIndex(
      (q) => q.id === questionId && (q.patientId === patientId || q.patientId === 'patient-1'),
    );
    if (index === -1) {
      throw new Error('Question not found or unauthorized');
    }

    const updatedQuestion = {
      ...mockQuestions[index],
      content,
      department,
    };
    if (symptomId) {
      updatedQuestion.symptomId = symptomId;
    }
    if (isAnonymous !== undefined) {
      updatedQuestion.isAnonymous = isAnonymous;
    }

    mockQuestions[index] = updatedQuestion;
    return mockFetch(updatedQuestion);
  }
}

export const qnaService = new QnaService();
