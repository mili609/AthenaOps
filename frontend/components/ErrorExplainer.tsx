"use client";
// ============================================================
// components/ErrorExplainer.tsx
// ============================================================
// Accepts a build or deployment error log and calls the backend
// to get an AI-generated explanation with fix steps.

import { useState } from "react";
import axios from "axios";
import API_BASE from "@/lib/apiConfig";

interface ExplanationResult {
  explanation: string;
  rootCause: string;
  fixSteps: string[];
}

export default function ErrorExplainer() {
  const [errorLog, setErrorLog]     = useState("");
  const [context, setContext]       = useState("");
  const [result, setResult]         = useState<ExplanationResult | null>(null);
  const [isLoading, setIsLoading]   = useState(false);
  const [error, setError]           = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!errorLog.trim()) return;

    setError(null);
    setResult(null);
    setIsLoading(true);

    try {
      const { data } = await axios.post(`${API_BASE}/explain-error`, {
        errorLog: errorLog.trim(),
        context: context.trim() || undefined,
      });
      setResult(data);
    } catch (err: any) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.errors?.[0]?.msg ||
        "Failed to explain error. Make sure the backend is running and OPENAI_API_KEY is set.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  // Example error logs for quick testing
  const exampleErrors = [
    {
      label: "npm module not found",
      log: `npm ERR! code MODULE_NOT_FOUND\nnpm ERR! require() of ES Module not supported\nError: Cannot find module 'express'\nRequire stack:\n- /app/src/index.js`,
    },
    {
      label: "Docker build fail",
      log: `Step 3/6 : RUN npm ci\n ---> Running in a3b7c8d9e0f1\nnpm WARN saveError ENOENT: no such file or directory, open '/app/package-lock.json'\nnpm notice created a lockfile as package-lock.json. You should commit this file.\nnpm WARN enoent ENOENT: no such file or directory, open '/app/package.json'\nThe command '/bin/sh -c npm ci' returned a non-zero code: 254`,
    },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-white">AI Error Explainer</h2>
        <p className="text-gray-400 mt-1 text-sm">
          Paste your build or deployment error log and get a plain-English explanation with fix steps.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Optional context */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="context">
            Context <span className="text-gray-500 font-normal">(optional)</span>
          </label>
          <input
            id="context"
            type="text"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="e.g. Running npm start on a Node.js Docker container"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Error log textarea */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="errorLog">
            Error Log <span className="text-red-400">*</span>
          </label>
          <textarea
            id="errorLog"
            value={errorLog}
            onChange={(e) => setErrorLog(e.target.value)}
            placeholder="Paste your error log here…"
            rows={10}
            required
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
          />
        </div>

        {/* Example buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <span className="text-xs text-gray-500">Load example:</span>
          {exampleErrors.map((ex) => (
            <button
              key={ex.label}
              type="button"
              onClick={() => setErrorLog(ex.log)}
              className="text-xs px-2.5 py-1 rounded-md bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            >
              {ex.label}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={isLoading || !errorLog.trim()}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <><span className="animate-spin">⏳</span> Analysing error…</>
          ) : (
            <>🔎 Explain This Error</>
          )}
        </button>
      </form>

      {/* Error banner */}
      {error && (
        <div className="mt-4 p-4 rounded-lg bg-red-900/40 border border-red-700 text-red-300 text-sm">
          <strong>Error: </strong>{error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="mt-6 space-y-4">
          {/* Explanation */}
          <div className="p-5 bg-gray-900 border border-gray-800 rounded-xl">
            <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-2">
              What happened
            </h3>
            <p className="text-gray-200 text-sm leading-relaxed">{result.explanation}</p>
          </div>

          {/* Root cause */}
          <div className="p-5 bg-gray-900 border border-yellow-800/50 rounded-xl">
            <h3 className="text-sm font-semibold text-yellow-400 uppercase tracking-wider mb-2">
              Root Cause
            </h3>
            <p className="text-gray-200 text-sm leading-relaxed">{result.rootCause}</p>
          </div>

          {/* Fix steps */}
          <div className="p-5 bg-gray-900 border border-green-800/50 rounded-xl">
            <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-3">
              How to Fix
            </h3>
            <ol className="space-y-2">
              {result.fixSteps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-200">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-green-900/60 text-green-300 text-xs flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{step.replace(/^Step \d+:\s*/i, "")}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
