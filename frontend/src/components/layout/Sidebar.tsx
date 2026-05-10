"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getUser, removeToken, isAdmin } from "@/lib/auth";
import { authApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageSquare,
  FileText,
  Shield,
  Plus,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "next-themes";

const navItems = [
  { href: "/chat", icon: MessageSquare, label: "Chat" },
  { href: "/prompts", icon: FileText, label: "Prompts" },
];

const adminItem = { href: "/admin", icon: Shield, label: "Admin" };

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = getUser();
  const showAdmin = isAdmin();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
    } finally {
      removeToken();
      document.cookie = "auth_token=; path=/; max-age=0";
      document.cookie = "user_role=; path=/; max-age=0";
      toast({ title: "Logged out", variant: "success" });
      router.push("/login");
      router.refresh();
    }
  };

  const handleNewChat = () => {
    router.push("/chat");
    setMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-pearl-aqua/20 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-pearl-aqua" />
          </div>
          <span className="font-semibold text-white">AI Chatbot</span>
        </div>
        <button onClick={() => setMobileOpen(false)} className="md:hidden text-white/70 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="px-3 pb-3">
        <Button onClick={handleNewChat} variant="secondary" className="w-full justify-start gap-2 bg-white/10 hover:bg-white/20 text-white rounded-xl">
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
      </div>

      <Separator className="bg-white/10" />

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
        {showAdmin && (
          <Link
            href={adminItem.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              pathname === adminItem.href
                ? "bg-banana-cream/20 text-banana-cream"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <adminItem.icon className="w-5 h-5" />
            {adminItem.label}
          </Link>
        )}
      </nav>

      <div className="p-3 space-y-2">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white w-full transition-colors"
        >
          {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>

        <Separator className="bg-white/10" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 w-full transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar_url} />
                <AvatarFallback className="bg-pearl-aqua/30 text-white text-xs">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="text-left flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name || "User"}</p>
                <p className="text-xs text-white/50 truncate">{user?.email || ""}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={handleLogout} className="text-tomato">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-dusty-grape text-white shadow-md"
      >
        <Menu className="w-5 h-5" />
      </button>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-dusty-grape shadow-xl z-50">
            {sidebarContent}
          </aside>
        </div>
      )}

      <aside className="hidden md:flex md:flex-col md:w-64 bg-dusty-grape shadow-lg">
        {sidebarContent}
      </aside>
    </>
  );
}
