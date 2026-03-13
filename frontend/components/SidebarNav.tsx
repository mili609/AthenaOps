"use client";

import type { ComponentType } from "react";
import { motion } from "framer-motion";
import type { DashboardSection } from "./dashboardTypes";

interface SidebarNavProps {
  activeSection: DashboardSection;
  onSelect: (section: DashboardSection) => void;
}

type IconProps = { className?: string };

function RepoIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M4 7.5a2.5 2.5 0 0 1 2.5-2.5h6A2.5 2.5 0 0 1 15 7.5v9A2.5 2.5 0 0 1 12.5 19h-6A2.5 2.5 0 0 1 4 16.5v-9Z" />
      <path d="M15 8h2.5A2.5 2.5 0 0 1 20 10.5v6a2.5 2.5 0 0 1-2.5 2.5H15" />
    </svg>
  );
}

function GeneratorIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h10" />
      <path d="m16 16 2 2 4-4" />
    </svg>
  );
}

function ErrorIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M10.3 4.2 3.8 15.3A2 2 0 0 0 5.5 18h13a2 2 0 0 0 1.7-2.7L13.7 4.2a2 2 0 0 0-3.4 0Z" />
      <path d="M12 8v4" />
      <circle cx="12" cy="15.6" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  );
}

const items: Array<{ id: DashboardSection; label: string; icon: ComponentType<IconProps> }> = [
  { id: "repo", label: "Repo Analyzer", icon: RepoIcon },
  { id: "generator", label: "DevOps Generator", icon: GeneratorIcon },
  { id: "error", label: "Error Analyzer", icon: ErrorIcon },
];

export default function SidebarNav({ activeSection, onSelect }: SidebarNavProps) {
  return (
    <aside className="w-full rounded-xl border border-slate-800 bg-slate-900/70 p-3 md:w-64">
      <p className="px-2 pb-2 text-xs font-semibold tracking-[0.18em] text-slate-500">
        DASHBOARD
      </p>
      <nav className="space-y-1">
        {items.map((item) => {
          const active = item.id === activeSection;
          const Icon = item.icon;
          return (
            <motion.button
              key={item.id}
              whileHover={{ x: 2 }}
              onClick={() => onSelect(item.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                active
                  ? "bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-700/60"
                  : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
              }`}
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded bg-slate-800/80 text-slate-400">
                <Icon />
              </span>
              <span>{item.label}</span>
            </motion.button>
          );
        })}
      </nav>
    </aside>
  );
}
