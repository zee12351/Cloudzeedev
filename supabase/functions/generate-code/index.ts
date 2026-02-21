import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Messages array is required')
    }

    // Prepare prompt payload for Gemini
    const systemPrompt = `You are Lovable, an expert AI web developer.
    Your goal is to write perfect, working React components based on the user's request.
    
    IMPORTANT RULES:
    1. Output conversational text first explaining what you are doing.
    2. Then, output exactly ONE code block containing the React component code.
    3. The code block must start with \`\`\`jsx and end with \`\`\`.
    4. The React code must be a single file (e.g., App.jsx), using Tailwind CSS classes for styling (we will simulate Tailwind on the frontend).
    5. Ensure the code is complete and functional.`

    // Constructing the payload exactly as Gemini API expects
    let geminiContent = messages.map(msg => ({
      role: msg.role === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }))

    // Prepend the system prompt instruction
    geminiContent = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: "Understood. I will act as the Lovable AI developer according to those rules." }] },
      ...geminiContent
    ]

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: geminiContent,
          generationConfig: {
            temperature: 0.2, // Low temperature for coding
          }
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      console.error("Gemini Error:", data)
      throw new Error(data?.error?.message || 'Failed to fetch from Gemini')
    }

    // Extract the text response from Gemini
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    return new Response(
      JSON.stringify({ text: generatedText }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error fetching AI response:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
