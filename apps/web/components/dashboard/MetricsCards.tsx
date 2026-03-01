type MetricsCardsProps = {
  classesToday: number;
  needReteach: number;
  nextUpLabel: string;
  nextUpTime?: string;
  onNextUpClick?: () => void;
};

function toneForReteach(count: number) {
  if (count === 0) return { border: "#BBF7D0", dot: "#16A34A", state: "Healthy" };
  if (count <= 2) return { border: "#FDE68A", dot: "#D97706", state: "Watch" };
  return { border: "#FECACA", dot: "#DC2626", state: "Needs attention" };
}

export default function MetricsCards(props: MetricsCardsProps) {
  const { classesToday, needReteach, nextUpLabel, nextUpTime, onNextUpClick } = props;
  const tone = toneForReteach(needReteach);

  // TODO: Replace these placeholder deltas with real day-over-day analytics from backend metrics.
  const trends = {
    classesToday: "+1 vs yesterday",
    needReteach: needReteach === 0 ? "0 vs yesterday" : "+1 vs yesterday",
    nextUp: "On schedule"
  };

  return (
    <section
      aria-label="Dashboard metrics"
      className="metricsGrid"
      style={{
        display: "grid",
        gap: 12,
        gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))"
      }}
    >
      <article className="metricCard" style={{ border: "1px solid #E5E7EB", borderRadius: 12, padding: 16, minHeight: 134, display: "grid", alignContent: "space-between" }}>
        <div style={{ color: "#6B7280", fontSize: 12, letterSpacing: 0.2, fontWeight: 600 }}>Classes Today</div>
        <div style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.05, color: "#111827" }}>{classesToday}</div>
        <div style={{ marginTop: 2, fontSize: 12, color: "#6B7280" }}>{trends.classesToday}</div>
      </article>

      <article className="metricCard" style={{ border: `1px solid ${tone.border}`, borderRadius: 12, padding: 16, minHeight: 134, display: "grid", alignContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            aria-hidden
            style={{ width: 8, height: 8, borderRadius: 999, background: tone.dot, display: "inline-block", flexShrink: 0 }}
          />
          <div style={{ color: "#6B7280", fontSize: 12, letterSpacing: 0.2, fontWeight: 600 }}>Need Reteach</div>
        </div>
        <div style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.05, color: "#111827" }}>{needReteach}</div>
        <div style={{ marginTop: 4, fontSize: 12, color: "#6B7280" }}>
          {trends.needReteach} · {tone.state}
        </div>
      </article>

      <article
        className="metricCard"
        style={{
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          padding: 16,
          minHeight: 134,
          display: "grid",
          alignContent: "space-between",
          cursor: onNextUpClick ? "pointer" : "default"
        }}
        onClick={onNextUpClick}
        role={onNextUpClick ? "button" : undefined}
        tabIndex={onNextUpClick ? 0 : undefined}
        onKeyDown={(e) => {
          if (!onNextUpClick) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onNextUpClick();
          }
        }}
        aria-label={onNextUpClick ? "Jump to next class in timeline" : undefined}
      >
        <div style={{ color: "#6B7280", fontSize: 12, letterSpacing: 0.2, fontWeight: 600 }}>Next Up</div>
        <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.15, marginTop: 2, color: "#111827" }}>{nextUpLabel}</div>
        {nextUpTime && <div style={{ marginTop: 2, color: "#4B5563", fontSize: 13 }}>{nextUpTime}</div>}
        <div style={{ marginTop: 4, fontSize: 12, color: "#6B7280" }}>{trends.nextUp}</div>
      </article>

      <style jsx>{`
        .metricCard {
          transition: background 140ms ease;
        }

        .metricCard:hover {
          background: #f8fafc;
        }
      `}</style>
    </section>
  );
}
