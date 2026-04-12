"use client";

import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Card from "@/components/ui/Card";

type FeedbackEntry = {
  id: string;
  user_id: string;
  first_name: string;
  avatar_url: string | null;
  attended: boolean | null;
  rating: string | null;
  comment: string | null;
  created_at: string;
  user_total_no_shows: number;
};

type FeedbackEvent = {
  id: string;
  title: string;
  start_time: string | null;
  primary_vibe: string | null;
  neighborhood: string | null;
  member_count: number | null;
  creator_user_id: string;
  creator_name: string;
  creator_avatar: string | null;
  total_members: number;
  feedback_count: number;
  attended_count: number;
  no_show_count: number;
  thumbs_up_count: number;
  thumbs_down_count: number;
  comment_count: number;
  feedback: FeedbackEntry[];
};

type AggregateStats = {
  total_completed: number;
  response_rate: number;
  thumbs_up_rate: number;
  no_show_rate: number;
  total_feedback: number;
};

const COLORS = {
  terracotta: "var(--terracotta)",
  gold: "#C5A55A",
  success: "var(--success)",
  error: "var(--error)",
};

function formatDate(iso: string | null): string {
  if (!iso) return "No date";
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Avatar({
  url,
  name,
  size = 32,
}: {
  url: string | null;
  name: string;
  size?: number;
}) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  const style: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    background: "var(--bg-elevated)",
    border: "1.5px solid var(--bg-surface)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
    color: "var(--parchment-dim)",
    fontSize: Math.round(size * 0.42),
    fontWeight: 600,
  };
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={name} style={style} />
    );
  }
  return <div style={style}>{initial}</div>;
}

function VibeTag({ vibe }: { vibe: string | null }) {
  if (!vibe) return null;
  return (
    <span
      style={{
        fontSize: "10px",
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        padding: "3px 10px",
        borderRadius: "20px",
        background: "rgba(217,119,70,0.12)",
        color: COLORS.terracotta,
      }}
    >
      {vibe}
    </span>
  );
}

function AccentStatCard({
  label,
  value,
  accent,
  sublabel,
}: {
  label: string;
  value: string;
  accent: string;
  sublabel?: string;
}) {
  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderLeft: `4px solid ${accent}`,
        borderRadius: "12px",
        padding: "18px 20px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--parchment-dim)",
          marginBottom: "8px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "Cormorant Garamond, serif",
          fontSize: "34px",
          fontWeight: 700,
          color: "var(--parchment)",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {sublabel && (
        <div
          style={{
            fontSize: "11px",
            color: "var(--parchment-muted)",
            marginTop: "6px",
          }}
        >
          {sublabel}
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "var(--bg-input)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  padding: "8px 14px",
  fontSize: "13px",
  color: "var(--parchment)",
  outline: "none",
  fontFamily: "DM Sans, sans-serif",
};

function EventCard({
  event,
  onClick,
}: {
  event: FeedbackEvent;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "18px 20px",
        cursor: "pointer",
        transition: "border-color 0.15s, box-shadow 0.15s, transform 0.15s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--border-active)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "16px",
          marginBottom: "10px",
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontFamily: "Cormorant Garamond, serif",
              fontSize: "20px",
              fontWeight: 700,
              color: "var(--parchment)",
              marginBottom: "4px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {event.title}
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "var(--parchment-dim)",
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <span>{formatDate(event.start_time)}</span>
            {event.neighborhood && <span>· {event.neighborhood}</span>}
          </div>
        </div>
        <VibeTag vibe={event.primary_vibe} />
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "18px",
          alignItems: "center",
          paddingTop: "12px",
          borderTop: "1px solid var(--border)",
          fontSize: "13px",
          color: "var(--parchment-dim)",
        }}
      >
        <div>
          <span style={{ color: "var(--parchment)", fontWeight: 600 }}>
            {event.attended_count}/{event.feedback_count}
          </span>{" "}
          showed up
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span>👍 {event.thumbs_up_count}</span>
          <span style={{ color: "var(--parchment-muted)" }}>·</span>
          <span>👎 {event.thumbs_down_count}</span>
        </div>
        {event.no_show_count > 0 && (
          <div
            style={{
              color: COLORS.error,
              fontWeight: 600,
              background: "rgba(198,40,40,0.08)",
              padding: "3px 10px",
              borderRadius: "20px",
              fontSize: "12px",
            }}
          >
            {event.no_show_count} no{event.no_show_count === 1 ? "-show" : "-shows"}
          </div>
        )}
        <div style={{ marginLeft: "auto" }}>
          {event.comment_count} {event.comment_count === 1 ? "comment" : "comments"}
        </div>
      </div>
    </div>
  );
}

function DetailView({
  event,
  onBack,
}: {
  event: FeedbackEvent;
  onBack: () => void;
}) {
  const attendees = event.feedback.filter((f) => f.attended === true);
  const noShows = event.feedback.filter((f) => f.attended === false);
  const comments = event.feedback.filter(
    (f) => f.comment && f.comment.trim().length > 0
  );
  const attendancePct =
    event.feedback_count > 0
      ? Math.round((event.attended_count / event.feedback_count) * 100)
      : 0;

  return (
    <div>
      <button
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          color: COLORS.terracotta,
          fontSize: "13px",
          fontFamily: "DM Sans, sans-serif",
          cursor: "pointer",
          padding: 0,
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        ← Back to all plans
      </button>

      <div style={{ marginBottom: "28px" }}>
        <h1
          style={{
            fontFamily: "Cormorant Garamond, serif",
            fontSize: "36px",
            fontWeight: 700,
            lineHeight: 1.1,
            color: "var(--parchment)",
            marginBottom: "10px",
          }}
        >
          {event.title}
        </h1>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            fontSize: "13px",
            color: "var(--parchment-dim)",
          }}
        >
          <span>{formatDate(event.start_time)}</span>
          {event.neighborhood && <span>· {event.neighborhood}</span>}
          <VibeTag vibe={event.primary_vibe} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginLeft: "auto",
            }}
          >
            <Avatar url={event.creator_avatar} name={event.creator_name} size={28} />
            <span style={{ color: "var(--parchment)" }}>
              hosted by {event.creator_name}
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        <AccentStatCard
          label="Attendance"
          value={`${event.attended_count}/${event.feedback_count}`}
          sublabel={`${attendancePct}% showed up`}
          accent={COLORS.terracotta}
        />
        <AccentStatCard
          label="Rating"
          value={`👍 ${event.thumbs_up_count}  👎 ${event.thumbs_down_count}`}
          accent={COLORS.gold}
        />
        <AccentStatCard
          label="Comments"
          value={String(event.comment_count)}
          accent={COLORS.success}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "20px",
          marginBottom: "28px",
        }}
      >
        <Card title={`Who showed up (${attendees.length})`}>
          {attendees.length === 0 ? (
            <p style={{ fontSize: "13px", color: "var(--parchment-muted)" }}>
              nobody marked themselves as attended
            </p>
          ) : (
            <>
              <div style={{ display: "flex", marginBottom: "12px" }}>
                {attendees.slice(0, 12).map((a, i) => (
                  <div
                    key={a.id}
                    title={a.first_name}
                    style={{ marginLeft: i === 0 ? 0 : -10 }}
                  >
                    <Avatar url={a.avatar_url} name={a.first_name} size={36} />
                  </div>
                ))}
                {attendees.length > 12 && (
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "var(--bg-elevated)",
                      border: "1.5px solid var(--bg-surface)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--parchment-dim)",
                      marginLeft: -10,
                    }}
                  >
                    +{attendees.length - 12}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {attendees.map((a) => (
                  <span
                    key={a.id}
                    style={{
                      fontSize: "12px",
                      color: "var(--parchment)",
                      background: "var(--bg-elevated)",
                      padding: "4px 10px",
                      borderRadius: "12px",
                    }}
                  >
                    {a.first_name}
                  </span>
                ))}
              </div>
            </>
          )}
        </Card>

        <Card title={`No-shows (${noShows.length})`}>
          {noShows.length === 0 ? (
            <p style={{ fontSize: "13px", color: "var(--parchment-muted)" }}>
              no no-shows on this plan
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {noShows.map((n) => (
                <div
                  key={n.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <Avatar url={n.avatar_url} name={n.first_name} size={32} />
                  <span
                    style={{
                      fontSize: "13px",
                      color: "var(--parchment)",
                      fontWeight: 500,
                    }}
                  >
                    {n.first_name}
                  </span>
                  {n.user_total_no_shows > 1 && (
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        padding: "3px 8px",
                        borderRadius: "20px",
                        background: "rgba(198,40,40,0.1)",
                        color: COLORS.error,
                      }}
                    >
                      {ordinal(n.user_total_no_shows)} no-show
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card title={`Comments (${comments.length})`}>
        {comments.length === 0 ? (
          <p style={{ fontSize: "13px", color: "var(--parchment-muted)" }}>
            no comments for this plan
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              maxHeight: "480px",
              overflowY: "auto",
            }}
          >
            {comments.map((c) => (
              <div
                key={c.id}
                style={{
                  display: "flex",
                  gap: "12px",
                  paddingBottom: "16px",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <Avatar url={c.avatar_url} name={c.first_name} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "var(--parchment)",
                      }}
                    >
                      {c.first_name}
                    </span>
                    <span style={{ fontSize: "14px" }}>
                      {c.rating === "thumbs_up" ? "👍" : c.rating ? "👎" : ""}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--parchment-muted)",
                        marginLeft: "auto",
                      }}
                    >
                      {formatDateTime(c.created_at)}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "var(--parchment)",
                      lineHeight: 1.55,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {c.comment}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function AdminFeedbackPage() {
  const [events, setEvents] = useState<FeedbackEvent[]>([]);
  const [stats, setStats] = useState<AggregateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [vibeFilter, setVibeFilter] = useState("");
  const [commentsOnly, setCommentsOnly] = useState(false);

  useEffect(() => {
    fetch("/api/admin/feedback")
      .then((r) => r.json())
      .then((d) => {
        setEvents(d.events ?? []);
        setStats(d.stats ?? null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const vibes = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => e.primary_vibe && set.add(e.primary_vibe));
    return [...set].sort();
  }, [events]);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (fromDate && e.start_time && new Date(e.start_time) < new Date(fromDate)) return false;
      if (toDate && e.start_time && new Date(e.start_time) > new Date(toDate + "T23:59:59"))
        return false;
      if (vibeFilter && e.primary_vibe !== vibeFilter) return false;
      if (commentsOnly && e.comment_count === 0) return false;
      return true;
    });
  }, [events, fromDate, toDate, vibeFilter, commentsOnly]);

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedId) || null,
    [events, selectedId]
  );

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "60vh",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            border: "2px solid var(--terracotta)",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (selectedEvent) {
    return <DetailView event={selectedEvent} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div>
      <PageHeader
        title="Feedback"
        subtitle={`${events.length} completed ${events.length === 1 ? "plan" : "plans"} with post-plan survey data`}
      />

      {stats && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <AccentStatCard
            label="Completed Plans"
            value={String(stats.total_completed)}
            accent={COLORS.terracotta}
            sublabel="total lifetime"
          />
          <AccentStatCard
            label="Response Rate"
            value={`${stats.response_rate.toFixed(0)}%`}
            accent={COLORS.gold}
            sublabel={`${stats.total_feedback} responses`}
          />
          <AccentStatCard
            label="Thumbs Up Rate"
            value={`${stats.thumbs_up_rate.toFixed(0)}%`}
            accent={COLORS.success}
            sublabel="of rated feedback"
          />
          <AccentStatCard
            label="No-Show Rate"
            value={`${stats.no_show_rate.toFixed(0)}%`}
            accent={COLORS.error}
            sublabel="of all feedback"
          />
        </div>
      )}

      <Card style={{ marginBottom: "20px" }}>
        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label
              style={{
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--parchment-muted)",
              }}
            >
              From
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label
              style={{
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--parchment-muted)",
              }}
            >
              To
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label
              style={{
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--parchment-muted)",
              }}
            >
              Vibe
            </label>
            <select
              value={vibeFilter}
              onChange={(e) => setVibeFilter(e.target.value)}
              style={{ ...inputStyle, textTransform: "capitalize" }}
            >
              <option value="">All vibes</option>
              {vibes.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              color: "var(--parchment)",
              marginTop: "18px",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={commentsOnly}
              onChange={(e) => setCommentsOnly(e.target.checked)}
            />
            Has comments only
          </label>
          {(fromDate || toDate || vibeFilter || commentsOnly) && (
            <button
              onClick={() => {
                setFromDate("");
                setToDate("");
                setVibeFilter("");
                setCommentsOnly(false);
              }}
              style={{
                marginTop: "18px",
                marginLeft: "auto",
                background: "none",
                border: "none",
                color: COLORS.terracotta,
                fontSize: "12px",
                fontFamily: "DM Sans, sans-serif",
                cursor: "pointer",
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {filtered.length === 0 ? (
          <Card>
            <p style={{ fontSize: "13px", color: "var(--parchment-muted)" }}>
              no completed plans match these filters
            </p>
          </Card>
        ) : (
          filtered.map((e) => (
            <EventCard key={e.id} event={e} onClick={() => setSelectedId(e.id)} />
          ))
        )}
      </div>
    </div>
  );
}
