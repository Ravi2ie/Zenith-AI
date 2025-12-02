import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="hover:bg-accent hover:scale-110 transition-all relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 relative z-10 text-yellow-500" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 z-10 text-blue-400" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-effect border-border/50 backdrop-blur-xl animate-scale-in">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={cn(
            "cursor-pointer transition-all hover:scale-105 relative overflow-hidden group",
            theme === "light" ? "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 shadow-md" : "hover:bg-accent/50"
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/20 to-yellow-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          <Sun className="mr-2 h-4 w-4 text-yellow-500 relative z-10" />
          <span className="relative z-10">Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={cn(
            "cursor-pointer transition-all hover:scale-105 relative overflow-hidden group",
            theme === "dark" ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 shadow-md" : "hover:bg-accent/50"
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/20 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          <Moon className="mr-2 h-4 w-4 text-blue-400 relative z-10" />
          <span className="relative z-10">Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={cn(
            "cursor-pointer transition-all hover:scale-105 relative overflow-hidden group",
            theme === "system" ? "bg-gradient-to-r from-gray-500/20 to-slate-500/20 shadow-md" : "hover:bg-accent/50"
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-gray-500/0 via-gray-500/20 to-gray-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          <Monitor className="mr-2 h-4 w-4 text-gray-500 relative z-10" />
          <span className="relative z-10">System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeToggle;
