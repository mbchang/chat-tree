// src/app/api/chat/route.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define the shape of the incoming request body
interface ChatRequestBody {
  message: string;
}

// Define the shape of the response
interface ChatResponse {
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequestBody = await request.json();

    const { message } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid message format.' },
        { status: 400 }
      );
    }

    // Call OpenAI API
    const openAIResponse = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, // Ensure you have this environment variable set
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // or whichever model you prefer
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant.',
            },
            { role: 'user', content: message },
          ],
        }),
      }
    );

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      console.error('OpenAI API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to fetch response from AI service.' },
        { status: 500 }
      );
    }

    const data = await openAIResponse.json();

    const aiMessage = data.choices?.[0]?.message?.content?.trim();

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
    console.error('API Route Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error.' },
      { status: 500 }
    );
  }
}
