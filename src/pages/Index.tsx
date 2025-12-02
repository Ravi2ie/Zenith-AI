import { useState, useEffect, useRef } from "react";
import { ArrowDown } from "lucide-react";
import ChatSidebar from "@/components/ChatSidebar";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import ThemeToggle from "@/components/ThemeToggle";
import AiIcon from "@/components/AiIcon";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: number;
  queryTime?: number;
  responseTime?: number;
  duration?: number;
  thinkingSteps?: string[];
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
}

const Index = () => {
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "1",
      title: "New Conversation",
      messages: [],
      timestamp: Date.now(),
    },
  ]);
  const [currentConversationId, setCurrentConversationId] = useState("1");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);
  const [lastRequestTime, setLastRequestTime] = useState<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Minimum delay between requests (in milliseconds)
  const MIN_REQUEST_DELAY = 2000; // 2 seconds

  const currentConversation = conversations.find(
    (c) => c.id === currentConversationId
  );

  useEffect(() => {
    // Smooth scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [currentConversation?.messages, isProcessing]);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      setShowJumpToBottom(scrollHeight - scrollTop - clientHeight > 100);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const callOpenRouterAPI = async (message: string, conversationHistory: Message[]): Promise<{ response: string; thinkingSteps: string[] }> => {
    try {
      // Get OpenRouter API key from environment
      const apiKey: string = import.meta.env.VITE_OPENROUTER_API_KEY ?? "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";
      
      // Debug: Log API key status
      console.log("🔍 DEBUG: Checking OpenRouter API Key");
      console.log("API Key exists:", !!apiKey);
      console.log("API Key length:", apiKey?.length);
      console.log("API Key starts with:", apiKey?.substring(0, 15) + "...");
      
      if (!apiKey) {
        throw new Error("VITE_OPENROUTER_API_KEY is not configured. Please add it to your .env file.");
      }

      console.log("✅ API Key validation passed, preparing OpenRouter request...");

      // Format conversation history for OpenRouter API
      const messages: Array<{
        role: "user" | "assistant";
        content: string;
        reasoning_details?: unknown;
      }> = conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Add system instruction with enhanced prompting for better answers
      const systemInstruction = `You are Zenith AI. Answer consciously to all questions. You are a highly conscious and thoughtful AI assistant with deep knowledge across multiple domains. Your goal is to provide insightful, comprehensive, and well-reasoned answers to all questions.`;

      // Add system instruction as first message
      messages.unshift({
        role: "assistant",
        content: systemInstruction,
      });

      // Add the current user message (FRESH, not pre-built)
      messages.push({
        role: "user",
        content: message,
      });

      // Retry logic for rate limiting
      let retries = 3;
      let delay = 1000; // Start with 1 second delay
      
      while (retries > 0) {
        try {
          console.log(`🔄 Attempt ${4 - retries}/3: Calling OpenRouter API...`);
          console.log("Message:", message);
          console.log("Conversation history length:", conversationHistory.length);
          console.log("Messages array length:", messages.length);
          
          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": window.location.href,
              "X-Title": "Zenith AI Chat",
            },
            body: JSON.stringify({
              model: "openai/gpt-oss-20b:free",
              messages: messages,
              temperature: 0.9,
              top_p: 0.95,
              max_tokens: 2048,
              reasoning: {
                enabled: true,
              },
            }),
          });

          console.log("✅ API call completed with status:", response.status);

          if (!response.ok) {
            const errorData = await response.json();
            console.error("❌ OpenRouter API error response:", errorData);
            throw new Error(`OpenRouter API error: ${response.status} - ${JSON.stringify(errorData)}`);
          }

          const data = await response.json();
          console.log("✅ Response received successfully");
          console.log("Response preview:", data.choices?.[0]?.message?.content?.substring(0, 100) + "...");

          const fullResponse = data.choices?.[0]?.message?.content || "No response generated";
          
          // Parse thinking steps and final answer
          const thinkingSteps: string[] = [];
          let finalAnswer = fullResponse;

          const lines = fullResponse.split('\n');
          let isThoughtSection = true;
          const answerLines: string[] = [];

          for (const line of lines) {
            if (line.trim().startsWith('THOUGHT:')) {
              thinkingSteps.push(line.replace('THOUGHT:', '').trim());
            } else if (line.trim().startsWith('ANSWER:')) {
              isThoughtSection = false;
              const answerContent = line.replace('ANSWER:', '').trim();
              if (answerContent) {
                answerLines.push(answerContent);
              }
            } else if (!isThoughtSection) {
              answerLines.push(line);
            }
          }

          // If we found thinking steps and an answer, use the parsed version
          if (thinkingSteps.length > 0 && answerLines.length > 0) {
            finalAnswer = answerLines.join('\n').trim();
          } else if (thinkingSteps.length > 0) {
            // If only thoughts but no explicit answer, treat remaining as answer
            finalAnswer = fullResponse;
            thinkingSteps.length = 0; // Clear thoughts if parsing failed
          }

          return { response: finalAnswer, thinkingSteps };
        } catch (error: unknown) {
          const err = error as {
            error?: { code?: number };
            status?: number;
            message?: string;
          };

          console.log("❌ API call failed on attempt", 4 - retries);
          console.log("Error object:", error);
          console.log("Error code:", err?.error?.code);
          console.log("Error status:", err?.status);
          console.log("Error message:", err?.message);

          // Check if it's a rate limit error (429)
          if (
            err?.error?.code === 429 ||
            err?.status === 429 ||
            (typeof err.message === "string" && (err.message.includes("429") || err.message.includes("rate_limit") || err.message.includes("quota")))
          ) {
            retries--;
            console.log(`⚠️ Rate limit detected. Retries remaining: ${retries}`);
            
            if (retries === 0) {
              throw new Error(
                "Rate limit exceeded. The API is currently busy. Please try again in a few moments."
              );
            }

            // Exponential backoff: wait before retrying
            console.log(`⏳ Waiting ${delay / 1000} seconds before retry...`);
            toast({
              title: "Rate limit hit",
              description: `Retrying in ${delay / 1000} seconds... (${3 - retries}/3)`,
            });

            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // Double the delay for next retry
          } else {
            // If it's not a rate limit error, throw immediately
            console.log("❌ Non-rate-limit error detected, throwing immediately");
            throw error;
          }
        }
      }

      throw new Error("Failed after multiple retries");
    } catch (error: unknown) {
      console.error("❌ Error calling OpenRouter:", error);
      
      // Debug: Log full error object
      console.log("🔍 DEBUG: Full error object:", error);
      console.log("Error type:", typeof error);
      const constructorName =
        error instanceof Error
          ? error.constructor.name
          : typeof error === "object" && error !== null && "constructor" in error
          ? (error as { constructor?: { name?: string } }).constructor?.name
          : undefined;
      console.log("Error constructor:", constructorName);
      
      // Narrow the error shape for safer property access
      const err = error as { error?: { code?: number }; status?: number; message?: string };

      console.log("🔍 DEBUG: Error properties:");
      console.log("  - err.error?.code:", err?.error?.code);
      console.log("  - err.status:", err?.status);
      console.log("  - err.message:", err?.message);
      console.log("  - Full error string:", JSON.stringify(error));

      // Better error messages based on error type
      // CHECK RATE LIMIT FIRST before API key to avoid false positives
      let errorMessage = "Failed to get response from AI. Please try again.";
      
      const messageStr = typeof err.message === "string" ? err.message : "";
      
      // Check for rate limit/quota errors (should be checked FIRST)
      if (err?.error?.code === 429 || messageStr.includes("rate_limit") || messageStr.includes("quota") || messageStr.includes("Rate limit")) {
        errorMessage = "🚫 Rate limit exceeded! Please wait a moment and try again, or switch to a different model.";
        console.log("✅ Detected rate limit/quota error");
      } 
      // Check for invalid API key errors (only after ruling out rate limits)
      else if (messageStr.includes("invalid api key") || messageStr.includes("unauthorized") || messageStr.includes("unauthenticated") || messageStr.includes("401")) {
        errorMessage = "❌ Invalid API key. Please check your VITE_OPENROUTER_API_KEY in .env file.";
        console.log("❌ Detected API key error:", err.message);
      } 
      // Use the actual error message if it's informative
      else if (messageStr.length > 0) {
        errorMessage = messageStr;
        console.log("📝 Using error message:", err.message);
      } else {
        console.log("⚠️ Could not extract error message, using default");
      }

      console.log("📢 Final error message shown to user:", errorMessage);

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
      
      throw error;
    }
  };

  const handleSendMessage = async (content: string, webSearch: boolean = false) => {
    // 🔍 DEBUG: Log incoming user message
    console.log('\n' + '='.repeat(80));
    console.log('📩 USER INPUT RECEIVED');
    console.log('='.repeat(80));
    console.log('📝 Raw user input:', content);
    console.log('🔍 Input length:', content.length);
    console.log('🌐 Web search enabled:', webSearch);
    console.log('⏰ Timestamp:', new Date().toISOString());
    
    // Check rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < MIN_REQUEST_DELAY && lastRequestTime !== 0) {
      const waitTime = Math.ceil((MIN_REQUEST_DELAY - timeSinceLastRequest) / 1000);
      toast({
        title: "Please wait",
        description: `Please wait ${waitTime} second${waitTime > 1 ? 's' : ''} before sending another message.`,
        variant: "destructive",
      });
      return;
    }

    const queryTime = Date.now();
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: "user",
      timestamp: queryTime,
      queryTime,
    };

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === currentConversationId
          ? {
              ...conv,
              messages: [...conv.messages, userMessage],
              title:
                conv.messages.length === 0
                  ? content.slice(0, 30) + (content.length > 30 ? "..." : "")
                  : conv.title,
            }
          : conv
      )
    );

    setIsProcessing(true);
    setLastRequestTime(now);

    try {
      // Get current conversation history before sending
      const currentConv = conversations.find((c) => c.id === currentConversationId);
      const conversationHistory = currentConv?.messages || [];

      let promptToModel = content;
      console.log('\n📤 INITIAL PROMPT TO MODEL:', promptToModel.substring(0, 100) + '...');

      if (webSearch) {
        try {
          const resp = await fetch('http://localhost:5175/search-serp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: content, numResults: 5 }),
          });

          if (resp.ok) {
            const data = await resp.json();
            const results = data.results || [];
            // Build a concise summary to pass to the model
            const searchSummary = (results as Array<{ title?: string; snippet?: string; url?: string }>).map((r, i) => {
              const title = r.title || '';
              const snippet = r.snippet || '';
              const url = r.url || '';
              return `${i + 1}. ${title}\n${snippet}\nSource: ${url}`;
            }).join('\n\n');

            promptToModel = `${content}\n\n[WEB SEARCH RESULTS]\n${searchSummary}\n\nPlease use the above web search results to answer the user's question and cite any sources you used.`;
            console.log('✅ Web search results added to prompt');
            console.log('📊 Web results count:', results.length);
          } else {
            console.warn('Search-ddg returned non-ok status', resp.status);
            toast({ title: 'Web search failed', description: 'Unable to fetch web results, continuing without web search', variant: 'destructive' });
          }
        } catch (err) {
          console.error('Web search error:', err);
          console.log('Error type:', typeof err);
          console.log('Error details:', err instanceof Error ? err.message : JSON.stringify(err));
          
          // Show error toast with details
          let errorDesc = 'Failed to perform web search, continuing without web results';
          if (err instanceof Error) {
            errorDesc += ` (${err.message})`;
          }
          
          toast({ 
            title: 'Web search error', 
            description: errorDesc, 
            variant: 'destructive',
            duration: 4000
          });
        }
      }

      console.log('\n📤 SENDING TO OPENROUTER API:');
      console.log('📋 Final prompt to API:', promptToModel);
      console.log('📚 Conversation history length:', conversationHistory.length);
      
      const aiResponseData = await callOpenRouterAPI("Answer to this question:(note dont use table instead you can list in bulletin you want and properly structure the answer),also tell me the source where you referenced the answer" + promptToModel, conversationHistory);
      const responseTime = Date.now();
      const duration = responseTime - queryTime;
      
      console.log('\n' + '='.repeat(80));
      console.log('🤖 AI RESPONSE RECEIVED');
      console.log('='.repeat(80));
      console.log('⏱️  Response time (ms):', duration);
      console.log('💬 Response content (first 200 chars):', aiResponseData.response.substring(0, 200) + '...');
      console.log('🧠 Thinking steps found:', aiResponseData.thinkingSteps.length);
      if (aiResponseData.thinkingSteps.length > 0) {
        console.log('💭 Thinking steps:', aiResponseData.thinkingSteps);
      }
      console.log('='.repeat(80) + '\n');

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponseData.response,
        role: "assistant",
        timestamp: responseTime,
        queryTime,
        responseTime,
        duration,
        thinkingSteps: aiResponseData.thinkingSteps,
      };

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === currentConversationId
            ? { ...conv, messages: [...conv.messages, aiResponse] }
            : conv
        )
      );
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Extract the error message for better user feedback
      let errorMsg = "Failed to send message. Please try again.";
      if (error instanceof Error) {
        errorMsg = error.message;
      }
      
      // Show error to user since callOpenRouterAPI error toast may not reach here
      toast({
        title: "Message Failed",
        description: errorMsg,
        variant: "destructive",
        duration: 5000,
      });
      
      // Note: callOpenRouterAPI already shows its own toast, but we add this as a backup
      // to ensure user sees an error message regardless of timing
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    const message = currentConversation?.messages.find((m) => m.id === messageId);
    if (!message || message.role !== "user") return;

    // Remove the edited message and all messages after it
    const messageIndex = currentConversation.messages.findIndex((m) => m.id === messageId);
    const updatedMessages = currentConversation.messages.slice(0, messageIndex);

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === currentConversationId
          ? { ...conv, messages: updatedMessages }
          : conv
      )
    );

    // Send the edited message
    await handleSendMessage(newContent);
  };

  const handleRegenerateResponse = async (messageId: string) => {
    const messageIndex = currentConversation?.messages.findIndex((m) => m.id === messageId);
    if (messageIndex === undefined || messageIndex === -1) return;

    // Find the user message before this AI response
    const userMessage = currentConversation?.messages[messageIndex - 1];
    if (!userMessage || userMessage.role !== "user") return;

    // Remove the AI response
    const updatedMessages = currentConversation.messages.slice(0, messageIndex);
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === currentConversationId
          ? { ...conv, messages: updatedMessages }
          : conv
      )
    );

    // Regenerate response
    setIsProcessing(true);
    try {
      // Use current time as the query time for regeneration
      const queryTime = Date.now();
      
      // Get conversation history up to this point (excluding the AI response we're regenerating)
      const conversationHistory = updatedMessages;
      
      const aiResponseData = await callOpenRouterAPI(userMessage.content, conversationHistory);
      const responseTime = Date.now();
      const duration = responseTime - queryTime;

      const aiResponse: Message = {
        id: Date.now().toString(),
        content: aiResponseData.response,
        role: "assistant",
        timestamp: responseTime,
        queryTime,
        responseTime,
        duration,
        thinkingSteps: aiResponseData.thinkingSteps,
      };

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === currentConversationId
            ? { ...conv, messages: [...conv.messages, aiResponse] }
            : conv
        )
      );
    } catch (error) {
      console.error("Error regenerating response:", error);
      
      // Extract and show error message to user
      let errorMsg = "Failed to regenerate response. Please try again.";
      if (error instanceof Error) {
        errorMsg = error.message;
      }
      
      toast({
        title: "Regeneration Failed",
        description: errorMsg,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewConversation = () => {
    // Only create new conversation if current one has messages
    if (currentConversation && currentConversation.messages.length > 0) {
      const newConv: Conversation = {
        id: Date.now().toString(),
        title: "New Conversation",
        messages: [],
        timestamp: Date.now(),
      };
      setConversations((prev) => [newConv, ...prev]);
      setCurrentConversationId(newConv.id);
    }
  };

  const handleDeleteConversation = (id: string) => {
    if (conversations.length === 1) {
      handleNewConversation();
    } else if (currentConversationId === id) {
      const remainingConvs = conversations.filter((c) => c.id !== id);
      setCurrentConversationId(remainingConvs[0].id);
    }
    setConversations((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background relative">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Orbs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float opacity-50"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float opacity-50" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-rotate-scale opacity-30"></div>
        
        {/* Particle Grid */}
        <div className="particle-bg absolute inset-0"></div>
      </div>

      <ChatSidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onNewConversation={handleNewConversation}
        onSelectConversation={setCurrentConversationId}
        onDeleteConversation={handleDeleteConversation}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className="flex-1 flex flex-col min-w-0 h-screen relative z-10">
        {/* Header */}
        <header className="flex-shrink-0 border-b border-border glass-effect px-6 py-3 flex items-center justify-between shadow-elegant backdrop-blur-xl">
          <div className="flex items-center gap-3 animate-slide-up">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center relative group animate-pulse-glow shine-effect">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-xl blur-xl group-hover:blur-2xl transition-all"></div>
              <AiIcon className="h-10 w-10 relative z-10 drop-shadow-lg" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent animate-gradient neon-glow">
              Zenith AI Assistant
            </h1>
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <ThemeToggle />
          </div>
        </header>

        {/* Messages Area - Scrollable */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{ 
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {currentConversation?.messages.length === 0 ? (
            <div className="flex items-center justify-center min-h-full p-8 relative">
              <div className="text-center space-y-6 max-w-3xl animate-scale-in">
                {/* Hero Icon with Glow */}
                <div className="relative mx-auto w-fit">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-500 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                  <div className="relative h-32 w-32 mx-auto flex items-center justify-center animate-float">
                    <AiIcon className="h-28 w-28 drop-shadow-2xl" />
                  </div>
                </div>

                {/* Welcome Text with Gradient */}
                <div className="space-y-3">
                  <h2 className="text-5xl font-black bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent animate-gradient drop-shadow-lg">
                    Welcome to Zenith AI
                  </h2>
                  <p className="text-xl text-muted-foreground font-medium animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    Your intelligent companion for limitless conversations
                  </p>
                </div>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                  <div className="glass-effect p-4 rounded-xl border border-primary/20 hover:border-primary/40 transition-all hover:scale-105 shine-effect group">
                    <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">⚡</div>
                    <h3 className="font-semibold text-foreground mb-1">Lightning Fast</h3>
                    <p className="text-sm text-muted-foreground">Instant responses powered by advanced AI</p>
                  </div>
                  <div className="glass-effect p-4 rounded-xl border border-purple-500/20 hover:border-purple-500/40 transition-all hover:scale-105 shine-effect group" style={{ animationDelay: '0.1s' }}>
                    <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">🧠</div>
                    <h3 className="font-semibold text-foreground mb-1">Context Aware</h3>
                    <p className="text-sm text-muted-foreground">Maintains full conversation history</p>
                  </div>
                  <div className="glass-effect p-4 rounded-xl border border-accent/20 hover:border-accent/40 transition-all hover:scale-105 shine-effect group" style={{ animationDelay: '0.2s' }}>
                    <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">✨</div>
                    <h3 className="font-semibold text-foreground mb-1">Smart & Intuitive</h3>
                    <p className="text-sm text-muted-foreground">Natural and engaging interactions</p>
                  </div>
                </div>

                {/* Tips Section */}
                <div className="mt-8 p-6 glass-effect border border-border/50 rounded-2xl animate-slide-up animate-glow-border" style={{ animationDelay: '0.4s' }}>
                  <p className="font-bold text-foreground text-lg mb-3 flex items-center justify-center gap-2">
                    <span className="text-2xl">💡</span> Pro Tips
                  </p>
                  <ul className="text-left space-y-2 text-sm text-muted-foreground max-w-xl mx-auto">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">▸</span>
                      <span>Rate limited to prevent quota exhaustion - wait 2 seconds between messages</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 mt-0.5">▸</span>
                      <span>Automatic retry with exponential backoff on rate limit errors</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-0.5">▸</span>
                      <span>Free tier has limited quota - upgrade for unlimited access</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full">
              {currentConversation.messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onEdit={handleEditMessage}
                  onRegenerate={handleRegenerateResponse}
                />
              ))}
              {isProcessing && (
                <div className="flex gap-4 p-6 bg-card/30 justify-start max-w-4xl mx-auto border-b border-border/50 animate-scale-in">
                  <div className="flex h-10 w-10 shrink-0 select-none items-center justify-center relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-purple-500/30 rounded-xl blur-xl animate-pulse"></div>
                    <AiIcon className="h-8 w-8 animate-pulse relative z-10" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex gap-2 items-center">
                      <div className="h-3 w-3 rounded-full bg-gradient-to-r from-primary to-purple-500 animate-bounce shadow-lg" />
                      <div className="h-3 w-3 rounded-full bg-gradient-to-r from-purple-500 to-accent animate-bounce shadow-lg" style={{ animationDelay: '0.2s' }} />
                      <div className="h-3 w-3 rounded-full bg-gradient-to-r from-accent to-primary animate-bounce shadow-lg" style={{ animationDelay: '0.4s' }} />
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gradient-to-r from-primary/20 to-transparent rounded-full w-3/4 animate-pulse"></div>
                      <div className="h-4 bg-gradient-to-r from-purple-500/20 to-transparent rounded-full w-1/2 animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Jump to Bottom Button */}
        {showJumpToBottom && (
          <Button
            onClick={scrollToBottom}
            size="icon"
            className="absolute bottom-24 right-8 rounded-full shadow-2xl bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 transition-all z-10 animate-pulse-glow hover:scale-110"
          >
            <ArrowDown className="h-5 w-5" />
          </Button>
        )}

        {/* Input Area - Fixed at Bottom */}
        <div className="flex-shrink-0">
          <ChatInput onSend={handleSendMessage} disabled={isProcessing} />
        </div>
      </div>
    </div>
  );
};

export default Index;
