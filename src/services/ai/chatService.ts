class ChatService {
  /**
   * Mocks an AI streaming response.
   * Yields text chunks to simulate a real token-by-token stream.
   * Grounded in a mock transcript for the given consultationId.
   */
  async *streamResponse(consultationId: string, query: string): AsyncGenerator<string> {
    const lowerQuery = query.toLowerCase();

    // Fulfill Tier 3 DoD for offline message testing
    if (lowerQuery.includes('offline test')) {
      throw new Error('NETWORK_ERROR');
    }

    // Mock transcript knowledge base per consultationId
    const mockTranscripts: Record<string, string> = {
      'cons-1':
        'During consultation cons-1, Dr. Sarah Khan diagnosed you with acute pharyngitis (sore throat). She prescribed Azithromycin 500mg for 3 days and advised warm salt water gargles.',
      'cons-2':
        'During consultation cons-2, Dr. Ahmed Rahman noted your blood pressure was slightly elevated. He recommended a low-sodium diet and daily 30-minute walks, and scheduled a follow-up in one month.',
    };

    const transcriptContext =
      mockTranscripts[consultationId] ||
      'You recently had a consultation regarding some mild symptoms. Your doctor prescribed a short course of medication and advised rest and plenty of fluids.';

    const fullResponse = `Based on your consultation records:\n\n${transcriptContext}\n\nTo answer your question directly: The doctor specifically noted that you should complete the full course of your prescribed medication even if you start feeling better. If you experience any severe side effects like a rash, dizziness, or shortness of breath, you should stop the medication and visit the emergency room immediately.\n\nIs there anything specific from the prescription or the doctor's advice you'd like me to clarify further?`;

    const chunks = fullResponse.split(' ');

    // Initial artificial delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    for (let i = 0; i < chunks.length; i++) {
      // Simulate network latency per chunk
      await new Promise((resolve) => setTimeout(resolve, 50));
      yield chunks[i] + (i < chunks.length - 1 ? ' ' : '');
    }
  }
}

export const chatService = new ChatService();
