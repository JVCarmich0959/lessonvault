"use client";

import { useEffect, useState } from "react";
import { listLessonStandards, attachLessonStandards, detachLessonStandard } from "@/lib/lessonStandards";
import { listStandards, listStandardsSets, createStandardsSet, createStandard } from "@/lib/standards";

export default function LessonStandards({ params }: { params: { id: string } }) {
  const lessonId = params.id;
  const [attached, setAttached] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [standardsSets, setStandardsSets] = useState<any[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string>("");
  const [setName, setSetName] = useState("");
  const [setVersion, setSetVersion] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newDescription, setNewDescription] = useState("");
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

  async function refreshSets() {
    setError(null);
    try {
      const sets = await listStandardsSets();
      setStandardsSets(sets);
      if (!selectedSetId && sets[0]?.id) setSelectedSetId(sets[0].id);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load standards sets");
    }
  }

  async function createSet() {
    setError(null);
    try {
      const created = await createStandardsSet({
        name: setName.trim(),
        version_label: setVersion.trim() || undefined,
      });
      setSetName("");
      setSetVersion("");
      await refreshSets();
      setSelectedSetId(created.id);
    } catch (e: any) {
      setError(e?.message ?? "Failed to create standards set");
    }
  }

  async function createStandardAndAttach() {
    setError(null);
    try {
      const created = await createStandard({
        standards_set_id: selectedSetId,
        code: newCode.trim(),
        description: newDescription.trim(),
      });
      await attachLessonStandards(lessonId, [created.id]);
      setNewCode("");
      setNewDescription("");
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Failed to create standard");
    }
  }

  useEffect(() => { refresh(); refreshSets(); }, [lessonId]);

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

      <section style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: 12, display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 600 }}>Create standards set</div>
        <input
          value={setName}
          onChange={(e) => setSetName(e.target.value)}
          placeholder="Set name (e.g., CSTA K-2)"
          style={{ padding: 10 }}
        />
        <input
          value={setVersion}
          onChange={(e) => setSetVersion(e.target.value)}
          placeholder="Version (optional)"
          style={{ padding: 10 }}
        />
        <button onClick={createSet} style={{ padding: 10 }} disabled={!setName.trim()}>
          Create standards set
        </button>
        {standardsSets.length === 0 && (
          <div style={{ color: "#6B7280", fontSize: 12 }}>
            No standards sets yet. Create one to add standards.
          </div>
        )}
      </section>

      <section style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: 12, display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 600 }}>Create standard & attach</div>
        <select
          value={selectedSetId}
          onChange={(e) => setSelectedSetId(e.target.value)}
          style={{ padding: 10 }}
          disabled={standardsSets.length === 0}
        >
          {standardsSets.map((set) => (
            <option key={set.id} value={set.id}>
              {set.name}{set.version_label ? ` (${set.version_label})` : ""}
            </option>
          ))}
        </select>
        <input
          value={newCode}
          onChange={(e) => setNewCode(e.target.value)}
          placeholder="Code (e.g., 1A-AP-08)"
          style={{ padding: 10 }}
          disabled={standardsSets.length === 0}
        />
        <input
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          placeholder="Description"
          style={{ padding: 10 }}
          disabled={standardsSets.length === 0}
        />
        <button
          onClick={createStandardAndAttach}
          style={{ padding: 10 }}
          disabled={!selectedSetId || !newCode.trim() || !newDescription.trim()}
        >
          Create & attach
        </button>
      </section>
    </div>
  );
}
