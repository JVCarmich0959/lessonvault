import Link from "next/link";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", minHeight: "100vh" }}>
      <aside style={{ padding: 16, borderRight: "1px solid #E5E7EB" }}>
        <h3 style={{ marginTop: 0 }}>LessonVault</h3>
        <nav style={{ display: "grid", gap: 8 }}>
          <Link href="/app/library">Library</Link>
          <Link href="/app/materials">Materials</Link>
          <Link href="/app/standards">Standards</Link>
          <Link href="/login">Login</Link>
        </nav>
        <p style={{ marginTop: 16, fontSize: 12, color: "#6B7280" }}>
          (No route guards yet. This is a scaffold.)
        </p>
      </aside>
      <main style={{ padding: 24 }}>{children}</main>
    </div>
  );
}
