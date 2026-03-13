"use client";
// ============================================================
// components/RepoInput.tsx
// ============================================================
// Input form where the user enters their GitHub repository URL.

import { useState } from "react";

interface Props {
  onAnalyse: (repoUrl: string) => void;
  isLoading: boolean;
}

export default function RepoInput({ onAnalyse, isLoading }: Props) {
  const [url, setUrl] = useState("");
  const [validationError, setValidationError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");

    const trimmed = url.trim();

    // Basic client-side validation
    if (!trimmed) {
      setValidationError("Please enter a GitHub repository URL.");
      return;
    }
    if (!trimmed.startsWith("https://github.com/")) {
      setValidationError("URL must start with https://github.com/");
      return;
    }
    const parts = trimmed.replace("https://github.com/", "").split("/").filter(Boolean);
    if (parts.length < 2) {
      setValidationError("URL must be in the format https://github.com/owner/repo");
      return;
    }

    onAnalyse(trimmed);
  }

  // Example repos the user can click to prefill
  const exampleRepos = [
    { label: "Node.js Express", url: "https://github.com/expressjs/express" },
    { label: "Python Flask", url: "https://github.com/pallets/flask" },
    { label: "Next.js", url: "https://github.com/vercel/next.js" },
  ];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <form onSubmit={handleSubmit}>
        <label htmlFor="repoUrl" className="block text-sm font-medium text-gray-300 mb-2">
          GitHub Repository URL
        </label>

        <div className="flex gap-3">
          <div className="flex-1 relative">
            {/* GitHub icon prefix */}
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 select-none">
              🔗
            </span>
            <input
              id="repoUrl"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/owner/repository"
              disabled={isLoading}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="animate-spin inline-block">⏳</span> Analysing…
              </>
            ) : (
              <>🔍 Analyse Repo</>
            )}
          </button>
        </div>

        {/* Validation error */}
        {validationError && (
          <p className="mt-2 text-xs text-red-400">{validationError}</p>
        )}
      </form>

      {/* Example repos */}
      <div className="mt-4 flex items-center flex-wrap gap-2">
        <span className="text-xs text-gray-500">Try an example:</span>
        {exampleRepos.map((ex) => (
          <button
            key={ex.url}
            onClick={() => setUrl(ex.url)}
            disabled={isLoading}
            className="text-xs px-2.5 py-1 rounded-md bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {ex.label}
          </button>
        ))}
      </div>
    </div>
  );
}
