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

const STATUS_COLORS: Record<string, string> = {
  forming: "bg-[#E3F2FD] text-[#1565C0]",
  active: "bg-[#E8F5E9] text-[#2E7D32]",
  full: "bg-[#FFF3E0] text-[#E65100]",
  completed: "bg-[#F0EBE3] text-[#666]",
  cancelled: "bg-[#FFEBEE] text-[#C62828]",
  draft: "bg-[#F5F3F0] text-[#999]",
};

function PlanTable({ plans }: { plans: Plan[] }) {
  if (plans.length === 0) {
    return <p className="text-sm text-[#999] py-4 px-4">No plans in this section.</p>;
  }

  return (
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
          {plans.map((p) => (
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
                <span className="text-[#999]">/{(p.max_invites ?? 6) + 1}</span>
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
  );
}

function SectionHeader({
  title,
  count,
  color,
  dot,
}: {
  title: string;
  count: number;
  color: string;
  dot: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className={`w-2 h-2 rounded-full ${dot}`} />
      <h2 className={`text-base font-bold ${color}`}>{title}</h2>
      <span className="text-sm font-medium text-[#999]">({count})</span>
    </div>
  );
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pastExpanded, setPastExpanded] = useState(false);

  useEffect(() => {
    fetch("/api/admin/plans")
      .then((r) => r.json())
      .then((d) => setPlans(d.plans ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const { live, drafts, past } = useMemo(() => {
    const q = search.toLowerCase();

    const matches = (p: Plan) =>
      !q ||
      p.title?.toLowerCase().includes(q) ||
      p.creator_name?.toLowerCase().includes(q) ||
      p.location_text?.toLowerCase().includes(q);

    const liveStatuses = new Set(["forming", "active", "full"]);
    const pastStatuses = new Set(["completed", "cancelled"]);

    const live = plans
      .filter((p) => liveStatuses.has(p.status) && matches(p))
      .sort((a, b) => {
        if (!a.start_time) return 1;
        if (!b.start_time) return -1;
        return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
      });

    const drafts = plans
      .filter((p) => p.status === "draft" && matches(p))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const past = plans
      .filter((p) => pastStatuses.has(p.status) && matches(p))
      .sort((a, b) => {
        if (!a.start_time) return 1;
        if (!b.start_time) return -1;
        return new Date(b.start_time).getTime() - new Date(a.start_time).getTime();
      });

    return { live, drafts, past };
  }, [plans, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#D97746] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#1E1E1E]">Plans</h1>
        <span className="text-sm text-[#999]">{plans.length} total</span>
      </div>

      <input
        type="text"
        placeholder="Search by title, creator, or location..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border border-[#E8E3DC] rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-[#D97746]/30 focus:border-[#D97746] bg-white"
      />

      {/* Live & Upcoming */}
      <div className="bg-white rounded-2xl border border-[#E8E3DC] overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <SectionHeader
            title="Live & Upcoming"
            count={live.length}
            color="text-[#1E1E1E]"
            dot="bg-[#2E7D32]"
          />
        </div>
        <PlanTable plans={live} />
      </div>

      {/* Drafts */}
      <div className="bg-white rounded-2xl border border-[#E8E3DC] overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <SectionHeader
            title="Drafts"
            count={drafts.length}
            color="text-[#666]"
            dot="bg-[#999]"
          />
        </div>
        <PlanTable plans={drafts} />
      </div>

      {/* Past (collapsed by default) */}
      <div className="bg-white rounded-2xl border border-[#E8E3DC] overflow-hidden">
        <button
          onClick={() => setPastExpanded((v) => !v)}
          className="w-full px-4 pt-4 pb-4 flex items-center gap-2 text-left hover:bg-[#FBF9F6] transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-[#E8E3DC]" />
          <span className="text-base font-bold text-[#999]">Past</span>
          <span className="text-sm font-medium text-[#bbb]">({past.length})</span>
          <span className="ml-auto text-xs text-[#bbb]">{pastExpanded ? "▲ hide" : "▼ show"}</span>
        </button>
        {pastExpanded && <PlanTable plans={past} />}
      </div>
    </div>
  );
}
