"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Users,
  UserCheck,
  Shield,
  Wifi,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  adminApi,
  ApiError,
  type AdminUser,
  type UserStats,
  type PaginationMeta,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type StatusFilter = "all" | "active" | "inactive";

const PAGE_SIZE = 10;
const FILTERS: StatusFilter[] = ["all", "active", "inactive"];

const STAT_META = [
  { key: "total", label: "Total users", icon: Users },
  { key: "active", label: "Active", icon: UserCheck },
  { key: "admins", label: "Admins", icon: Shield },
  { key: "online", label: "Online", icon: Wifi },
] as const;

function errorMessage(e: unknown): string {
  return e instanceof ApiError ? e.message : "Something went wrong";
}

export function AdminDashboard() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const is_active = status === "all" ? undefined : status === "active";
      const [s, res] = await Promise.all([
        adminApi.stats(),
        adminApi.listUsers({ page, page_size: PAGE_SIZE, search: search || undefined, is_active }),
      ]);
      setStats(s);
      setUsers(res.data);
      setMeta(res.meta);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  async function run(action: Promise<unknown>, message: string, id: number) {
    setBusyId(id);
    try {
      await action;
      toast.success(message);
      await load();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-xl font-semibold">Admin panel</h1>
        <p className="text-sm text-muted-foreground">Manage users, roles, and access.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STAT_META.map(({ key, label, icon: Icon }) => (
          <Card key={key} size="sm">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-muted-foreground">{label}</CardTitle>
              <Icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="font-heading text-2xl font-semibold tabular-nums">
              {stats ? stats[key] : "—"}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search name or email"
            className="pl-8"
          />
        </div>
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <Button
              key={f}
              size="sm"
              variant={status === f ? "default" : "outline"}
              onClick={() => {
                setStatus(f);
                setPage(1);
              }}
              className="capitalize"
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">User</th>
                <th className="px-4 py-2.5 font-medium">Role</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Joined</th>
                <th className="px-4 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium">{u.user_name}</div>
                      <div className="text-muted-foreground">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.role === "admin" ? "default" : "secondary"} className="capitalize">
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={u.is_active ? "success" : "destructive"}>
                          {u.is_active ? "Active" : "Inactive"}
                        </Badge>
                        {u.is_online && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            online
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          size="xs"
                          variant="outline"
                          disabled={busyId === u.id}
                          onClick={() =>
                            run(
                              adminApi.updateRole(u.id, u.role === "admin" ? "user" : "admin"),
                              u.role === "admin" ? "Demoted to user" : "Promoted to admin",
                              u.id
                            )
                          }
                        >
                          {u.role === "admin" ? "Demote" : "Promote"}
                        </Button>
                        {u.is_active ? (
                          <Button
                            size="xs"
                            variant="destructive"
                            disabled={busyId === u.id}
                            onClick={() =>
                              run(adminApi.deactivate(u.id), "User deactivated", u.id)
                            }
                          >
                            Deactivate
                          </Button>
                        ) : (
                          <Button
                            size="xs"
                            variant="secondary"
                            disabled={busyId === u.id}
                            onClick={() => run(adminApi.activate(u.id), "User activated", u.id)}
                          >
                            Activate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {meta && meta.total_pages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {meta.page} of {meta.total_pages} · {meta.total} users
          </span>
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft /> Prev
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= meta.total_pages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
