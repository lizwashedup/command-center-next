"use client";

import { useEffect, useState, useMemo } from "react";

type Message = {
  id: string;
  event_id: string;
  user_id: string;
  content: string | null;
  created_at: string;
  message_type: string;
  event_title: string;
  user_name: string;
};

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");

  useEffect(() => {
    fetch("/api/admin/messages")
      .then((r) => r.json())
      .then((d) => setMessages(d.messages ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const planOptions = useMemo(() => {
    const map = new Map<string, string>();
    messages.forEach((m) => map.set(m.event_id, m.event_title));
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [messages]);

  const filtered = useMemo(() => {
    let list = messages;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.content?.toLowerCase().includes(q) ||
          m.user_name.toLowerCase().includes(q) ||
          m.event_title.toLowerCase().includes(q)
      );
    }
    if (planFilter !== "all") {
      list = list.filter((m) => m.event_id === planFilter);
    }
    return list;
  }, [messages, search, planFilter]);

  const planStats = useMemo(() => {
    const map = new Map<string, { title: string; count: number; lastMsg: string }>();
    messages.forEach((m) => {
      const existing = map.get(m.event_id);
      if (!existing) {
        map.set(m.event_id, { title: m.event_title, count: 1, lastMsg: m.created_at });
      } else {
        existing.count++;
        if (m.created_at > existing.lastMsg) existing.lastMsg = m.created_at;
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [messages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#D97746] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
      <h1 className="text-xl font-bold text-[#1E1E1E]">Messages ({messages.length})</h1>

      <div className="bg-white rounded-2xl border border-[#E8E3DC] p-6">
        <h2 className="text-sm font-bold text-[#1E1E1E] mb-3">Most Active Chats</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {planStats.slice(0, 6).map((ps) => (
            <div key={ps.title} className="flex items-center justify-between py-2 px-3 border border-[#F0EBE3] rounded-lg">
              <p className="text-sm text-[#1E1E1E] truncate mr-2">{ps.title}</p>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-[#D97746]">{ps.count}</p>
                <p className="text-[10px] text-[#999]">msgs</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search messages, users, or plans..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-[#E8E3DC] rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-[#D97746]/30 focus:border-[#D97746] bg-white"
        />
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="border border-[#E8E3DC] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D97746]/30 max-w-[250px]"
        >
          <option value="all">All Plans</option>
          {planOptions.map(([id, title]) => (
            <option key={id} value={id}>{title}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-[#E8E3DC] overflow-hidden">
        <div className="divide-y divide-[#F0EBE3]">
          {filtered.slice(0, 200).map((m) => (
            <div key={m.id} className="px-4 py-3 hover:bg-[#FBF9F6]">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#1E1E1E]">{m.user_name}</span>
                  <span className="text-[10px] text-[#999]">in</span>
                  <span className="text-xs font-medium text-[#D97746] truncate max-w-[200px]">
                    {m.event_title}
                  </span>
                </div>
                <span className="text-[10px] text-[#999] shrink-0">
                  {new Date(m.created_at).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-sm text-[#666]">{m.content || "(no content)"}</p>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-[#999]">No messages found</div>
          )}
          {filtered.length > 200 && (
            <div className="px-4 py-3 text-center text-xs text-[#999]">
              Showing 200 of {filtered.length} messages
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
