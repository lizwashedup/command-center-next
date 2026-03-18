"use client";

import { useEffect, useState, useMemo } from "react";

type Plan = {
  id: string;
  created_at: string;
  title: string;
  description: string | null;
  location_text: string | null;
  start_time: string | null;
  status: string;
  member_count: number;
  max_invites: number | null;
  primary_vibe: string | null;
  gender_rule: string | null;
  creator_user_id: string;
  creator_name: string;
};

type StatusFilter = "all" | "forming" | "active" | "full" | "completed" | "cancelled";

const STATUS_COLORS: Record<string, string> = {
  forming: "bg-[#E3F2FD] text-[#1565C0]",
  active: "bg-[#E8F5E9] text-[#2E7D32]",
  full: "bg-[#FFF3E0] text-[#E65100]",
  completed: "bg-[#F0EBE3] text-[#666]",
  cancelled: "bg-[#FFEBEE] text-[#C62828]",
};

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    fetch("/api/admin/plans")
      .then((r) => r.json())
      .then((d) => setPlans(d.plans ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = plans;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.creator_name?.toLowerCase().includes(q) ||
          p.location_text?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      list = list.filter((p) => p.status === statusFilter);
    }
    return list;
  }, [plans, search, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    plans.forEach((p) => {
      counts[p.status] = (counts[p.status] || 0) + 1;
    });
    return counts;
  }, [plans]);

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
        <h1 className="text-xl font-bold text-[#1E1E1E]">Plans ({plans.length})</h1>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {["all", "forming", "active", "full", "completed", "cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s as StatusFilter)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              statusFilter === s
                ? "bg-[#D97746] text-white"
                : "bg-white border border-[#E8E3DC] text-[#666] hover:bg-[#F0EBE3]"
            }`}
          >
            {s === "all" ? `All (${plans.length})` : `${s.charAt(0).toUpperCase() + s.slice(1)} (${statusCounts[s] || 0})`}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by title, creator, or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-[#E8E3DC] rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-[#D97746]/30 focus:border-[#D97746] bg-white"
        />
      </div>

      <div className="bg-white rounded-2xl border border-[#E8E3DC] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E8E3DC] text-left bg-[#FBF9F6]">
                <th className="py-3 px-4 text-[#999] font-medium text-xs">Plan</th>
                <th className="py-3 px-4 text-[#999] font-medium text-xs">Creator</th>
                <th className="py-3 px-4 text-[#999] font-medium text-xs">Status</th>
                <th className="py-3 px-4 text-[#999] font-medium text-xs">Members</th>
                <th className="py-3 px-4 text-[#999] font-medium text-xs">Vibe</th>
                <th className="py-3 px-4 text-[#999] font-medium text-xs">Date</th>
                <th className="py-3 px-4 text-[#999] font-medium text-xs">Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-[#F0EBE3] hover:bg-[#FBF9F6]">
                  <td className="py-3 px-4">
                    <div className="min-w-0">
                      <p className="font-medium text-[#1E1E1E] truncate max-w-[250px]">{p.title}</p>
                      {p.location_text && (
                        <p className="text-[10px] text-[#999] truncate max-w-[250px]">{p.location_text}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-[#666]">{p.creator_name}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${
                        STATUS_COLORS[p.status] || "bg-[#F0EBE3] text-[#666]"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-[#D97746]">{p.member_count}</span>
                    <span className="text-[#999]">/{(p.max_invites ?? 7) + 1}</span>
                  </td>
                  <td className="py-3 px-4 text-[#666] capitalize">{p.primary_vibe || "—"}</td>
                  <td className="py-3 px-4 text-[#666]">
                    {p.start_time
                      ? new Date(p.start_time).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                  <td className="py-3 px-4 text-[#666]">
                    {new Date(p.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
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
