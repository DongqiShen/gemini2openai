const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:';

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  try {
    if (request.method === 'GET') {
      return new Response(JSON.stringify({ message: 'This worker processes embedding requests.' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (request.method !== 'POST') {
      throw new Error('Only POST requests are allowed');
    }

    console.log('Received request:', request.url);

    // 从请求头中获取 API 密钥
    const apiKey = request.headers.get('Authorization');
    if (!apiKey || !apiKey.startsWith('Bearer ')) {
      throw new Error('Invalid or missing API key in the Authorization header');
    }
    const geminiApiKey = apiKey.split('Bearer ')[1];

    const openaiPayload = await request.json();
    console.log('OpenAI payload:', JSON.stringify(openaiPayload));

    const isBatchRequest = Array.isArray(openaiPayload.input);
    const endpoint = isBatchRequest ? 'batchEmbedContents' : 'embedContent';
    const geminiApiUrl = `${GEMINI_API_BASE_URL}${endpoint}?key=${geminiApiKey}`;

    console.log('Using Gemini API URL:', geminiApiUrl);

    const geminiPayload = convertOpenAIToGemini(openaiPayload, isBatchRequest);
    console.log('Gemini payload:', JSON.stringify(geminiPayload));

    const geminiResponse = await fetch(geminiApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(geminiPayload),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', geminiResponse.status, errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status} ${errorText}`);
    }

    const geminiData = await geminiResponse.json();
    console.log('Gemini response:', JSON.stringify(geminiData));

    const openaiResponse = convertGeminiToOpenAI(geminiData, openaiPayload, isBatchRequest);
    console.log('OpenAI response:', JSON.stringify(openaiResponse));

    return new Response(JSON.stringify(openaiResponse), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in handleRequest:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

function convertOpenAIToGemini(openaiPayload, isBatchRequest) {
  if (!openaiPayload.input) {
    throw new Error('Input is missing in the OpenAI payload');
  }

  const input = Array.isArray(openaiPayload.input) ? openaiPayload.input : [openaiPayload.input];

  if (isBatchRequest) {
    return {
      requests: input.map(text => ({
        model: "models/text-embedding-004",
        content: {
          parts: [{ text }]
        }
      }))
    };
  } else {
    return {
      model: "models/text-embedding-004",
      content: {
        parts: [{ text: input[0] }]
      }
    };
  }
}

function convertGeminiToOpenAI(geminiData, openaiPayload, isBatchRequest) {
  let embeddings;
  if (isBatchRequest) {
    embeddings = geminiData.embeddings;
  } else {
    embeddings = [geminiData.embedding];
  }

  if (!embeddings) {
    throw new Error('No embeddings found in Gemini response');
  }

  return {
    object: "list",
    data: embeddings.map((embedding, index) => ({
      object: "embedding",
      embedding: embedding.values,
      index: index
    })),
    model: openaiPayload.model || "text-embedding-ada-002",
    usage: {
      prompt_tokens: estimateTokens(openaiPayload.input),
      total_tokens: estimateTokens(openaiPayload.input)
    }
  };
}

function estimateTokens(input) {
  if (!input) return 0;
  // 这是一个非常粗略的估计，实际上应该使用更复杂的分词算法
  return Array.isArray(input)
    ? input.reduce((sum, text) => sum + (text ? text.split(/\s+/).length : 0), 0)
    : input.split(/\s+/).length;
}