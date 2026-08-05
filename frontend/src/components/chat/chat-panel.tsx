"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowUp,
  Bot,
  Eraser,
  Loader2,
  Sparkles,
  Square,
  User,
} from "lucide-react";

import { chatApi, ApiError, type ChatMessage } from "@/lib/api";
import { BRAND } from "@/lib/brand";
import { getUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const SUGGESTIONS = [
  "What does daily turnover tell me about a listing?",
  "Explain market cap vs. free-float market cap.",
  "How is a broad market index constructed?",
  "What is a price band and when does it trigger?",
];

interface Bubble extends ChatMessage {
  id: string;
  /** Set when the request failed, so the bubble renders as an error. */
  error?: boolean;
}

function newId(): string {
  return crypto.randomUUID();
}

export function ChatPanel() {
  const [messages, setMessages] = useState<Bubble[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [sessionId, setSessionId] = useState(() => newId());

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const send = useCallback(
    async (text: string) => {
      const prompt = text.trim();
      if (!prompt || streaming) return;

      const history: ChatMessage[] = [
        ...messages.map(({ role, content }) => ({ role, content })),
        { role: "user" as const, content: prompt },
      ];
      const replyId = newId();

      setMessages((prev) => [
        ...prev,
        { id: newId(), role: "user", content: prompt },
        { id: replyId, role: "assistant", content: "" },
      ]);
      setInput("");
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        await chatApi.stream({
          messages: history,
          sessionId,
          userId: getUser()?.id ? String(getUser()?.id) : undefined,
          signal: controller.signal,
          onDelta: (delta) =>
            setMessages((prev) =>
              prev.map((m) =>
                m.id === replyId ? { ...m, content: m.content + delta } : m,
              ),
            ),
        });
      } catch (err) {
        if (controller.signal.aborted) return;
        const message =
          err instanceof ApiError
            ? err.message
            : "Could not reach the assistant. Check that the API is running.";
        toast.error(message);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === replyId ? { ...m, content: message, error: true } : m,
          ),
        );
      } finally {
        abortRef.current = null;
        setStreaming(false);
        inputRef.current?.focus();
      }
    },
    [messages, sessionId, streaming],
  );

  function stop() {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
  }

  function reset() {
    stop();
    setMessages([]);
    setSessionId(newId());
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <div>
            <h2 className="font-heading text-sm font-medium leading-tight">
              {BRAND.productName}
            </h2>
            <p className="text-xs text-muted-foreground">{BRAND.tagline}</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={reset}>
            <Eraser /> New chat
          </Button>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 sm:px-6"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
            <span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
              <Bot className="size-5" />
            </span>
            <div className="max-w-sm">
              <h3 className="font-heading text-lg font-semibold tracking-tight">
                Ask about the exchange
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground text-pretty">
                Listings, indices, turnover, trading rules — start with a
                question or pick a prompt below.
              </p>
            </div>
            <div className="flex w-full max-w-md flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-lg bg-card px-3 py-2 text-left text-sm ring-1 ring-foreground/10 transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-2xl flex-col gap-5">
            {messages.map((m) => (
              <Message key={m.id} message={m} streaming={streaming} />
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t px-4 py-3 sm:px-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="mx-auto flex max-w-2xl items-end gap-2"
        >
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Ask about a listing, index, or trading rule…"
            className="max-h-40 min-h-10 py-2"
          />
          {streaming ? (
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={stop}
              aria-label="Stop generating"
            >
              <Square />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim()}
              aria-label="Send message"
            >
              <ArrowUp />
            </Button>
          )}
        </form>
        <p className="mx-auto mt-2 max-w-2xl text-center text-xs text-muted-foreground">
          Informational only — not investment advice. Verify figures against
          official exchange filings.
        </p>
      </div>
    </div>
  );
}

function Message({
  message,
  streaming,
}: {
  message: Bubble;
  streaming: boolean;
}) {
  const isUser = message.role === "user";
  const pending = !isUser && !message.content && streaming;

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground",
        )}
      >
        {isUser ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
      </span>
      <div
        className={cn(
          "max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap",
          isUser && "bg-primary text-primary-foreground",
          !isUser && !message.error && "bg-card ring-1 ring-foreground/10",
          message.error && "bg-destructive/10 text-destructive",
        )}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ) : (
          message.content
        )}
      </div>
    </div>
  );
}
