"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const FEATURES = [
  {
    title: "Repository Analyzer",
    text: "Connect a GitHub repository and detect stack details like runtime, framework, and deployment profile.",
  },
  {
    title: "Dockerfile Generator",
    text: "Generate production-ready Dockerfiles with practical defaults for Node.js, Python, Java, and more.",
  },
  {
    title: "CI/CD Pipeline Generator",
    text: "Create GitHub Actions workflows for build, test, and deploy with beginner-friendly structure.",
  },
  {
    title: "Error Log Explainer",
    text: "Paste logs and get AI explanations with probable root causes plus clear, actionable fix steps.",
  },
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden animated-grid">
      <div className="absolute inset-0 hero-gradient opacity-10" />
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-24">
        <motion.p
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-block rounded-full border border-cyan-800/70 bg-cyan-900/30 px-4 py-1 text-xs tracking-[0.2em] text-cyan-300"
        >
          ATHENAOPS PLATFORM
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="mt-6 max-w-4xl text-4xl font-bold leading-tight text-slate-100 md:text-6xl"
        >
          AthenaOps - AI Powered DevOps Assistant
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mt-6 max-w-2xl text-base text-slate-300 md:text-lg"
        >
          Analyze repositories, generate DevOps files, and decode difficult build
          logs in one modern developer dashboard.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-8"
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-lg bg-cyan-500 px-6 py-3 font-semibold text-slate-950 transition-transform duration-200 hover:scale-[1.02] hover:bg-cyan-400"
          >
            Analyze Repository
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="mt-14 grid gap-4 md:grid-cols-2"
        >
          {FEATURES.map((item, index) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 + index * 0.08, duration: 0.45 }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-[0_0_0_1px_rgba(14,165,233,0.06)]"
            >
              <h2 className="text-lg font-semibold text-slate-100">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.text}</p>
            </motion.article>
          ))}
        </motion.div>
      </section>
    </main>
  );
}
