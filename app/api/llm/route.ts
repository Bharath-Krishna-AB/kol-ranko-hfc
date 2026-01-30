import { NextRequest, NextResponse } from 'next/server';


const HF_ROUTER_URL = 'https://router.huggingface.co/v1/chat/completions';


const MODEL_NAME = 'Qwen/Qwen2.5-7B-Instruct'; 
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body;

    
    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt in request body' }, { status: 400 });
    }

    if (!HF_API_KEY) {
      return NextResponse.json({ error: 'Server configuration error: Missing API Key' }, { status: 500 });
    }

    const response = await fetch(HF_ROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          { 
            role: "system", 
            content: "You are a cybersecurity expert. Analyze vulnerabilities and return ONLY a valid JSON array." 
          },
          { 
            role: "user", 
            content: prompt 
          }
        ],
        max_tokens: 1000,
        temperature: 0.1, 
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ 
        error: 'Router API error', 
        details: data 
      }, { status: response.status });
    }

    const result = data.choices?.[0]?.message?.content;

    return NextResponse.json({
      success: true,
      result: result,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Server Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}