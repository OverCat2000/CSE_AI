import { getToken, type User } from "@/lib/auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.detail || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export type Role = "user" | "admin";

export interface AdminUser {
  id: number;
  email: string;
  user_name: string;
  role: Role;
  is_active: boolean;
  is_online: boolean;
  created_at: string;
  last_seen: string | null;
}

export interface PaginationMeta {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PaginatedUsers {
  data: AdminUser[];
  meta: PaginationMeta;
}

export interface UserStats {
  total: number;
  active: number;
  admins: number;
  online: number;
}

export interface UserQuery {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: boolean;
}

export const authApi = {
  register: (user_name: string, email: string, password: string, confirm_password: string) =>
    request<{ id: number; email: string; user_name: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ user_name, email, password, confirm_password }),
    }),
  login: (email: string, password: string) =>
    request<{ access_token: string; refresh_token: string; token_type: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<User>("/auth/me"),
};

export type ChatRole = "system" | "user" | "assistant" | "tool";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

/** Label echoed back by the API. The actual model is resolved server-side. */
export const CHAT_MODEL = "cse-agent";

interface StreamOptions {
  messages: ChatMessage[];
  sessionId: string;
  userId?: string;
  signal?: AbortSignal;
  onDelta: (delta: string) => void;
}

/**
 * Streams a completion from `POST /chat/completions`, which speaks an
 * OpenAI-shaped SSE dialect: `data: {chunk}` frames terminated by `data: [DONE]`.
 * Resolves once the stream closes.
 */
async function streamCompletion({
  messages,
  sessionId,
  userId,
  signal,
  onDelta,
}: StreamOptions): Promise<void> {
  const res = await fetch(`${API_BASE}/chat/completions`, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      "X-Session-ID": sessionId,
      ...(userId ? { "X-User-ID": userId } : {}),
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      message: messages,
      metadata: { stream: true, session_id: sessionId },
    }),
  });

  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.detail || res.statusText);
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;

    // Frames are separated by a blank line; keep any partial tail buffered.
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";

    for (const frame of frames) {
      const line = frame.trim();
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (payload === "[DONE]") return;
      try {
        const chunk = JSON.parse(payload);
        const delta: string | null = chunk.choices?.[0]?.delta?.content ?? null;
        if (delta) onDelta(delta);
      } catch {
        // Ignore malformed frames rather than killing the stream.
      }
    }
  }
}

export const chatApi = { stream: streamCompletion };

export const adminApi = {
  listUsers: (query: UserQuery = {}) => {
    const params = new URLSearchParams();
    if (query.page) params.set("page", String(query.page));
    if (query.page_size) params.set("page_size", String(query.page_size));
    if (query.search) params.set("search", query.search);
    if (query.is_active !== undefined) params.set("is_active", String(query.is_active));
    return request<PaginatedUsers>(`/admin/users?${params.toString()}`);
  },
  stats: () => request<UserStats>("/admin/stats"),
  activate: (id: number) => request<AdminUser>(`/admin/users/${id}/activate`, { method: "PATCH" }),
  deactivate: (id: number) => request<AdminUser>(`/admin/users/${id}/deactivate`, { method: "PATCH" }),
  updateRole: (id: number, role: Role) =>
    request<AdminUser>(`/admin/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),
};
