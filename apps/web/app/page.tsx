import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 32, maxWidth: 960, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 8 }}>LessonVault</h1>
      <p style={{ marginTop: 0, color: "#374151" }}>
        Lesson plan library with standards, materials, lesson runs, and reflections.
      </p>

      <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
        <Link href="/login">Login</Link>
        <span style={{ color: "#9CA3AF" }}>|</span>
        <Link href="/app/library">Go to Library</Link>
      </div>
    </main>
  );
}
