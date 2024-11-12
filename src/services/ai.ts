import { ChatMessage } from '@/types/chat';

export interface AIServiceInterface {
  getResponse: (chatHistory: ChatMessage[]) => Promise<ChatMessage>;
}

class RealAIService implements AIServiceInterface {
  async getResponse(
    chatHistory: ChatMessage[]
  ): Promise<ChatMessage> {
    return await fetchRealResponse(chatHistory);
  }
}

class DebugAIService implements AIServiceInterface {
  async getResponse(
    chatHistory: ChatMessage[]
  ): Promise<ChatMessage> {
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
      content:
        'There was an error processing your request, likely a timeout.',
    };
  }
};

export const getAIService = (
  isDebugMode: boolean
): AIServiceInterface => {
  return isDebugMode ? new DebugAIService() : new RealAIService();
};
