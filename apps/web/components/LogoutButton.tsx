"use client";

import { useRouter } from "next/navigation";

import { logout } from "@/lib/auth";

export default function LogoutButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => {
        logout();
        router.replace("/login");
      }}
      style={{
        marginTop: 16,
        padding: "8px 10px",
        border: "1px solid #D1D5DB",
        borderRadius: 8,
        background: "#fff",
        cursor: "pointer"
      }}
    >
      Logout
    </button>
  );
}
