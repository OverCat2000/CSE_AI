import { getToken, removeToken } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    removeToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new ApiError(401, "Unauthorized");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message = errorData?.detail || errorData?.message || `API error: ${response.status}`;
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export function requestStream(
  endpoint: string,
  body: Record<string, unknown>,
  onChunk: (chunk: string) => void,
  onDone?: () => void,
  onError?: (error: Error) => void,
) {
  const token = getToken();
  const controller = new AbortController();

  (async () => {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || `Stream error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              onDone?.();
              return;
            }
            try {
              const parsed = JSON.parse(data);
              onChunk(parsed.content || parsed.text || parsed.delta || "");
            } catch {
              onChunk(data);
            }
          }
        }
      }
      onDone?.();
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      onError?.(error as Error);
    }
  })();

  return { abort: () => controller.abort() };
}

export const authApi = {
  login: (email: string, password: string) =>
    request<{ access_token: string; token_type: string; user: import("@/lib/auth").User }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
    ),
  // register: (name: string, email: string, password: string) =>
  //   request<{ access_token: string; token_type: string; user: import("@/lib/auth").User }>(
  //     "/auth/register",
  //     {
  //       method: "POST",
  //       body: JSON.stringify({ name, email, password }),
  //     },
  //   ),
  register: (name: string, email: string, password: string, confirmPassword: string) =>
    request<{ id: number; email: string; user_name: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ user_name: name, email, password, confirm_password: confirmPassword }),
    }),
  logout: () => request<void>("/auth/logout", { method: "POST" }),
  refreshToken: () => request<{ access_token: string }>("/auth/refresh", { method: "POST" }),
  getMe: () => request<import("@/lib/auth").User>("/auth/me"),
};

export const chatApi = {
  getSessions: () =>
    request<Array<{ id: string; title: string; created_at: string; updated_at: string }>>(
      "/chat/sessions",
    ),
  getSession: (sessionId: string) =>
    request<{
      id: string;
      title: string;
      messages: Array<{ id: string; role: string; content: string; created_at: string }>;
    }>(`/chat/sessions/${sessionId}`),
  createSession: (title?: string) =>
    request<{ id: string; title: string }>(
      `/chat/sessions${title ? `?title=${encodeURIComponent(title)}` : ""}`,
      { method: "POST" },
    ),
  deleteSession: (sessionId: string) =>
    request<void>(`/chat/sessions/${sessionId}`, { method: "DELETE" }),
  sendMessage: (sessionId: string, message: string) =>
    request<{ id: string; content: string; role: string }>(`/chat/sessions/${sessionId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content: message }),
    }),
};

export const promptsApi = {
  getAll: () =>
    request<
      Array<{
        id: string;
        title: string;
        content: string;
        tags: string[];
        created_at: string;
        updated_at: string;
      }>
    >("/prompts"),
  getById: (id: string) =>
    request<{
      id: string;
      title: string;
      content: string;
      tags: string[];
      created_at: string;
      updated_at: string;
    }>(`/prompts/${id}`),
  create: (data: { title: string; content: string; tags: string[] }) =>
    request<{ id: string; title: string; content: string; tags: string[] }>("/prompts", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: { title: string; content: string; tags: string[] }) =>
    request<{ id: string; title: string; content: string; tags: string[] }>(`/prompts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) => request<void>(`/prompts/${id}`, { method: "DELETE" }),
};

export const adminApi = {
  getStats: () =>
    request<{
      total_users: number;
      active_sessions: number;
      total_chats: number;
      system_health: string;
    }>("/admin/stats"),
  getUsers: () =>
    request<
      Array<{
        id: string;
        name: string;
        email: string;
        role: string;
        status: string;
        last_seen: string;
      }>
    >("/admin/users"),
  updateUserRole: (userId: string, role: string) =>
    request<void>(`/admin/users/${userId}/role`, { method: "PUT", body: JSON.stringify({ role }) }),
  updateUserStatus: (userId: string, status: string) =>
    request<void>(`/admin/users/${userId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),
  getActivity: () =>
    request<
      Array<{ id: string; action: string; user: string; timestamp: string; details: string }>
    >("/admin/activity"),
};

export default request;
