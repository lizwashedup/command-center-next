"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Card from "@/components/ui/Card";
import StatCard from "@/components/ui/StatCard";

type WtlCity = {
  city: string;
  count: number;
};

type WtlEntry = {
  id: string;
  city_name: string;
  user_email: string | null;
  created_at: string;
};

type WtlData = {
  cities: WtlCity[];
  total: number;
  entries: WtlEntry[];
};

const thStyle: React.CSSProperties = {
  padding: '10px 16px 10px 0',
  textAlign: 'left',
  fontSize: '11px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--parchment-muted)',
};

export default function WtlCitiesPage() {
  const [data, setData] = useState<WtlData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/wtl-cities")
      .then((r) => r.json())
      .then((d) => {
        setData({ cities: d.cities ?? [], total: d.total ?? 0, entries: d.entries ?? [] });
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{
          width: 32, height: 32,
          border: '2px solid var(--terracotta)',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 960 }}>
      <PageHeader
        title="WTL Cities"
        subtitle={`${data.total} signups across ${data.cities.length} ${data.cities.length === 1 ? "city" : "cities"}`}
        badge={`${data.cities.length} cities`}
        badgeColor="terracotta"
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
        <StatCard label="Total Signups" value={data.total} />
        <StatCard label="Cities" value={data.cities.length} />
        {data.cities.length > 0 && <StatCard label="Top City" value={data.cities[0].city} />}
      </div>

      {/* City cards grid */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--parchment-muted)', marginBottom: '12px' }}>
          By City
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '12px' }}>
          {data.cities.map((c) => (
            <div key={c.city} style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '20px 24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}>
              <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '32px', fontWeight: 700, color: 'var(--terracotta)', lineHeight: 1.1 }}>
                {c.count}
              </span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--parchment)' }}>{c.city}</span>
              <span style={{ fontSize: '11px', color: 'var(--parchment-dim)' }}>
                {c.count === 1 ? "person" : "people"} waiting
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Top city bar chart */}
      {data.cities.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <Card title="Top Interest">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {data.cities.slice(0, 5).map((c, i) => {
                const pct = data.total > 0 ? Math.round((c.count / data.total) * 100) : 0;
                return (
                  <div key={c.city} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--parchment-dim)', width: '16px', textAlign: 'right' }}>{i + 1}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--parchment)' }}>{c.city}</span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--terracotta)' }}>
                          {c.count}{" "}
                          <span style={{ fontSize: '11px', color: 'var(--parchment-dim)', fontWeight: 400 }}>({pct}%)</span>
                        </span>
                      </div>
                      <div style={{ height: '6px', background: 'var(--bg-elevated)', borderRadius: '20px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--terracotta)', borderRadius: '20px', transition: 'width 0.3s ease' }} />
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
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                <th style={thStyle}>City</th>
                <th style={thStyle}>Email</th>
                <th style={{ ...thStyle, paddingRight: 0 }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.entries.map((e) => (
                <tr key={e.id} style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={(ev) => { ev.currentTarget.style.background = 'var(--bg-elevated)'; }}
                  onMouseLeave={(ev) => { ev.currentTarget.style.background = 'transparent'; }}
                >
                  <td style={{ padding: '10px 16px 10px 0', fontWeight: 600, color: 'var(--parchment)' }}>{e.city_name}</td>
                  <td style={{ padding: '10px 16px 10px 0', color: 'var(--parchment-dim)' }}>{e.user_email || "—"}</td>
                  <td style={{ padding: '10px 0', color: 'var(--parchment-muted)', fontSize: '11px' }}>
                    {new Date(e.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/Los_Angeles" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
