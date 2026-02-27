export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid #E5E7EB", borderRadius: 12, padding: 14 }}>
      {children}
    </div>
  );
}
