import { ChatMessage } from '@/types/chat';

export interface AIService {
  getResponse: (chatHistory: ChatMessage[]) => Promise<ChatMessage>;
}

class RealAIService implements AIService {
  async getResponse(
    chatHistory: ChatMessage[]
  ): Promise<ChatMessage> {
    return await fetchRealResponse(chatHistory);
  }
}

class DebugAIService implements AIService {
  async getResponse(
    chatHistory: ChatMessage[]
  ): Promise<ChatMessage> {
    console.log('Debug Mode - Chat History:', chatHistory);
    const lastUserMessage = [...chatHistory]
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

const fetchRealResponse = async (
  chatHistory: ChatMessage[]
): Promise<ChatMessage> => {
  console.log(
    'AI Service - Sending chat history to API:',
    chatHistory
  );
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chatHistory }),
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const data = await response.json();
    console.log('AI Service - Received response from API:', data);

    return {
      id: `msg-${Date.now()}-assistant`,
      sender: 'assistant',
      content: data.content,
    };
  } catch (error) {
    console.error('Chat API error:', error);
    return {
      id: `msg-${Date.now()}-assistant`,
      sender: 'assistant',
      content: 'Sorry, there was an error generating the response.',
    };
  }
};

export const getAIService = (isDebugMode: boolean): AIService => {
  return isDebugMode ? new DebugAIService() : new RealAIService();
};
