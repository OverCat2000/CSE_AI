"use client";

import { useState, useEffect } from "react";
import { chatApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";

interface Session {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface SessionListProps {
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onDeleteSession?: (id: string) => void;
}

function groupSessionsByDate(sessions: Session[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;
  const weekAgo = today - 7 * 86400000;

  const groups: { label: string; sessions: Session[] }[] = [
    { label: "Today", sessions: [] },
    { label: "Yesterday", sessions: [] },
    { label: "This Week", sessions: [] },
    { label: "Older", sessions: [] },
  ];

  sessions.forEach((s) => {
    const updated = new Date(s.updated_at).getTime();
    if (updated >= today) groups[0].sessions.push(s);
    else if (updated >= yesterday) groups[1].sessions.push(s);
    else if (updated >= weekAgo) groups[2].sessions.push(s);
    else groups[3].sessions.push(s);
  });

  return groups.filter((g) => g.sessions.length > 0);
}

export function SessionList({ activeSessionId, onSelectSession, onDeleteSession }: SessionListProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const data = await chatApi.getSessions();
      setSessions(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await chatApi.deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      onDeleteSession?.(id);
    } catch {
    }
  };

  const grouped = groupSessionsByDate(sessions);

  if (loading) {
    return (
      <div className="px-3 py-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="px-3 py-8 text-center text-sm text-white/50">
        No chat sessions yet
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
      {grouped.map((group) => (
        <div key={group.label}>
          <p className="text-xs font-medium text-white/50 uppercase tracking-wider px-2 mb-2">
            {group.label}
          </p>
          <div className="space-y-1">
            {group.sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-xl text-sm transition-colors flex items-center justify-between group",
                  activeSessionId === session.id
                    ? "bg-white/15 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                )}
              >
                <span className="truncate">{session.title || "Untitled Chat"}</span>
                {onDeleteSession && (
                  <button
                    onClick={(e) => handleDelete(session.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-white/50 hover:text-tomato transition-all p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </button>
            ))}
          </div>
          <Separator className="bg-white/10 my-3" />
        </div>
      ))}
    </div>
  );
}
