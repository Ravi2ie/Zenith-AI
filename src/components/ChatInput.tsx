import { useState } from "react";
import { Send, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface ChatInputProps {
  onSend: (message: string, webSearch?: boolean) => void;
  disabled?: boolean;
}

const ChatInput = ({ onSend, disabled }: ChatInputProps) => {
  const [input, setInput] = useState("");
  const [webSearch, setWebSearch] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim(), webSearch);
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-border glass-effect backdrop-blur-2xl relative overflow-hidden">
      {/* Animated Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-purple-500/5 to-accent/5 animate-gradient pointer-events-none"></div>
      
      <div className="max-w-4xl mx-auto p-4 relative z-10">
  <form onSubmit={handleSubmit} className="relative group">
    {/* Subtle glow when focused */}
    <div className="absolute -inset-1 bg-gradient-to-r from-primary via-purple-500 to-accent rounded-2xl blur-lg opacity-0 group-focus-within:opacity-30 transition-opacity duration-500"></div>

    <div className="relative">
      {/* Web search toggle (left side, vertically centered) */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex items-center">
        {/* Desktop toggle */}
        <div className="hidden sm:flex items-center gap-2 bg-muted/30 px-3 py-1 rounded-full border border-border/30 glass-effect shadow-sm whitespace-nowrap">
          <Globe className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Search web</span>
          <Switch
            checked={webSearch}
            onCheckedChange={(val) => setWebSearch(Boolean(val))}
            className="ml-1"
          />
        </div>

        {/* Mobile toggle (icon only) */}
        <div className="flex sm:hidden items-center bg-muted/30 p-2 rounded-full border border-border/30 glass-effect shadow-sm">
          <Switch
            checked={webSearch}
            onCheckedChange={(val) => setWebSearch(Boolean(val))}
          />
        </div>
      </div>

      {/* Input + send button */}
      <div className="relative flex items-end gap-3 pl-[150px] sm:pl-[210px] transition-all duration-300">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message... ✨"
          disabled={disabled}
          className="min-h-[60px] max-h-[200px] resize-none flex-1 rounded-2xl bg-card/80 border-2 border-border focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20 shadow-elegant transition-all duration-300 backdrop-blur-sm placeholder:text-muted-foreground/60 hover:border-primary/50"
          rows={1}
          style={{
            height: 'auto',
            overflowY: input.split('\n').length > 3 ? 'auto' : 'hidden',
          }}
        />

        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || disabled}
          className="h-[60px] w-[60px] rounded-xl bg-gradient-to-r from-primary to-purple-500 text-primary-foreground hover:from-primary/90 hover:to-purple-500/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 shine-effect flex-shrink-0"
          aria-label="Send message"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  </form>

  {/* Keyboard hint */}
  <p className="text-xs text-muted-foreground text-center mt-3 flex items-center justify-center gap-2">
    <span className="opacity-60">Press</span>
    <kbd className="px-2 py-0.5 text-xs font-semibold text-foreground bg-muted border border-border rounded">Enter</kbd>
    <span className="opacity-60">to send,</span>
    <kbd className="px-2 py-0.5 text-xs font-semibold text-foreground bg-muted border border-border rounded">Shift+Enter</kbd>
    <span className="opacity-60">for new line</span>
  </p>
</div>

    </div>
  );
};

export default ChatInput;
