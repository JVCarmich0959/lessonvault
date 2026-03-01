import { ScheduleItem } from "@/lib/schedule";

const GRADE_ORDER = ["K", "1", "2", "3", "4", "5"];

type ReteachByGradeBarsProps = {
  items: ScheduleItem[];
};

export default function ReteachByGradeBars(props: ReteachByGradeBarsProps) {
  const { items } = props;
  const base: Record<string, number> = { K: 0, "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };

  for (const it of items) {
    if (it.status !== "struggled") continue;
    if (it.grade in base) base[it.grade] += 1;
  }

  const hasAny = Object.values(base).some((v) => v > 0);
  const max = Math.max(1, ...Object.values(base));

  return (
    <section style={{ border: "1px solid #E5E7EB", borderRadius: 12, padding: 16 }}>
      <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#111827" }}>Reteach Breakdown</h2>
      <p style={{ margin: "4px 0 0", color: "#6B7280", fontSize: 13 }}>By grade level</p>

      {!hasAny && (
        <div
          style={{
            marginTop: 12,
            border: "1px dashed #CBD5E1",
            borderRadius: 10,
            padding: 12,
            color: "#64748B",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 10
          }}
        >
          <span
            aria-hidden
            style={{
              width: 20,
              height: 20,
              borderRadius: 999,
              border: "1px solid #CBD5E1",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#64748B",
              fontSize: 12,
              fontWeight: 700,
              flexShrink: 0
            }}
          >
            i
          </span>
          No reteach flags yet for this date.
        </div>
      )}

      {hasAny && (
        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          {GRADE_ORDER.map((grade) => {
            const count = base[grade] ?? 0;
            const width = count === 0 ? "0%" : `${Math.round((count / max) * 100)}%`;
            return (
              <div
                key={grade}
                style={{
                  display: "grid",
                  gridTemplateColumns: "20px 1fr 28px",
                  gap: 10,
                  alignItems: "center"
                }}
              >
                <div style={{ fontSize: 12, color: "#334155", fontWeight: 700, textAlign: "center" }}>{grade}</div>
                <div style={{ height: 10, borderRadius: 999, background: "#F3F4F6", overflow: "hidden" }}>
                  <div style={{ width, height: "100%", background: "#0EA5E9", borderRadius: 999 }} />
                </div>
                <div style={{ textAlign: "right", fontSize: 12, color: "#334155", fontWeight: 600 }}>{count}</div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
