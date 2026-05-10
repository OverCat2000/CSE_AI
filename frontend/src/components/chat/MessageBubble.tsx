import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

interface MessageBubbleProps {
  role: "user" | "assistant" | "system";
  content: string;
  isStreaming?: boolean;
}

export function MessageBubble({ role, content, isStreaming }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={cn("flex gap-3 mb-4", isUser ? "flex-row-reverse" : "flex-row")}>
      <Avatar className={cn("h-8 w-8 flex-shrink-0", isUser ? "bg-pearl-aqua" : "bg-dusty-grape")}>
        <AvatarFallback className="text-white text-xs">
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </AvatarFallback>
      </Avatar>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-pearl-aqua text-white rounded-tr-sm"
            : "bg-white border shadow-sm rounded-tl-sm",
        )}
      >
        <div className="whitespace-pre-wrap">{content}</div>
        {isStreaming && <span className="inline-block w-2 h-4 ml-1 bg-pearl-aqua animate-pulse" />}
      </div>
    </div>
  );
}
