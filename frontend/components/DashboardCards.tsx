"use client";

import { motion } from "framer-motion";

const cards = [
  {
    title: "Repo Analyzer",
    subtitle: "Detect runtime and framework",
    value: "Stack Discovery",
    tone: "border-cyan-800/80",
  },
  {
    title: "DevOps File Generator",
    subtitle: "Docker, CI/CD and Kubernetes",
    value: "Template + AI",
    tone: "border-emerald-800/80",
  },
  {
    title: "Error Analyzer",
    subtitle: "Explain logs clearly",
    value: "Root Cause + Fixes",
    tone: "border-amber-800/80",
  },
];

export default function DashboardCards() {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card, index) => (
        <motion.article
          key={card.title}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08, duration: 0.4 }}
          whileHover={{ y: -4, scale: 1.01 }}
          className={`rounded-xl border ${card.tone} bg-slate-900/80 p-4 shadow-sm`}
        >
          <p className="text-sm font-semibold text-slate-100">{card.title}</p>
          <p className="mt-1 text-xs text-slate-400">{card.subtitle}</p>
          <p className="mt-3 text-sm font-medium text-cyan-300">{card.value}</p>
        </motion.article>
      ))}
    </section>
  );
}
