"use client";

import { motion } from "framer-motion";
import type { ProjectInfo } from "./dashboardTypes";

interface RepositoryAnalyzerProps {
  repoUrl: string;
  onRepoUrlChange: (value: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  projectInfo: ProjectInfo | null;
  error: string | null;
}

function recommendedSetup(type: string): string[] {
  switch (type) {
    case "node":
      return ["Use multi-stage Node Dockerfile", "Use npm ci for reproducible installs", "Add GitHub Actions test + build workflow"];
    case "python":
      return ["Use slim Python image", "Pin dependencies in requirements.txt", "Run pytest in CI before deploy"];
    case "java":
      return ["Build with Maven stage", "Run app with slim JRE image", "Expose health check endpoint for Kubernetes"];
    default:
      return ["Start with generic Dockerfile", "Create baseline CI with lint/build/test", "Deploy with conservative resource limits"];
  }
}

export default function RepositoryAnalyzer({
  repoUrl,
  onRepoUrlChange,
  onAnalyze,
  isAnalyzing,
  projectInfo,
  error,
}: RepositoryAnalyzerProps) {
  const setup = projectInfo
    ? projectInfo.recommendations && projectInfo.recommendations.length > 0
      ? projectInfo.recommendations
      : recommendedSetup(projectInfo.projectType.type)
    : [];

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-xl border border-slate-800 bg-slate-900/70 p-5"
    >
      <h2 className="text-lg font-semibold text-slate-100">Repository Analyzer</h2>
      <p className="mt-1 text-sm text-slate-400">
        Paste a GitHub URL to detect project type and get recommended DevOps setup.
      </p>

      <div className="mt-4 flex flex-col gap-3 md:flex-row">
        <input
          value={repoUrl}
          onChange={(e) => onRepoUrlChange(e.target.value)}
          placeholder="https://github.com/owner/repository"
          className="code-font w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 outline-none ring-cyan-600 transition focus:ring-2"
        />
        <button
          onClick={onAnalyze}
          disabled={isAnalyzing || !repoUrl.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isAnalyzing ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
              Analyzing Repository
            </>
          ) : (
            "Analyze Repository"
          )}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}

      {projectInfo && (
        <div className="mt-5 rounded-lg border border-slate-700 bg-slate-950/70 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-slate-300">Detected Project Type:</p>
            <span className="rounded-md border border-cyan-800/80 bg-cyan-900/30 px-2 py-1 text-xs font-semibold text-cyan-300">
              {projectInfo.projectType.framework}
            </span>
            <span className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-300">
              {projectInfo.projectType.language}
            </span>
          </div>

          <p className="mt-4 text-sm font-medium text-slate-200">Recommended DevOps Setup</p>
          <ul className="mt-2 space-y-2 text-sm text-slate-400">
            {setup.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.section>
  );
}
