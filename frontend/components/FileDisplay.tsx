"use client";
// ============================================================
// components/FileDisplay.tsx
// ============================================================
// Displays the generated DevOps configuration files with
// syntax highlighting, a copy button, and a download button.

import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { GeneratedFiles, ProjectInfo } from "./dashboardTypes";

interface Props {
  files: GeneratedFiles;
  projectInfo: ProjectInfo;
}

interface FileTab {
  id: keyof GeneratedFiles;
  label: string;
  filename: string;
  language: string;
}

const FILE_TABS: FileTab[] = [
  { id: "dockerfile",     label: "Dockerfile",       filename: "Dockerfile",                     language: "docker"  },
  { id: "cicdYaml",      label: "GitHub Actions",   filename: ".github/workflows/ci-cd.yml",    language: "yaml"    },
  { id: "deploymentYaml",label: "deployment.yaml",   filename: "deployment.yaml",                language: "yaml"    },
  { id: "serviceYaml",   label: "service.yaml",      filename: "service.yaml",                   language: "yaml"    },
];

export default function FileDisplay({ files, projectInfo }: Props) {
  const [activeTab, setActiveTab] = useState<keyof GeneratedFiles>("dockerfile");
  const [copied, setCopied] = useState(false);

  const activeFileConfig = FILE_TABS.find((t) => t.id === activeTab)!;
  const content = files[activeTab] ?? "";

  async function handleCopy() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([content], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    // Use just the filename part for download
    a.download = activeFileConfig.filename.split("/").pop()!;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold text-white mb-4">Generated DevOps Files</h2>

      {/* ---- File Tabs ---- */}
      <div className="flex gap-1 mb-0 border-b border-gray-800">
        {FILE_TABS.map((tab) => {
          const available = Boolean(files[tab.id]);
          return (
            <button
              key={tab.id}
              onClick={() => available && setActiveTab(tab.id)}
              disabled={!available}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors -mb-px border border-b-0
                ${activeTab === tab.id
                  ? "bg-gray-900 border-gray-700 text-white"
                  : available
                  ? "bg-transparent border-transparent text-gray-500 hover:text-gray-300"
                  : "bg-transparent border-transparent text-gray-700 cursor-not-allowed"
                }`}
            >
              {tab.label}
              {!available && <span className="ml-1 text-xs">(failed)</span>}
            </button>
          );
        })}
      </div>

      {/* ---- Code Panel ---- */}
      <div className="bg-gray-900 border border-gray-800 rounded-b-xl rounded-tr-xl overflow-hidden">
        {/* Panel header */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 border-b border-gray-700">
          <span className="text-xs text-gray-400 font-mono">{activeFileConfig.filename}</span>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="text-xs px-3 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
            >
              {copied ? "✅ Copied!" : "📋 Copy"}
            </button>
            <button
              onClick={handleDownload}
              className="text-xs px-3 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
            >
              ⬇️ Download
            </button>
          </div>
        </div>

        {/* Syntax highlighted content */}
        {content ? (
          <SyntaxHighlighter
            language={activeFileConfig.language}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              padding: "1rem",
              background: "transparent",
              fontSize: "0.8rem",
              maxHeight: "500px",
              overflowY: "auto",
            }}
            showLineNumbers
          >
            {content}
          </SyntaxHighlighter>
        ) : (
          <div className="p-8 text-center text-gray-500 text-sm">
            This file could not be generated. Check the server logs for details.
          </div>
        )}
      </div>

      {/* ---- Usage note ---- */}
      <div className="mt-4 p-4 rounded-lg bg-indigo-900/20 border border-indigo-800/50 text-sm text-indigo-300">
        <strong>What to do with these files?</strong>
        <ul className="mt-2 space-y-1 list-disc list-inside text-indigo-200/80">
          <li>
            <strong>Dockerfile</strong> — Place in your project root. Run{" "}
            <code className="bg-indigo-900/50 px-1 rounded">docker build -t {projectInfo.repo} .</code>
          </li>
          <li>
            <strong>GitHub Actions</strong> — Create{" "}
            <code className="bg-indigo-900/50 px-1 rounded">.github/workflows/ci-cd.yml</code> in your repo.
          </li>
          <li>
            <strong>Kubernetes</strong> — Apply with{" "}
            <code className="bg-indigo-900/50 px-1 rounded">kubectl apply -f deployment.yaml -f service.yaml</code> after updating the image name.
          </li>
        </ul>
      </div>
    </div>
  );
}
