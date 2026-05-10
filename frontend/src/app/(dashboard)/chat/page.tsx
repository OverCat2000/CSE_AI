"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { chatApi, requestStream } from "@/lib/api";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { SessionList } from "@/components/chat/SessionList";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare } from "lucide-react";

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

export default function ChatPage() {
  const { toast } = useToast();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<{ abort: () => void } | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadSession = useCallback(async (sessionId: string) => {
    setLoadingSession(true);
    setActiveSessionId(sessionId);
    try {
      const data = await chatApi.getSession(sessionId);
      setMessages(data.messages);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load session";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoadingSession(false);
    }
  }, [toast]);

  const handleSend = async (content: string) => {
    let sessionId = activeSessionId;

    if (!sessionId) {
      try {
        const data = await chatApi.createSession(content.slice(0, 50));
        sessionId = data.id;
        setActiveSessionId(sessionId);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to create session";
        toast({ title: "Error", description: message, variant: "destructive" });
        return;
      }
    }

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setStreaming(true);

    let assistantContent = "";
    const assistantMessageId = `assistant-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: assistantMessageId, role: "assistant", content: "", created_at: new Date().toISOString() },
    ]);

    abortRef.current = requestStream(
      `/chat/sessions/${sessionId}/messages/stream`,
      { content },
      (chunk) => {
        assistantContent += chunk;
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMessageId ? { ...m, content: assistantContent } : m))
        );
      },
      () => {
        setStreaming(false);
        setLoading(false);
      },
      (error) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        setStreaming(false);
        setLoading(false);
      }
    );
  };

  const handleDeleteSession = (id: string) => {
    if (activeSessionId === id) {
      setActiveSessionId(null);
      setMessages([]);
    }
  };

  return (
    <div className="flex h-full">
      <div className="hidden lg:flex lg:flex-col lg:w-72 bg-dusty-grape border-r">
        <div className="p-4">
          <h2 className="text-lg font-semibold text-white">Chat History</h2>
        </div>
        <SessionList
          activeSessionId={activeSessionId}
          onSelectSession={loadSession}
          onDeleteSession={handleDeleteSession}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {loadingSession ? (
          <div className="flex-1 flex items-center justify-center">
            <Skeleton className="h-4 w-32" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-full bg-pearl-aqua/10 flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-pearl-aqua" />
            </div>
            <h2 className="text-xl font-semibold text-dusty-grape mb-2">Start a new conversation</h2>
            <p className="text-muted-foreground max-w-md">
              Type a message below to start chatting. Your conversation will be saved automatically.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-3xl mx-auto">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  role={msg.role as "user" | "assistant"}
                  content={msg.content}
                  isStreaming={streaming && msg.role === "assistant" && msg.id === messages[messages.length - 1]?.id}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        <ChatInput onSend={handleSend} isLoading={loading} />
      </div>
    </div>
  );
}
