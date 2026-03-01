"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { apiMe, logout } from "@/lib/auth";
import { getToken } from "@/lib/storage";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const nextPath = useMemo(() => (pathname && pathname.startsWith("/") ? pathname : "/app"), [pathname]);

  useEffect(() => {
    async function verify() {
      const token = getToken();
      if (!token) {
        router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
        return;
      }

      try {
        await apiMe();
        setReady(true);
      } catch {
        logout();
        router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
      }
    }

    verify();
  }, [nextPath, router]);

  if (!ready) {
    return <main style={{ padding: 24 }}>Checking session...</main>;
  }

  return <>{children}</>;
}
