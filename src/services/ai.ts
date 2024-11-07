// src/services/ai.ts

import { ChatMessage } from '@/types/chat';

export const getDebugResponse = (message: string): ChatMessage => {
  return {
    id: `msg-${Date.now()}-assistant`,
    sender: 'assistant',
    content: `Assistant response to: ${message}`,
  };
};

export const getRealResponse = async (
  message: string
): Promise<ChatMessage> => {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
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
      content: 'Sorry, there was an error generating the response.',
    };
  }
};

export interface AIService {
  getResponse: (message: string) => Promise<ChatMessage>;
}

export class DebugAIService implements AIService {
  async getResponse(message: string): Promise<ChatMessage> {
    return {
      id: `msg-${Date.now()}-assistant`,
      sender: 'assistant',
      content: `Assistant response to: ${message}`,
    };
  }
}

export class RealAIService implements AIService {
  async getResponse(message: string): Promise<ChatMessage> {
    return await getRealResponse(message);
  }
}

export const getAIService = (isDebugMode: boolean): AIService => {
  return isDebugMode ? new DebugAIService() : new RealAIService();
};
