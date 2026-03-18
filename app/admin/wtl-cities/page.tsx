"use client";

import { useEffect, useState } from "react";

type WtlCity = {
  city: string;
  count: number;
};

type WtlData = {
  cities: WtlCity[];
  total: number;
};

export default function WtlCitiesPage() {
  const [data, setData] = useState<WtlData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/wtl-cities")
      .then((r) => r.json())
      .then((d) => {
        setData({ cities: d.cities ?? [], total: d.total ?? 0 });
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#D97746] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-[900px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#1E1E1E]">WTL Cities</h1>
        <span className="text-sm text-[#999]">
          <span className="font-semibold text-[#D97746]">{data.total}</span> people across{" "}
          <span className="font-semibold text-[#1E1E1E]">{data.cities.length}</span>{" "}
          {data.cities.length === 1 ? "city" : "cities"}
        </span>
      </div>

      {/* City cards grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {data.cities.map((c) => (
          <div
            key={c.city}
            className="bg-white rounded-xl border border-[#E8E3DC] p-4 flex flex-col gap-1"
          >
            <span className="text-2xl font-bold text-[#D97746]">{c.count}</span>
            <span className="text-sm font-medium text-[#1E1E1E]">{c.city}</span>
            <span className="text-xs text-[#999]">
              {c.count === 1 ? "person" : "people"} waiting
            </span>
          </div>
        ))}
      </div>

      {/* Top city callout */}
      {data.cities.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E8E3DC] p-6">
          <h2 className="text-base font-bold text-[#1E1E1E] mb-4">📍 Top Interest</h2>
          <div className="space-y-3">
            {data.cities.slice(0, 5).map((c, i) => {
              const pct = data.total > 0 ? Math.round((c.count / data.total) * 100) : 0;
              return (
                <div key={c.city} className="flex items-center gap-3">
                  <span className="text-xs text-[#999] w-4">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-[#1E1E1E]">{c.city}</span>
                      <span className="text-sm font-bold text-[#D97746]">
                        {c.count} <span className="text-xs text-[#999] font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#F0EBE3] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#D97746] rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
