import { ScheduleItem } from "@/lib/schedule";

type WeeklyLoadHeatmapProps = {
  selectedDate: string;
  allItems: ScheduleItem[];
};

function parseIsoDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return new Date();
  return d;
}

function toIsoDate(d: Date) {
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function weekDaysFrom(selectedDate: string) {
  const d = parseIsoDate(selectedDate);
  const day = d.getDay(); // 0 Sun ... 6 Sat
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + mondayOffset);
  const out: { label: string; date: string }[] = [];
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  for (let i = 0; i < 5; i += 1) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);
    out.push({ label: labels[i], date: toIsoDate(current) });
  }
  return out;
}

function colorForIntensity(intensity: number) {
  if (intensity <= 0) return "#F3F4F6";
  if (intensity === 1) return "#CFFAFE";
  if (intensity === 2) return "#67E8F9";
  if (intensity === 3) return "#06B6D4";
  return "#0E7490";
}

export default function WeeklyLoadHeatmap(props: WeeklyLoadHeatmapProps) {
  const { selectedDate, allItems } = props;
  const days = weekDaysFrom(selectedDate);
  const countByDate = new Map<string, number>();
  for (const it of allItems) {
    countByDate.set(it.date, (countByDate.get(it.date) ?? 0) + 1);
  }

  const hasAny = days.some((d) => (countByDate.get(d.date) ?? 0) > 0);

  return (
    <section style={{ border: "1px solid #E5E7EB", borderRadius: 12, padding: 16 }}>
      <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#111827" }}>Weekly Load</h2>
      <p style={{ margin: "4px 0 0", color: "#6B7280", fontSize: 13 }}>Class blocks this week</p>

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
              borderRadius: 4,
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
            #
          </span>
          No class blocks yet this week.
        </div>
      )}

      {hasAny && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(48px, 1fr))", gap: 8, marginTop: 12 }}>
          {days.map((d) => {
            const count = countByDate.get(d.date) ?? 0;
            const intensity = Math.min(4, count);
            return (
              <div key={d.date} style={{ display: "grid", gap: 6, justifyItems: "center" }}>
                <div style={{ fontSize: 12, color: "#6B7280" }}>{d.label}</div>
                <div
                  aria-label={`${d.label}: ${count} class blocks`}
                  title={`${d.label}: ${count} class blocks`}
                  style={{
                    width: "100%",
                    aspectRatio: "1 / 1",
                    borderRadius: 8,
                    background: colorForIntensity(intensity),
                    border: "1px solid #E5E7EB"
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      {hasAny && (
        <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 10, color: "#6B7280", fontSize: 11 }}>
          <span>Low</span>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: colorForIntensity(1), border: "1px solid #E5E7EB" }} />
          <span style={{ width: 12, height: 12, borderRadius: 3, background: colorForIntensity(2), border: "1px solid #E5E7EB" }} />
          <span style={{ width: 12, height: 12, borderRadius: 3, background: colorForIntensity(3), border: "1px solid #E5E7EB" }} />
          <span style={{ width: 12, height: 12, borderRadius: 3, background: colorForIntensity(4), border: "1px solid #E5E7EB" }} />
          <span>High</span>
        </div>
      )}
    </section>
  );
}
