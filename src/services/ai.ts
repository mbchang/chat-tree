import { ChatMessage } from '@/types/chat';

export const getDebugResponse = (message: string): ChatMessage => {
  return {
    id: `msg-${Date.now()}-assistant`,
    sender: 'assistant',
    content: `Assistant response to: ${message}`,
  };
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

export const getAIService = (): AIService => {
  return new DebugAIService();
};
