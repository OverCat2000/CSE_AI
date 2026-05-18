const API_BASE = process.env.BACKEND_API_URL || "http://localhost:8000/api/v1";

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  return null as any;
}

export const authApi = {
  register: (user_name: string, email: string, password: string, confirm_password: string) =>
    request<{ id: number; email: string; user_name: string }>("", {}),
  login: (email: string, password: string) =>
    request<{ access_token: string; refresh_token: string; token_type: string }>("", {}),
};
