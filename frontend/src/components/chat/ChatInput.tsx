"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { promptsApi } from "@/lib/api";
import { Send, FileText, Loader2 } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [prompts, setPrompts] = useState<Array<{ id: string; title: string; content: string }>>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);

  const handleSubmit = () => {
    if (!value.trim() || isLoading) return;
    onSend(value.trim());
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const loadPrompts = async () => {
    setLoadingPrompts(true);
    try {
      const data = await promptsApi.getAll();
      setPrompts(data);
    } catch {
    } finally {
      setLoadingPrompts(false);
    }
  };

  const selectPrompt = (content: string) => {
    setValue(content);
    textareaRef.current?.focus();
  };

  return (
    <div className="border-t bg-white p-4">
      <div className="max-w-3xl mx-auto relative">
        <div className="flex gap-2 items-end bg-warm-white rounded-2xl border p-2">
          <Popover onOpenChange={(open) => open && loadPrompts()}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="flex-shrink-0 h-10 w-10 rounded-xl text-muted-foreground hover:text-dusty-grape">
                <FileText className="w-5 h-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-2" align="start">
              <p className="text-sm font-medium mb-2 px-2">Saved Prompts</p>
              {loadingPrompts ? (
                <div className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </div>
              ) : prompts.length === 0 ? (
                <p className="text-sm text-muted-foreground px-2 py-3">No saved prompts</p>
              ) : (
                <div className="space-y-1 max-h-60 overflow-auto">
                  {prompts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => selectPrompt(p.content)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted text-sm"
                    >
                      <p className="font-medium">{p.title}</p>
                      <p className="text-muted-foreground text-xs truncate">{p.content}</p>
                    </button>
                  ))}
                </div>
              )}
            </PopoverContent>
          </Popover>

          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 min-h-[44px] max-h-[200px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 px-2 py-2.5"
            rows={1}
          />

          <Button
            onClick={handleSubmit}
            disabled={!value.trim() || isLoading}
            size="icon"
            className="flex-shrink-0 h-10 w-10 rounded-xl"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
