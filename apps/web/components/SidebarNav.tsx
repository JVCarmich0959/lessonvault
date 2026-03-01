"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { logout } from "@/lib/auth";

type SectionKey = "instruction" | "account";
type IconName =
  | "dashboard"
  | "classes"
  | "library"
  | "materials"
  | "standards"
  | "instruction"
  | "account"
  | "logout"
  | "chevron"
  | "sidebar";

type SidebarNavProps = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
};

function isActive(pathname: string, href: string) {
  if (href === "/app") return pathname === "/app";
  if (href === "/app/classes") return pathname === "/app/classes" || pathname.startsWith("/app/classes/");
  if (href === "/app/library") {
    return pathname === "/app/library" || pathname.startsWith("/app/lesson/") || pathname.startsWith("/app/run/");
  }
  if (href === "/app/materials") return pathname === "/app/materials" || pathname.includes("/materials");
  if (href === "/app/standards") return pathname === "/app/standards" || pathname.includes("/standards");
  return pathname === href;
}

function Icon({ name }: { name: IconName }) {
  if (name === "dashboard") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M3 13h8V3H3z" />
        <path d="M13 21h8v-6h-8z" />
        <path d="M13 11h8V3h-8z" />
        <path d="M3 21h8v-6H3z" />
      </svg>
    );
  }

  if (name === "library") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M4 19.5V5.5c0-1.1.9-2 2-2h12v16H6c-1.1 0-2 .9-2 2z" />
        <path d="M18 19.5V3.5" />
      </svg>
    );
  }

  if (name === "classes") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M4 19h16" />
        <path d="M6 19v-7h12v7" />
        <path d="M9 12V8h6v4" />
        <path d="M12 5v3" />
      </svg>
    );
  }

  if (name === "materials") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M3 6h18" />
        <path d="M7 6V4h10v2" />
        <path d="M5 6l1 14h12l1-14" />
      </svg>
    );
  }

  if (name === "standards") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M6 4h12v16H6z" />
        <path d="M9 8h6" />
        <path d="M9 12h6" />
        <path d="M9 16h4" />
      </svg>
    );
  }

  if (name === "instruction") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M3 6l9-3 9 3-9 3z" />
        <path d="M7 10v5c0 1.7 2.2 3 5 3s5-1.3 5-3v-5" />
      </svg>
    );
  }

  if (name === "account") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5 20c1.8-3.2 4.2-4.8 7-4.8S17.2 16.8 19 20" />
      </svg>
    );
  }

  if (name === "logout") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M10 4H5v16h5" />
        <path d="M14 16l5-4-5-4" />
        <path d="M19 12H9" />
      </svg>
    );
  }

  if (name === "sidebar") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M9 4v16" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M8 10l4 4 4-4" />
    </svg>
  );
}

const instructionLinks = [
  { href: "/app", label: "Dashboard", icon: "dashboard" as const },
  { href: "/app/classes", label: "Classes", icon: "classes" as const },
  { href: "/app/library", label: "Library", icon: "library" as const },
  { href: "/app/materials", label: "Materials", icon: "materials" as const },
  { href: "/app/standards", label: "Standards", icon: "standards" as const }
];

export default function SidebarNav({ collapsed, onToggleCollapsed }: SidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [openSection, setOpenSection] = useState<SectionKey | null>(null);

  useEffect(() => {
    if (collapsed) {
      setOpenSection(null);
    }
  }, [collapsed]);

  function toggle(section: SectionKey) {
    if (collapsed) return;
    setOpenSection((current) => (current === section ? null : section));
  }

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="brandWrap">
        <div className="brandLockup">
          <span className="brandMark" aria-hidden>
            LV
          </span>
          <span className="brandText">LessonVault</span>
        </div>
        <div className="collapseWrap" data-tooltip={collapsed ? "Expand sidebar" : undefined}>
          <button
            type="button"
            className="collapseBtn"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span className={`collapseIcon ${collapsed ? "collapsed" : ""}`}>
              <Icon name="sidebar" />
            </span>
          </button>
        </div>
      </div>

      <div className="divider" />

      <div className="sections">
        <section>
          <button
            className="sectionHeader"
            type="button"
            onClick={() => toggle("instruction")}
            aria-expanded={openSection === "instruction"}
            aria-controls="instruction-panel"
            data-tooltip={collapsed ? "Instruction" : undefined}
          >
            <span className="sectionHeaderInner">
              <span className="iconWrap" aria-hidden>
                <Icon name="instruction" />
              </span>
              <span className="sectionLabel">Instruction</span>
            </span>
            <span className={`chevron ${openSection === "instruction" ? "open" : ""}`} aria-hidden>
              <Icon name="chevron" />
            </span>
          </button>

          <div id="instruction-panel" className={`panel ${openSection === "instruction" ? "open" : ""}`}>
            <nav aria-label="Instruction links" className="links">
              {instructionLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`link ${isActive(pathname, item.href) ? "active" : ""}`}
                  aria-label={collapsed ? item.label : undefined}
                  data-tooltip={collapsed ? item.label : undefined}
                >
                  <span className="iconWrap" aria-hidden>
                    <Icon name={item.icon} />
                  </span>
                  <span className="linkLabel">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </section>

        <section>
          <button
            className="sectionHeader"
            type="button"
            onClick={() => toggle("account")}
            aria-expanded={openSection === "account"}
            aria-controls="account-panel"
            data-tooltip={collapsed ? "Account" : undefined}
          >
            <span className="sectionHeaderInner">
              <span className="iconWrap" aria-hidden>
                <Icon name="account" />
              </span>
              <span className="sectionLabel">Account</span>
            </span>
            <span className={`chevron ${openSection === "account" ? "open" : ""}`} aria-hidden>
              <Icon name="chevron" />
            </span>
          </button>

          <div id="account-panel" className={`panel ${openSection === "account" ? "open" : ""}`}>
            <div className="links">
              <button
                type="button"
                className="link linkButton"
                onClick={() => {
                  logout();
                  router.replace("/login");
                }}
                aria-label={collapsed ? "Logout" : undefined}
                data-tooltip={collapsed ? "Logout" : undefined}
              >
                <span className="iconWrap" aria-hidden>
                  <Icon name="logout" />
                </span>
                <span className="linkLabel">Logout</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        .sidebar {
          width: 100%;
          min-height: 100vh;
          background: #ffffff;
          border-right: 1px solid #e5e7eb;
          padding: 24px 16px;
          box-sizing: border-box;
          transition: padding 200ms ease;
        }

        .sidebar.collapsed {
          padding-left: 8px;
          padding-right: 8px;
        }

        .brandWrap {
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 30px;
          gap: 8px;
        }

        .brandLockup {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .brandMark {
          width: 24px;
          height: 24px;
          border-radius: 7px;
          background: #f3f4f6;
          color: #334155;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          line-height: 1;
          letter-spacing: 0.02em;
          flex-shrink: 0;
        }

        .brandText {
          font-weight: 600;
          font-size: 15px;
          color: #111827;
          white-space: nowrap;
        }

        .collapsed .brandText {
          display: none;
        }

        .collapseWrap {
          position: relative;
          display: inline-flex;
          align-items: center;
        }

        .collapseBtn {
          border: 0;
          background: transparent;
          color: #64748b;
          border-radius: 8px;
          width: 32px;
          height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .collapseBtn:hover {
          background: #f8fafc;
        }

        .collapseBtn:focus-visible {
          outline: 2px solid #93c5fd;
          outline-offset: 1px;
        }

        .collapseIcon {
          width: 18px;
          height: 18px;
          display: inline-flex;
          transition: transform 200ms ease;
        }

        .collapseIcon.collapsed {
          transform: rotate(180deg);
        }

        .divider {
          height: 1px;
          background: #e5e7eb;
          margin-top: 12px;
        }

        .sections {
          display: grid;
          gap: 16px;
          margin-top: 16px;
        }

        .sectionHeader {
          position: relative;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border: 0;
          background: transparent;
          text-align: left;
          border-radius: 8px;
          padding: 8px 10px;
          cursor: pointer;
          color: #6b7280;
          font-weight: 600;
          font-size: 14px;
          letter-spacing: 0.02em;
        }

        .sectionHeaderInner {
          min-width: 0;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .sectionLabel {
          white-space: nowrap;
        }

        .sectionHeader:hover {
          background: #f8fafc;
        }

        .sectionHeader:focus-visible {
          outline: 2px solid #93c5fd;
          outline-offset: 1px;
        }

        .iconWrap {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .iconWrap :global(svg) {
          width: 16px;
          height: 16px;
        }

        .chevron {
          width: 14px;
          height: 14px;
          color: #9ca3af;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transform: rotate(0deg);
          transition: transform 200ms ease;
        }

        .chevron.open {
          transform: rotate(180deg);
        }

        .panel {
          overflow: hidden;
          max-height: 0;
          opacity: 0;
          transition: max-height 200ms ease, opacity 200ms ease;
        }

        .panel.open {
          max-height: 280px;
          opacity: 1;
        }

        .links {
          display: grid;
          gap: 8px;
          padding-top: 8px;
        }

        .link {
          position: relative;
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          font-weight: 500;
          font-size: 14px;
          color: #4b5563;
          padding: 10px 12px;
          border-radius: 8px;
          border-left: 3px solid transparent;
          background: transparent;
        }

        .link:hover {
          background: #f8fafc;
        }

        .link:visited {
          color: #4b5563;
        }

        .link:focus-visible {
          outline: 2px solid #93c5fd;
          outline-offset: 1px;
        }

        .link.active {
          background: #f3f4f6;
          border-left-color: #0ea5e9;
          color: #111827;
        }

        .linkButton {
          width: 100%;
          border: 0;
          text-align: left;
          cursor: pointer;
          font-family: inherit;
        }

        [data-tooltip] {
          position: relative;
        }

        [data-tooltip]::after {
          position: absolute;
          left: calc(100% + 8px);
          top: 50%;
          transform: translateY(-50%);
          content: attr(data-tooltip);
          padding: 4px 8px;
          border-radius: 6px;
          background: #111827;
          color: #ffffff;
          font-size: 12px;
          line-height: 1.3;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 120ms ease;
          z-index: 30;
        }

        .collapsed .sectionHeader {
          justify-content: center;
          padding-left: 8px;
          padding-right: 8px;
        }

        .collapsed .sectionLabel,
        .collapsed .linkLabel,
        .collapsed .chevron {
          display: none;
        }

        .collapsed .links {
          padding-top: 6px;
        }

        .collapsed .link {
          justify-content: center;
          gap: 0;
          padding: 10px 0;
        }

        .collapsed .link.active {
          border-left-width: 2px;
        }

        .collapsed [data-tooltip]:hover::after,
        .collapsed [data-tooltip]:focus-visible::after,
        .collapsed .collapseWrap:focus-within::after {
          opacity: 1;
        }
      `}</style>
    </aside>
  );
}
