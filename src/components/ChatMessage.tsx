import { User, Copy, Volume2, Edit, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import AiIcon from "./AiIcon";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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

interface ChatMessageProps {
  message: Message;
  onEdit: (messageId: string, newContent: string) => void;
  onRegenerate: (messageId: string) => void;
}

const ChatMessage = ({ message, onEdit, onRegenerate }: ChatMessageProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isThinkingOpen, setIsThinkingOpen] = useState(false);
  const isUser = message.role === "user";

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Text copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy text to clipboard",
        variant: "destructive",
      });
    }
  };

  const readAloud = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
      toast({
        title: "Reading aloud",
        description: "Text is being read",
      });
    } else {
      toast({
        title: "Not supported",
        description: "Text-to-speech is not supported in your browser",
        variant: "destructive",
      });
    }
  };

  const handleEdit = () => {
    if (isEditing) {
      onEdit(message.id, editContent);
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div
      className={cn(
        "w-full border-b border-border/30 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 hover:bg-card/20 transition-colors group",
        isUser ? "bg-background" : "bg-card/20"
      )}
    >
      <div className={cn(
        "max-w-4xl mx-auto px-6 py-6 flex gap-4 relative",
        isUser ? "flex-row-reverse" : "flex-row"
      )}>
        {/* Subtle hover glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        
        {isUser ? (
          <div className="flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-500 shadow-lg hover:shadow-xl transition-all hover:scale-110 relative z-10 ring-2 ring-primary/20">
            <User className="h-5 w-5 text-primary-foreground" />
          </div>
        ) : (
          <div className="flex h-10 w-10 shrink-0 select-none items-center justify-center relative z-10 group/icon">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-xl blur-xl group-hover/icon:blur-2xl transition-all"></div>
            <AiIcon className="h-9 w-9 relative z-10 drop-shadow-lg" />
          </div>
        )}

        <div className={cn(
          "flex-1 space-y-2 min-w-0",
          isUser ? "text-right" : "text-left"
        )}>
          {isEditing ? (
            <div className="w-full space-y-2 animate-scale-in">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[100px] bg-background border-2 focus-visible:ring-4 ring-primary/20 rounded-xl transition-all"
              />
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={handleEdit}
                  className="bg-gradient-to-r from-primary to-purple-500 hover:shadow-lg hover:scale-105 transition-all shine-effect"
                >
                  Send
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                  className="hover:bg-destructive/10 hover:border-destructive/50 hover:scale-105 transition-all"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Chain of Thoughts Section */}
              {!isUser && message.thinkingSteps && message.thinkingSteps.length > 0 && (
                <Collapsible open={isThinkingOpen} onOpenChange={setIsThinkingOpen} className="mb-3 animate-slide-up">
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 text-xs border-dashed hover:border-primary hover:bg-primary/5 hover:scale-105 transition-all relative overflow-hidden group/cot"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 translate-x-[-100%] group-hover/cot:translate-x-[100%] transition-transform duration-1000"></div>
                      {isThinkingOpen ? (
                        <ChevronUp className="h-3 w-3 relative z-10" />
                      ) : (
                        <ChevronDown className="h-3 w-3 relative z-10" />
                      )}
                      <span className="font-medium relative z-10">
                        {isThinkingOpen ? "Hide" : "Show"} Chain of Thoughts ({message.thinkingSteps.length} steps)
                      </span>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-2">
                    <div className="border-l-2 border-primary/30 pl-4 space-y-3 glass-effect p-3 rounded-lg">
                      {message.thinkingSteps.map((step, index) => (
                        <div key={index} className="space-y-1 animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-gradient-to-br from-primary to-purple-500 text-primary-foreground text-xs font-semibold shadow-lg">
                              {index + 1}
                            </span>
                            <span className="text-xs font-medium text-muted-foreground">
                              Thought {index + 1}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground pl-7 prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{step}</ReactMarkdown>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              <div className="leading-7 break-words">
                {isUser ? (
                  <p className="whitespace-pre-wrap text-foreground">{message.content}</p>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                )}
              </div>

              <div className={cn(
                "flex items-center gap-2 text-xs text-muted-foreground",
                isUser ? "justify-end" : "justify-start"
              )}>
                {message.queryTime && (
                  <span>Query: {formatTime(message.queryTime)}</span>
                )}
                {message.responseTime && (
                  <>
                    <span>•</span>
                    <span>Response: {formatTime(message.responseTime)}</span>
                  </>
                )}
                {message.duration && (
                  <>
                    <span>•</span>
                    <span>Duration: {formatDuration(message.duration)}</span>
                  </>
                )}
              </div>

              <TooltipProvider>
                <div className={cn(
                  "flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-all duration-300",
                  isUser ? "justify-end" : "justify-start"
                )}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 relative overflow-hidden group/btn hover:bg-primary/10 hover:scale-110 transition-all duration-200 hover:shadow-lg"
                        onClick={() => copyToClipboard(message.content)}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                        <Copy className="h-4 w-4 relative z-10" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy {isUser ? "query" : "response"}</p>
                    </TooltipContent>
                  </Tooltip>

                  {!isUser && (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 relative overflow-hidden group/btn hover:bg-primary/10 hover:scale-110 transition-all duration-200 hover:shadow-lg"
                            onClick={() => readAloud(message.content)}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/30 to-purple-500/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                            <Volume2 className="h-4 w-4 relative z-10" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Read aloud</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 relative overflow-hidden group/btn hover:bg-primary/10 hover:scale-110 transition-all duration-200 hover:shadow-lg hover:rotate-180"
                            onClick={() => onRegenerate(message.id)}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/30 to-blue-500/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                            <RefreshCw className="h-4 w-4 relative z-10" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Regenerate response</p>
                        </TooltipContent>
                      </Tooltip>
                    </>
                  )}

                  {isUser && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 relative overflow-hidden group/btn hover:bg-primary/10 hover:scale-110 transition-all duration-200 hover:shadow-lg"
                          onClick={handleEdit}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/30 to-green-500/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                          <Edit className="h-4 w-4 relative z-10" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit query</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </TooltipProvider>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
