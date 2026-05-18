export interface User {
  id: string;
  email: string;
  user_name: string;
  role: "user" | "admin";
}

export function setToken(token: string): void {}
export function getToken(): string | null {
  return null;
}
export function removeToken(): void {}
export function setUser(user: User): void {}
export function isAuthenticated(): boolean {
  return false;
}
