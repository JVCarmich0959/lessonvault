"use client";

import { useEffect, useState } from "react";
import { listLessonStandards, attachLessonStandards, detachLessonStandard } from "@/lib/lessonStandards";
import { listStandards } from "@/lib/standards";

export default function LessonStandards({ params }: { params: { id: string } }) {
  const lessonId = params.id;
  const [attached, setAttached] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setError(null);
    try {
      setAttached(await listLessonStandards(lessonId));
    } catch (e: any) {
      setError(e?.message ?? "Failed to load attached standards");
    }
  }

  async function doSearch() {
    setError(null);
    try {
      setResults(await listStandards({ q: search }));
    } catch (e: any) {
      setError(e?.message ?? "Search failed");
    }
  }

  async function attach(standardId: string) {
    setError(null);
    try {
      await attachLessonStandards(lessonId, [standardId]);
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Attach failed");
    }
  }

  async function detach(standardId: string) {
    setError(null);
    try {
      await detachLessonStandard(lessonId, standardId);
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Detach failed");
    }
  }

  useEffect(() => { refresh(); }, [lessonId]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h1 style={{ margin: 0 }}>Lesson Standards</h1>
      {error && <p style={{ color: "#B91C1C" }}>{error}</p>}

      <section style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Attached</div>
        <div style={{ display: "grid", gap: 8 }}>
          {attached.map((st) => (
            <div key={st.id} style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{st.code}</div>
                  <div style={{ color: "#374151" }}>{st.description}</div>
                </div>
                <button onClick={() => detach(st.id)} style={{ padding: 10 }}>Remove</button>
              </div>
            </div>
          ))}
          {attached.length === 0 && <div style={{ color: "#6B7280" }}>None yet.</div>}
        </div>
      </section>

      <section style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Search & attach</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search code or description" style={{ padding: 10, minWidth: 260 }} />
          <button onClick={doSearch} style={{ padding: 10 }}>Search</button>
        </div>

        <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
          {results.map((st) => (
            <div key={st.id} style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{st.code}</div>
                  <div style={{ color: "#374151" }}>{st.description}</div>
                </div>
                <button onClick={() => attach(st.id)} style={{ padding: 10 }}>Attach</button>
              </div>
            </div>
          ))}
          {results.length === 0 && <div style={{ color: "#6B7280" }}>No results yet.</div>}
        </div>
        <div style={{ marginTop: 10, color: "#6B7280", fontSize: 12 }}>
          Tip: create standards in the global Standards page first.
        </div>
      </section>
    </div>
  );
}
