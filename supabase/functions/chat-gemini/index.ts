import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, history = [] } = await req.json();
    const apiKey = Deno.env.get("OPENROUTER_API_KEY");

    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY not configured");
    }

    console.log('\n' + '='.repeat(80));
    console.log('🔄 BACKEND: Processing OpenRouter request');
    console.log('='.repeat(80));
    console.log("📩 User message received:", message.substring(0, 100) + '...');
    console.log("📊 Message length:", message.length);
    console.log("📚 Conversation history length:", history.length);
    console.log("⏰ Backend timestamp:", new Date().toISOString());

    // Build the messages array with conversation history
    const messages = [
      ...history, // Previous conversation turns
    ];

    // Add system instruction with enhanced prompting for better answers
    const systemInstruction = `You are Zenith AI. Answer consciously to all questions. You are a highly conscious and thoughtful AI assistant with deep knowledge across multiple domains. Your goal is to provide insightful, comprehensive, and well-reasoned answers to all questions.`;

    // Add system instruction as first message
    messages.unshift({
      role: "assistant",
      content: systemInstruction,
    });

    // Add the user's current message (NOT pre-built, fresh from user)
    messages.push({
      role: "user",
      content: message,
    });

    console.log('\n🔗 Making OpenRouter API call...');
    console.log('📋 Messages being sent:', messages.length);
    console.log('🎯 Model:', 'openai/gpt-oss-20b:free');
    console.log('🌡️  Temperature:', 0.9);
    
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "X-Title": "Zenith AI Chat",
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b:free",
          messages,
          temperature: 0.9,
          top_p: 0.95,
          max_tokens: 2048,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API error:", response.status, errorText);
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("✅ OpenRouter API response received");
    console.log("📊 Response status:", response.status);
    
    const generatedText = data.choices?.[0]?.message?.content || "No response generated";
    
    console.log('\n' + '='.repeat(80));
    console.log('🤖 BACKEND RESPONSE CONTENT');
    console.log('='.repeat(80));
    console.log('💬 Generated text (first 250 chars):', generatedText.substring(0, 250) + '...');
    console.log('📏 Total response length:', generatedText.length);
    console.log('✅ Response successfully generated');
    console.log('='.repeat(80) + '\n');

    return new Response(
      JSON.stringify({ response: generatedText }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in chat-openrouter function:", error);
    
    // Detailed error logging
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    // Determine appropriate status code
    let statusCode = 500;
    if (errorMessage.includes("rate_limit") || errorMessage.includes("quota")) {
      statusCode = 429; // Rate limit error
    } else if (errorMessage.includes("API") && errorMessage.includes("429")) {
      statusCode = 429;
    } else if (errorMessage.includes("401") || errorMessage.includes("unauthorized")) {
      statusCode = 401; // Auth error
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        status: statusCode,
        timestamp: new Date().toISOString()
      }),
      {
        status: statusCode,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
