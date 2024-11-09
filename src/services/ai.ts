import { ChatMessage } from '@/types/chat';

export const getDebugResponse = (message: string): ChatMessage => {
  return {
    id: `msg-${Date.now()}-assistant`,
    sender: 'assistant',
    content: `Assistant response to: ${message}`,
  };
};

export const getRealResponse = async (
  chatHistory: ChatMessage[]
): Promise<ChatMessage> => {
  console.log(
    'AI Service - Sending chat history to API:',
    chatHistory
  ); // Logging
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chatHistory }), // Send chat history
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const data = await response.json();

    console.log('AI Service - Received response from API:', data); // Logging

    return {
      id: `msg-${Date.now()}-assistant`,
      sender: 'assistant',
      content: data.content,
    };
  } catch (error) {
    console.error('Chat API error:', error); // Logging
    return {
      id: `msg-${Date.now()}-assistant`,
      sender: 'assistant',
      content: 'Sorry, there was an error generating the response.',
    };
  }
};

export interface AIService {
  getResponse: (chatHistory: ChatMessage[]) => Promise<ChatMessage>;
}

class RealAIService implements AIService {
  async getResponse(
    chatHistory: ChatMessage[]
  ): Promise<ChatMessage> {
    return await getRealResponse(chatHistory);
  }
}

class DebugAIService implements AIService {
  async getResponse(
    chatHistory: ChatMessage[]
  ): Promise<ChatMessage> {
    // Optional: Use chatHistory for more sophisticated debug responses
    console.log('Debug Mode - Chat History:', chatHistory);

    const lastUserMessage = chatHistory
      .slice()
      .reverse()
      .find((msg) => msg.sender === 'user');

    const responseContent = lastUserMessage
      ? `Debug response to: ${lastUserMessage.content}`
      : 'Debug response.';

    return {
      id: `msg-${Date.now()}-assistant`,
      sender: 'assistant',
      content: responseContent,
    };
  }
}

export const getAIService = (isDebugMode: boolean): AIService => {
  return isDebugMode ? new DebugAIService() : new RealAIService();
};
