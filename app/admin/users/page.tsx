"use client";

import { useEffect, useState, useMemo, useCallback } from "react";

type User = {
  id: string;
  created_at: string;
  first_name_display: string | null;
  profile_photo_url: string | null;
  bio: string | null;
  gender: string | null;
  onboarding_status: string | null;
  last_active_at: string | null;
  referral_source: string | null;
  phone_number: string | null;
  phone_verified: boolean | null;
};

type Filter = "all" | "complete" | "incomplete" | "has_photo" | "no_photo" | "active_7d";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sortBy, setSortBy] = useState<"created_at" | "last_active_at">("created_at");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const handleDelete = useCallback(async (userId: string) => {
    setDeletingId(userId);
    try {
      const res = await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete user");
      }
    } catch {
      alert("Failed to delete user");
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  }, []);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = users;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.first_name_display?.toLowerCase().includes(q) ||
          u.id.toLowerCase().includes(q) ||
          u.referral_source?.toLowerCase().includes(q)
      );
    }

    switch (filter) {
      case "complete":
        list = list.filter((u) => u.onboarding_status === "complete");
        break;
      case "incomplete":
        list = list.filter((u) => u.onboarding_status !== "complete");
        break;
      case "has_photo":
        list = list.filter((u) => u.profile_photo_url);
        break;
      case "no_photo":
        list = list.filter((u) => !u.profile_photo_url);
        break;
      case "active_7d": {
        const week = new Date(Date.now() - 7 * 86400000);
        list = list.filter((u) => u.last_active_at && new Date(u.last_active_at) >= week);
        break;
      }
    }

    list.sort((a, b) => {
      const aVal = a[sortBy] ?? "";
      const bVal = b[sortBy] ?? "";
      return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
    });

    return list;
  }, [users, search, filter, sortBy]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#D97746] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[#1E1E1E]">Users ({users.length})</h1>
        <span className="text-xs text-[#999]">Showing {filtered.length} results</span>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Search name, ID, or referral source..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-[#E8E3DC] rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-[#D97746]/30 focus:border-[#D97746] bg-white"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as Filter)}
          className="border border-[#E8E3DC] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D97746]/30"
        >
          <option value="all">All Users</option>
          <option value="complete">Onboarding Complete</option>
          <option value="incomplete">Incomplete Onboarding</option>
          <option value="has_photo">Has Photo</option>
          <option value="no_photo">No Photo</option>
          <option value="active_7d">Active (Last 7 Days)</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "created_at" | "last_active_at")}
          className="border border-[#E8E3DC] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D97746]/30"
        >
          <option value="created_at">Sort: Newest First</option>
          <option value="last_active_at">Sort: Recently Active</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-[#E8E3DC] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E8E3DC] text-left bg-[#FBF9F6]">
                <th className="py-3 px-4 text-[#999] font-medium text-xs">User</th>
                <th className="py-3 px-4 text-[#999] font-medium text-xs">Gender</th>
                <th className="py-3 px-4 text-[#999] font-medium text-xs">Status</th>
                <th className="py-3 px-4 text-[#999] font-medium text-xs">Signed Up</th>
                <th className="py-3 px-4 text-[#999] font-medium text-xs">Last Active</th>
                <th className="py-3 px-4 text-[#999] font-medium text-xs">Source</th>
                <th className="py-3 px-4 text-[#999] font-medium text-xs">SMS</th>
                <th className="py-3 px-4 text-[#999] font-medium text-xs w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-[#F0EBE3] hover:bg-[#FBF9F6]">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {u.profile_photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={u.profile_photo_url}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#F0EBE3] flex items-center justify-center text-[#999] text-xs font-bold shrink-0">
                          {u.first_name_display?.[0]?.toUpperCase() || "?"}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-[#1E1E1E] truncate">
                          {u.first_name_display || "No name"}
                        </p>
                        <p className="text-[10px] text-[#999] truncate">{u.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-[#666] capitalize">{u.gender || "—"}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${
                        u.onboarding_status === "complete"
                          ? "bg-[#E8F5E9] text-[#2E7D32]"
                          : "bg-[#FFF3E0] text-[#E65100]"
                      }`}
                    >
                      {u.onboarding_status === "complete" ? "Complete" : "Incomplete"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#666]">
                    {new Date(u.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="py-3 px-4 text-[#666]">
                    {u.last_active_at
                      ? new Date(u.last_active_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="py-3 px-4 text-[#666] truncate max-w-[120px]">
                    {u.referral_source || "—"}
                  </td>
                  <td className="py-3 px-4">
                    {u.phone_number && u.phone_verified ? (
                      <span className="text-[#2E7D32]">✓</span>
                    ) : (
                      <span className="text-[#999]">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {confirmId === u.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleDelete(u.id)}
                          disabled={deletingId === u.id}
                          className="text-xs font-bold text-white bg-[#C62828] px-2.5 py-1 rounded-md hover:bg-[#B71C1C] disabled:opacity-50 transition-colors"
                        >
                          {deletingId === u.id ? "..." : "Yes"}
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          className="text-xs font-medium text-[#666] px-2 py-1 rounded-md hover:bg-[#F0EBE3] transition-colors"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmId(u.id)}
                        className="text-xs font-medium text-[#C62828] px-2.5 py-1 rounded-md hover:bg-[#FFEBEE] transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
