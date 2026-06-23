"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Card from "@/components/ui/Card";
import StatCard from "@/components/ui/StatCard";

type SourceCount = {
  source: string;
  label: string;
  count: number;
};

type Entry = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  source: string;
  source_label: string;
  created_at: string;
};

type Data = {
  entries: Entry[];
  total: number;
  uniquePeople: number;
  sources: SourceCount[];
};

const thStyle: React.CSSProperties = {
  padding: "10px 16px 10px 0",
  textAlign: "left",
  fontSize: "11px",
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "var(--parchment-muted)",
};

function fullName(e: Entry): string {
  const name = [e.first_name, e.last_name].filter(Boolean).join(" ").trim();
  return name || "—";
}

export default function TripWaitlistPage() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/trip-waitlist")
      .then((r) => r.json())
      .then((d) => {
        setData({
          entries: d.entries ?? [],
          total: d.total ?? 0,
          uniquePeople: d.uniquePeople ?? 0,
          sources: d.sources ?? [],
        });
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <div style={{
          width: 32, height: 32,
          border: "2px solid var(--terracotta)",
          borderTopColor: "transparent",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  function exportCsv() {
    if (!data) return;
    const header = ["First name", "Last name", "Email", "Source", "Date"];
    const rows = data.entries.map((e) => [
      e.first_name ?? "",
      e.last_name ?? "",
      e.email,
      e.source_label,
      new Date(e.created_at).toISOString(),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "trip-waitlist.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ maxWidth: 960 }}>
      <PageHeader
        title="Trip Waitlist"
        subtitle={`${data.total} signups · ${data.uniquePeople} ${data.uniquePeople === 1 ? "person" : "people"} from the Girls Trips page`}
        badge="WashedUp × RoamCircle"
        badgeColor="terracotta"
        action={
          data.entries.length > 0 ? (
            <button
              onClick={exportCsv}
              style={{
                fontSize: "12px",
                fontWeight: 500,
                color: "var(--terracotta)",
                background: "rgba(217,119,70,0.1)",
                border: "1px solid rgba(217,119,70,0.25)",
                borderRadius: "8px",
                padding: "7px 14px",
                cursor: "pointer",
              }}
            >
              Export CSV
            </button>
          ) : undefined
        }
      />

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "28px" }}>
        <StatCard label="Total Signups" value={data.total} />
        <StatCard label="Unique People" value={data.uniquePeople} />
        {data.sources.length > 0 && <StatCard label="Top Source" value={data.sources[0].label} />}
      </div>

      {/* By source breakdown */}
      {data.sources.length > 0 && (
        <div style={{ marginBottom: "28px" }}>
          <Card title="By Source">
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {data.sources.map((s) => {
                const pct = data.total > 0 ? Math.round((s.count / data.total) * 100) : 0;
                return (
                  <div key={s.source} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--parchment)" }}>{s.label}</span>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--terracotta)" }}>
                          {s.count}{" "}
                          <span style={{ fontSize: "11px", color: "var(--parchment-dim)", fontWeight: 400 }}>({pct}%)</span>
                        </span>
                      </div>
                      <div style={{ height: "6px", background: "var(--bg-elevated)", borderRadius: "20px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: "var(--terracotta)", borderRadius: "20px", transition: "width 0.3s ease" }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Full signups list */}
      <Card title="All Signups">
        {data.entries.length === 0 ? (
          <div style={{ padding: "24px 0", fontSize: "14px", color: "var(--parchment-dim)" }}>
            No signups yet — they&apos;ll appear here as people join the list from the Girls Trips page.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: "13px", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Source</th>
                  <th style={{ ...thStyle, paddingRight: 0 }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.entries.map((e) => (
                  <tr key={e.id} style={{ borderBottom: "1px solid var(--border)" }}
                    onMouseEnter={(ev) => { ev.currentTarget.style.background = "var(--bg-elevated)"; }}
                    onMouseLeave={(ev) => { ev.currentTarget.style.background = "transparent"; }}
                  >
                    <td style={{ padding: "10px 16px 10px 0", fontWeight: 600, color: "var(--parchment)" }}>{fullName(e)}</td>
                    <td style={{ padding: "10px 16px 10px 0", color: "var(--parchment-dim)" }}>{e.email}</td>
                    <td style={{ padding: "10px 16px 10px 0", color: "var(--parchment-dim)" }}>{e.source_label}</td>
                    <td style={{ padding: "10px 0", color: "var(--parchment-muted)", fontSize: "11px" }}>
                      {new Date(e.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/Los_Angeles" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
