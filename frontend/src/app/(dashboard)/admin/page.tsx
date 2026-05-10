"use client";

import { useState, useEffect, useCallback } from "react";
import { adminApi } from "@/lib/api";
import { StatsCard } from "@/components/admin/StatsCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Users, MessageSquare, Activity, Heart, MoreVertical, Ban, CheckCircle, Shield } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  last_seen: string;
}

interface Stats {
  total_users: number;
  active_sessions: number;
  total_chats: number;
  system_health: string;
}

interface Activity {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details: string;
}

function formatRelative(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function AdminPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, usersData, activityData] = await Promise.all([
        adminApi.getStats(),
        adminApi.getUsers(),
        adminApi.getActivity(),
      ]);
      setStats(statsData);
      setUsers(usersData);
      setActivity(activityData);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load data";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setActionLoading(userId);
    try {
      await adminApi.updateUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      toast({ title: "Role updated", variant: "success" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update role";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    setActionLoading(userId);
    try {
      await adminApi.updateUserStatus(userId, newStatus);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u)));
      toast({ title: "Status updated", variant: "success" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update status";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 bg-warm-white min-h-full">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-warm-white min-h-full">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-dusty-grape">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">System overview and user management</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Users"
            value={stats?.total_users ?? 0}
            icon={<Users className="w-6 h-6 text-white" />}
            accentColor="bg-pearl-aqua"
          />
          <StatsCard
            title="Active Sessions"
            value={stats?.active_sessions ?? 0}
            icon={<Activity className="w-6 h-6 text-white" />}
            accentColor="bg-dusty-grape"
          />
          <StatsCard
            title="Total Chats"
            value={stats?.total_chats ?? 0}
            icon={<MessageSquare className="w-6 h-6 text-white" />}
            accentColor="bg-banana-cream"
          />
          <StatsCard
            title="System Health"
            value={stats?.system_health ?? "unknown"}
            icon={<Heart className="w-6 h-6 text-white" />}
            accentColor="bg-pink-mist"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <h2 className="text-lg font-semibold mb-4 text-dusty-grape">Users</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "admin" ? "grape" : "default"}>{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === "active" ? "banana" : "destructive"}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatRelative(user.last_seen)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={actionLoading === user.id}>
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleRoleChange(user.id, user.role === "admin" ? "user" : "admin")}
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            Make {user.role === "admin" ? "User" : "Admin"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(user.id, user.status === "active" ? "inactive" : "active")}
                            className={user.status === "active" ? "text-tomato" : "text-green-600"}
                          >
                            {user.status === "active" ? (
                              <Ban className="mr-2 h-4 w-4" />
                            ) : (
                              <CheckCircle className="mr-2 h-4 w-4" />
                            )}
                            {user.status === "active" ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4 text-dusty-grape">Recent Activity</h2>
            <div className="bg-white rounded-xl shadow-sm border p-4 space-y-4 max-h-[600px] overflow-y-auto">
              {activity.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">No recent activity</p>
              ) : (
                activity.map((item) => (
                  <div key={item.id} className="flex gap-3 pb-3 border-b last:border-0 last:pb-0">
                    <div className="w-2 h-2 rounded-full bg-pearl-aqua mt-2 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.action}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.details}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatRelative(item.timestamp)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
