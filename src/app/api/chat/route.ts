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

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequestBody = await request.json();

    console.log('API Received chat history:', body.chatHistory); // Logging

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
      return NextResponse.json(
        { error: 'Invalid chat history format.' },
        { status: 400 }
      );
    }

    // Construct messages array for OpenAI API, including chat history
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful assistant.',
      },
      ...chatHistory.map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })),
    ];

    console.log('Messages sent to OpenAI:', messages); // Logging

    // Call OpenAI API
    const openAIResponse = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, // Ensure this env variable is set
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Update model as needed
          messages,
        }),
      }
    );

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      console.error('OpenAI API error:', errorData); // Logging
      return NextResponse.json(
        { error: 'Failed to fetch response from AI service.' },
        { status: 500 }
      );
    }

    const data = await openAIResponse.json();

    const aiMessage = data.choices?.[0]?.message?.content?.trim();

    console.log('AI response:', aiMessage); // Logging

    if (!aiMessage) {
      return NextResponse.json(
        { error: 'No response from AI service.' },
        { status: 500 }
      );
    }

    const response: ChatResponse = {
      content: aiMessage,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('API Route Error:', error); // Logging
    return NextResponse.json(
      { error: 'Internal Server Error.' },
      { status: 500 }
    );
  }
}
