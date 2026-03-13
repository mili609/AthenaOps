"use client";

import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface CodePreviewPanelProps {
  filename: string;
  language: string;
  content: string;
}

export default function CodePreviewPanel({ filename, language, content }: CodePreviewPanelProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  function handleDownload() {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename.split("/").pop() || "config.txt";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/90">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
        <p className="code-font text-xs text-slate-400">{filename}</p>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="rounded-md border border-slate-700 px-2.5 py-1 text-xs text-slate-300 transition-colors hover:border-cyan-700 hover:text-cyan-300"
          >
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            onClick={handleDownload}
            className="rounded-md border border-slate-700 px-2.5 py-1 text-xs text-slate-300 transition-colors hover:border-emerald-700 hover:text-emerald-300"
          >
            Download
          </button>
        </div>
      </div>

      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        showLineNumbers
        customStyle={{
          margin: 0,
          borderRadius: 0,
          background: "transparent",
          minHeight: "320px",
          maxHeight: "560px",
          fontSize: "12px",
        }}
      >
        {content || "// No file generated yet"}
      </SyntaxHighlighter>
    </div>
  );
}
