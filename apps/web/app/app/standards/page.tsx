"use client";

import { useEffect, useState } from "react";
import { listStandardsSets, createStandardsSet, listStandards, createStandard } from "@/lib/standards";

export default function StandardsPage() {
  const [sets, setSets] = useState<any[]>([]);
  const [setName, setSetName] = useState("");
  const [version, setVersion] = useState("v1");
  const [activeSet, setActiveSet] = useState<string>("");

  const [code, setCode] = useState("");
  const [desc, setDesc] = useState("");
  const [standards, setStandards] = useState<any[]>([]);

  const [error, setError] = useState<string | null>(null);

  async function refreshSets() {
    setError(null);
    try {
      const data = await listStandardsSets();
      setSets(data);
      if (!activeSet && data[0]?.id) setActiveSet(data[0].id);
    } catch (e: any) {
      setError(e?.message ?? "Failed (did you login?)");
    }
  }

  async function refreshStandards(setId: string) {
    setError(null);
    try {
      setStandards(await listStandards({ set_id: setId }));
    } catch (e: any) {
      setError(e?.message ?? "Failed to load standards");
    }
  }

  async function addSet() {
    setError(null);
    try {
      const ss = await createStandardsSet({ name: setName, version_label: version });
      setSetName("");
      await refreshSets();
      setActiveSet(ss.id);
    } catch (e: any) {
      setError(e?.message ?? "Failed to create set");
    }
  }

  async function addStandard() {
    if (!activeSet) return;
    setError(null);
    try {
      await createStandard({ standards_set_id: activeSet, code, description: desc });
      setCode(""); setDesc("");
      await refreshStandards(activeSet);
    } catch (e: any) {
      setError(e?.message ?? "Failed to create standard");
    }
  }

  useEffect(() => { refreshSets(); }, []);
  useEffect(() => { if (activeSet) refreshStandards(activeSet); }, [activeSet]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h1 style={{ margin: 0 }}>Standards</h1>
      {error && <p style={{ color: "#B91C1C" }}>{error}</p>}

      <div style={{ display: "grid", gap: 8, border: "1px solid #E5E7EB", borderRadius: 10, padding: 12 }}>
        <div style={{ fontWeight: 600 }}>Create standards set</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input value={setName} onChange={(e) => setSetName(e.target.value)} placeholder="Set name (e.g., NGSS)" style={{ padding: 10, minWidth: 240 }} />
          <input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="Version (e.g., 2024)" style={{ padding: 10, minWidth: 140 }} />
          <button onClick={addSet} style={{ padding: 10 }}>Add set</button>
        </div>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ fontWeight: 600 }}>Active set:</div>
          <select value={activeSet} onChange={(e) => setActiveSet(e.target.value)} style={{ padding: 10 }}>
            {sets.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.version_label})</option>)}
          </select>
        </div>

        <div style={{ display: "grid", gap: 8, border: "1px solid #E5E7EB", borderRadius: 10, padding: 12 }}>
          <div style={{ fontWeight: 600 }}>Add standard</div>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code (e.g., MS-PS2-2)" style={{ padding: 10 }} />
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description" style={{ padding: 10, minHeight: 80 }} />
          <button onClick={addStandard} style={{ padding: 10 }}>Add standard</button>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          {standards.map((st) => (
            <div key={st.id} style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: 12 }}>
              <div style={{ fontWeight: 700 }}>{st.code}</div>
              <div style={{ color: "#374151" }}>{st.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
