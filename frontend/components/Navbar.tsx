"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function Navbar() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="sticky top-0 z-30 border-b border-slate-800/90 bg-slate-950/90 backdrop-blur"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-cyan-500/20 text-cyan-300">
            AO
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-100">AthenaOps</p>
            <p className="text-[11px] tracking-wide text-slate-400">AI DevOps Assistant</p>
          </div>
        </Link>

        <Link
          href="/"
          className="rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-cyan-600 hover:text-cyan-300"
        >
          Back to Landing
        </Link>
      </div>
    </motion.header>
  );
}
