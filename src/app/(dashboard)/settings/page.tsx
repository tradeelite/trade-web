"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { QUERY_KEYS } from "@/lib/constants";
import { toast } from "sonner";
import { Trash2, Plus, UserCheck } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [newEmail, setNewEmail] = useState("");
  const { user } = useAuth();

  const { data: currentUser } = useQuery({
    queryKey: ["users", "me", user?.email],
    queryFn: () =>
      fetch("/api/users/me", { headers: { "x-user-email": user?.email ?? "" } }).then((r) =>
        r.ok ? r.json() : { is_admin: false }
      ),
    enabled: Boolean(user?.email),
  });
  const isAdmin = Boolean(currentUser?.is_admin);

  const { data: settings, isLoading } = useQuery({
    queryKey: QUERY_KEYS.settings(),
    queryFn: () => fetch("/api/settings").then((r) => r.json()),
  });

  const { data: allowedUsers, isLoading: usersLoading } = useQuery({
    queryKey: QUERY_KEYS.allowedUsers(),
    queryFn: () => fetch("/api/users").then((r) => (r.ok ? r.json() : [])),
    enabled: isAdmin,
  });

  const updateSetting = useMutation({
    mutationFn: (data: { key: string; value: string }) =>
      fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settings() });
      if (variables.key === "data_provider") {
        queryClient.invalidateQueries({ queryKey: ["stocks"] });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.portfolios() });
      }
      toast.success("Setting updated");
    },
    onError: () => toast.error("Failed to update setting"),
  });

  const addUser = useMutation({
    mutationFn: (email: string) =>
      fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allowedUsers() });
      setNewEmail("");
      toast.success("User added");
    },
    onError: () => toast.error("Failed to add user"),
  });

  const removeUser = useMutation({
    mutationFn: (email: string) =>
      fetch(`/api/users/${encodeURIComponent(email)}`, {
        method: "DELETE",
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allowedUsers() });
      toast.success("User removed");
    },
    onError: () => toast.error("Failed to remove user"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure your trading app</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Provider</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Stock Data Source</Label>
            <p className="mb-2 text-sm text-muted-foreground">
              Choose which API to use for stock data. Yahoo Finance requires no
              API key. Twelve Data requires an API key set in environment variables.
            </p>
            {isLoading ? (
              <Skeleton className="h-10 w-60" />
            ) : (
              <Select
                value={settings?.data_provider || "yahoo"}
                disabled={!isAdmin}
                onValueChange={(v) =>
                  updateSetting.mutate({ key: "data_provider", value: v })
                }
              >
                <SelectTrigger className="w-60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yahoo">Yahoo Finance</SelectItem>
                  <SelectItem value="twelvedata">Twelve Data</SelectItem>
                </SelectContent>
              </Select>
            )}
            {!isAdmin && (
              <p className="mt-2 text-xs text-muted-foreground">
                Data provider is a global setting and can only be changed by the admin user.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {isAdmin ? (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Allowed Users
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Only these Google accounts can sign in. The admin account set via{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">ALLOWED_EMAIL</code>{" "}
            env var always has access.
          </p>

          <div className="flex gap-2">
            <Input
              placeholder="user@gmail.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newEmail) addUser.mutate(newEmail);
              }}
              className="max-w-sm"
            />
            <Button
              onClick={() => addUser.mutate(newEmail)}
              disabled={!newEmail || addUser.isPending}
              size="sm"
            >
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </div>

          {usersLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-9 w-full max-w-sm" />
              <Skeleton className="h-9 w-full max-w-sm" />
            </div>
          ) : allowedUsers && allowedUsers.length > 0 ? (
            <ul className="space-y-2">
              {allowedUsers.map((u: { email: string; added_at: string }) => (
                <li
                  key={u.email}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 max-w-sm"
                >
                  <span className="text-sm">{u.email}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeUser.mutate(u.email)}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No additional users. Only the admin account can sign in.
            </p>
          )}
        </CardContent>
      </Card>
      ) : (
      <Card>
        <CardHeader>
          <CardTitle>Account Scope</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You are signed in as a regular/demo user. User management and global app settings are admin-only.
          </p>
        </CardContent>
      </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">TradeView</span> —
              Personal trading dashboard for stocks, ETFs, and options.
            </p>
            <p>
              Built with Next.js, shadcn/ui, TanStack Query, and lightweight-charts.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
