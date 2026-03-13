"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { GeneratedFiles } from "./dashboardTypes";
import CodePreviewPanel from "./CodePreviewPanel";

type FileKey = keyof GeneratedFiles;

interface DevOpsFileGeneratorProps {
  generatedFiles: GeneratedFiles;
  onGenerateDockerfile: () => void;
  onGenerateCICD: () => void;
  onGenerateKubernetes: () => void;
  isGeneratingDockerfile: boolean;
  isGeneratingCICD: boolean;
  isGeneratingKubernetes: boolean;
  disabled: boolean;
}

const tabConfig: Array<{ id: FileKey; label: string; filename: string; language: string }> = [
  { id: "dockerfile", label: "Dockerfile", filename: "Dockerfile", language: "docker" },
  { id: "cicdYaml", label: "GitHub Actions", filename: ".github/workflows/ci-cd.yml", language: "yaml" },
  { id: "deploymentYaml", label: "deployment.yaml", filename: "deployment.yaml", language: "yaml" },
  { id: "serviceYaml", label: "service.yaml", filename: "service.yaml", language: "yaml" },
  { id: "dockerCompose", label: "docker-compose.yml", filename: "docker-compose.yml", language: "yaml" },
];

export default function DevOpsFileGenerator({
  generatedFiles,
  onGenerateDockerfile,
  onGenerateCICD,
  onGenerateKubernetes,
  isGeneratingDockerfile,
  isGeneratingCICD,
  isGeneratingKubernetes,
  disabled,
}: DevOpsFileGeneratorProps) {
  const [active, setActive] = useState<FileKey>("dockerfile");

  const activeConfig = useMemo(
    () => tabConfig.find((item) => item.id === active) || tabConfig[0],
    [active]
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-xl border border-slate-800 bg-slate-900/70 p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">DevOps File Generator</h2>
          <p className="mt-1 text-sm text-slate-400">
            Generate files individually and preview them in editor-style tabs.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ y: 0 }}
            onClick={onGenerateDockerfile}
            disabled={disabled || isGeneratingDockerfile}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGeneratingDockerfile ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
                Generating Dockerfile
              </>
            ) : (
              "Generate Dockerfile"
            )}
          </motion.button>

          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ y: 0 }}
            onClick={onGenerateCICD}
            disabled={disabled || isGeneratingCICD}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGeneratingCICD ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
                Generating CI/CD
              </>
            ) : (
              "Generate CI/CD Pipeline"
            )}
          </motion.button>

          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ y: 0 }}
            onClick={onGenerateKubernetes}
            disabled={disabled || isGeneratingKubernetes}
            className="inline-flex items-center gap-2 rounded-lg bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGeneratingKubernetes ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Generating Kubernetes
              </>
            ) : (
              "Generate Kubernetes Config"
            )}
          </motion.button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {tabConfig.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
              active === tab.id
                ? "border-cyan-700 bg-cyan-900/30 text-cyan-300"
                : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <CodePreviewPanel
          filename={activeConfig.filename}
          language={activeConfig.language}
          content={generatedFiles[activeConfig.id] || ""}
        />
      </div>
    </motion.section>
  );
}
