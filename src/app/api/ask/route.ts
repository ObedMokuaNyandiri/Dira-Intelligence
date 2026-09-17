import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

// Initialize Supabase Client
const supabaseUrl = 'https://dzmyfiigvwbteclxweqz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bXlmaWlndndidGVjbHh3ZXF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTYzMDEyOCwiZXhwIjoyMTA1MjA2MTI4fQ.-KzfmPyvDmv6EUMF5ngyFo9E5oL_iBICTK7CZ7fWDVY';
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Gemini Client
const geminiApiKey = 'AIzaSyBXIFXXt_7VApAMAtkT3IGsYhsI1XCKQL8';
const ai = new GoogleGenAI({ apiKey: geminiApiKey });

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // 1. Embed the user query
    const embeddingResponse = await ai.models.embedContent({
      model: 'text-embedding-004',
      contents: query,
    });
    
    let queryEmbedding = embeddingResponse.embeddings[0].values;

    // Pad to 3072 dimensions to match DB schema
    if (queryEmbedding.length < 3072) {
      const padding = new Array(3072 - queryEmbedding.length).fill(0);
      queryEmbedding = [...queryEmbedding, ...padding];
    }

    // 2. Search Supabase
    const { data: documents, error: searchError } = await supabase.rpc('match_policy_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.2, // Lower threshold for broad matching
      match_count: 10,
    });

    if (searchError) {
      console.error('Supabase Search Error:', searchError);
      return NextResponse.json({ error: 'Database search failed' }, { status: 500 });
    }

    if (!documents || documents.length === 0) {
      return NextResponse.json({ 
        conclusion: "No relevant policies found.",
        whyItMatters: "The system could not find documents related to your query.",
        risks: [],
        sources: []
      });
    }

    // 3. Construct Context
    const contextText = documents.map((doc: any, index: number) => {
      return `--- SOURCE ${index + 1} ---\nTitle: ${doc.document_title}\nStatus: ${doc.status_type}\nContent:\n${doc.content}\n`;
    }).join('\n');

    // 4. Generate Final Response using Gemini
    const systemPrompt = `You are an elite, highly precise Executive Intelligence AI.
You are given a user's decision-making query and a set of retrieved policy documents as context.
You must synthesize the information and return a JSON object with the following structure:
{
  "conclusion": "A bold, definitive 1-2 sentence executive conclusion on whether the decision is permitted, blocked, or requires caveats.",
  "whyItMatters": "A 1-paragraph explanation of the strategic or legal implications.",
  "risks": [
    {
      "area": "E.g. Data Protection, AI Compliance, Vendor Risk",
      "severity": 1 to 5 (integer, 5 being critical),
      "description": "Short explanation of the risk."
    }
  ],
  "sources": [
    {
      "title": "Document Title",
      "status": "Document Status",
      "excerpt": "A short exact quote from the document proving your point."
    }
  ]
}
Do NOT include markdown formatting (\`\`\`json) in your response, just the raw JSON string.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: `CONTEXT:\n${contextText}\n\nQUERY:\n${query}` }] }
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      }
    });

    const resultText = response.text || "{}";
    const resultJson = JSON.parse(resultText);

    return NextResponse.json(resultJson);

  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
