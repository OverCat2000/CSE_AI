"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut, Shield } from "lucide-react";

import { authApi } from "@/lib/api";
import { getToken, getUser, setUser, removeToken, type User } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function AuthNav() {
  const [user, setUserState] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      if (!getToken()) {
        setReady(true);
        return;
      }
      let current = getUser();
      if (!current) {
        try {
          current = await authApi.me();
          setUser(current);
        } catch {
          removeToken();
          current = null;
        }
      }
      setUserState(current);
      setReady(true);
    }
    init();
  }, []);

  function signOut() {
    removeToken();
    setUserState(null);
  }

  if (!ready) return null;

  if (!user) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link href="/login">Sign in</Link>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {user.role === "admin" && (
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin">
            <Shield /> Admin
          </Link>
        </Button>
      )}
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
          {user.user_name.charAt(0).toUpperCase()}
        </span>
        <div className="hidden text-sm leading-tight sm:block">
          <div className="font-medium">{user.user_name}</div>
          <div className="text-xs text-muted-foreground">{user.email}</div>
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={signOut}>
        <LogOut /> Sign out
      </Button>
    </div>
  );
}
