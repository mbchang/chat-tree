import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define the shape of the incoming request body
interface ChatRequestBody {
  chatHistory: {
    sender: 'user' | 'assistant';
    content: string;
  }[];
}

// Define the shape of the response
interface ChatResponse {
  content: string;
}

class InvalidChatHistoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidChatHistoryError';
  }
}

class OpenAIAPIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpenAIAPIError';
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequestBody = await request.json();

    console.log('API Received chat history:', body.chatHistory);

    const { chatHistory } = body;

    if (
      !chatHistory ||
      !Array.isArray(chatHistory) ||
      !chatHistory.every(
        (msg) =>
          (msg.sender === 'user' || msg.sender === 'assistant') &&
          typeof msg.content === 'string'
      )
    ) {
      throw new InvalidChatHistoryError(
        'Invalid chat history format.'
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set.');
    }

    // Construct messages array for OpenAI API, including chat history
    const messages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      ...chatHistory.map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })),
    ];

    console.log('Messages sent to OpenAI:', messages);

    // Call OpenAI API
    const openAIResponse = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Update model as needed
          messages,
        }),
      }
    );

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      console.error('OpenAI API error:', errorData);
      throw new OpenAIAPIError(
        'Failed to fetch response from AI service.'
      );
    }

    const data = await openAIResponse.json();

    const aiMessage = data.choices?.[0]?.message?.content?.trim();

    console.log('AI response:', aiMessage);

    if (!aiMessage) {
      throw new OpenAIAPIError('No response from AI service.');
    }

    const response: ChatResponse = {
      content: aiMessage,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof InvalidChatHistoryError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    } else if (error instanceof OpenAIAPIError) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    } else {
      console.error('API Route Error:', error);
      return NextResponse.json(
        { error: 'Internal Server Error.' },
        { status: 500 }
      );
    }
  }
}
