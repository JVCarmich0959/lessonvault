"use client";

import { useState } from "react";
import RequireAuth from "@/components/RequireAuth";
import SidebarNav from "@/components/SidebarNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <RequireAuth>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: sidebarCollapsed ? "64px 1fr" : "240px 1fr",
          minHeight: "100vh",
          transition: "grid-template-columns 200ms ease"
        }}
      >
        <SidebarNav
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed((current) => !current)}
        />
        <main style={{ padding: "28px 24px" }}>
          <div style={{ width: "100%", maxWidth: 1100, margin: "0 auto" }}>{children}</div>
        </main>
      </div>
    </RequireAuth>
  );
}
