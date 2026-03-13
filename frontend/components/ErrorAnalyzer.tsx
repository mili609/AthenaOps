"use client";

import { motion } from "framer-motion";
import type { ErrorAnalysisResult } from "./dashboardTypes";

interface ErrorAnalyzerProps {
  errorLog: string;
  onErrorLogChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  error: string | null;
  result: ErrorAnalysisResult | null;
}

export default function ErrorAnalyzer({
  errorLog,
  onErrorLogChange,
  onSubmit,
  isLoading,
  error,
  result,
}: ErrorAnalyzerProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-xl border border-slate-800 bg-slate-900/70 p-5"
    >
      <h2 className="text-lg font-semibold text-slate-100">Error Analyzer</h2>
      <p className="mt-1 text-sm text-slate-400">
        Paste build or deployment logs and get problem diagnosis with targeted fixes.
      </p>

      <div className="mt-4 grid gap-3">
        <textarea
          value={errorLog}
          onChange={(e) => onErrorLogChange(e.target.value)}
          placeholder="Paste build or deployment logs"
          rows={8}
          className="code-font w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-amber-600 transition focus:ring-2"
        />
        <button
          onClick={onSubmit}
          disabled={isLoading || !errorLog.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
              Analyzing
            </>
          ) : (
            "Analyze Error"
          )}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}

      {result && (
        <div className="mt-5 grid gap-3">
          <div className="rounded-lg border border-slate-700 bg-slate-950/80 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Problem Detected</p>
            <p className="mt-2 text-sm font-semibold text-amber-300">{result.problem}</p>
            <p className="mt-2 text-sm text-slate-200">{result.explanation}</p>
          </div>
          <div className="rounded-lg border border-emerald-800/70 bg-emerald-950/20 p-4">
            <p className="text-xs uppercase tracking-wide text-emerald-400">Suggested Solution</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-emerald-200/90">{result.solution}</p>
          </div>
        </div>
      )}
    </motion.section>
  );
}
