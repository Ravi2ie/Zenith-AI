import { Plus, MessageSquare, Trash2, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  title: string;
  timestamp: number;
}

interface ChatSidebarProps {
  conversations: Conversation[];
  currentConversationId: string;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const ChatSidebar = ({
  conversations,
  currentConversationId,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  isCollapsed,
  onToggleCollapse,
}: ChatSidebarProps) => {
  return (
    <aside
      className={cn(
        "h-full bg-card/50 glass-effect border-r border-border/50 transition-all duration-300 flex flex-col relative overflow-hidden",
        isCollapsed ? "w-0 md:w-16" : "w-64"
      )}
    >
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-purple-500/5 pointer-events-none"></div>
      
      <div className="p-4 border-b border-border/50 flex items-center justify-between relative z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="hover:bg-accent hover:scale-110 transition-all hover:rotate-180 duration-300"
        >
          <Menu className="h-5 w-5" />
        </Button>
        {!isCollapsed && (
          <Button
            onClick={onNewConversation}
            size="sm"
            className="bg-gradient-to-r from-primary to-purple-500 text-primary-foreground hover:shadow-lg transition-all shine-effect hover:scale-105 animate-scale-in"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        )}
      </div>

      {!isCollapsed && (
        <ScrollArea className="flex-1 px-2 relative z-10">
          <div className="space-y-1 py-2">
            {conversations.map((conv, index) => (
              <div
                key={conv.id}
                className={cn(
                  "group relative flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all animate-slide-up overflow-hidden",
                  currentConversationId === conv.id
                    ? "bg-gradient-to-r from-primary/20 to-purple-500/20 text-primary shadow-md scale-105"
                    : "hover:bg-accent/50 text-foreground hover:scale-105 hover:shadow-md"
                )}
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => onSelectConversation(conv.id)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <MessageSquare className="h-4 w-4 flex-shrink-0 relative z-10" />
                <span className="flex-1 text-sm truncate relative z-10">{conv.title}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive/20 hover:text-destructive hover:scale-110 relative z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConversation(conv.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </aside>
  );
};

export default ChatSidebar;
