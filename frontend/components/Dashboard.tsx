"use client";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";
import API_BASE from "@/lib/apiConfig";
import Navbar from "./Navbar";
import SidebarNav from "./SidebarNav";
import DashboardCards from "./DashboardCards";
import RepositoryAnalyzer from "./RepositoryAnalyzer";
import DevOpsFileGenerator from "./DevOpsFileGenerator";
import ErrorAnalyzer from "./ErrorAnalyzer";
import type {
  DashboardSection,
  ErrorAnalysisResult,
  GeneratedFiles,
  ProjectInfo,
} from "./dashboardTypes";

const API_ROOT = API_BASE.endsWith("/api") ? API_BASE.slice(0, -4) : API_BASE;

function generateDockerComposeTemplate(repoName: string, projectType: string): string {
  const servicePort = projectType === "python" ? 8000 : projectType === "java" ? 8080 : 3000;

  return `version: "3.9"

services:
  ${repoName}:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: ${repoName}-service
    ports:
      - "${servicePort}:${servicePort}"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
`;
}

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState<DashboardSection>("repo");
  const [repoUrl, setRepoUrl] = useState("");
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFiles>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingDockerfile, setIsGeneratingDockerfile] = useState(false);
  const [isGeneratingCICD, setIsGeneratingCICD] = useState(false);
  const [isGeneratingKubernetes, setIsGeneratingKubernetes] = useState(false);
  const [repoError, setRepoError] = useState<string | null>(null);
  const [generatorError, setGeneratorError] = useState<string | null>(null);

  const [errorLog, setErrorLog] = useState("");
  const [errorResult, setErrorResult] = useState<ErrorAnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isErrorAnalyzing, setIsErrorAnalyzing] = useState(false);

  async function handleAnalyzeRepo() {
    if (!repoUrl.trim()) return;
    setRepoError(null);
    setProjectInfo(null);
    setGeneratedFiles({});
    setGeneratorError(null);
    setIsAnalyzing(true);

    try {
      const { data } = await axios.post(`${API_ROOT}/analyze-repo`, { repoUrl });
      setProjectInfo(data);
      setActiveSection("generator");
    } catch (err: any) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.errors?.[0]?.msg ||
        "Failed to analyse repository. Check the URL and try again.";
      setRepoError(message);
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleGenerateDockerfile() {
    if (!projectInfo) return;
    setGeneratorError(null);
    setIsGeneratingDockerfile(true);

    const projectType = projectInfo.projectType.type;

    try {
      const { data } = await axios.post(`${API_ROOT}/generate-dockerfile`, { projectType });
      setGeneratedFiles((prev) => ({
        ...prev,
        dockerfile: typeof data === "string" ? data : data?.dockerfile || "",
        dockerCompose: prev.dockerCompose || generateDockerComposeTemplate(projectInfo.repo, projectType),
      }));
    } catch (err: any) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.errors?.[0]?.msg ||
        "Failed to generate Dockerfile.";
      setGeneratorError(message);
    } finally {
      setIsGeneratingDockerfile(false);
    }
  }

  async function handleGenerateCICD() {
    if (!projectInfo) return;
    setGeneratorError(null);
    setIsGeneratingCICD(true);

    const projectType = projectInfo.projectType.type;

    try {
      const { data } = await axios.post(`${API_ROOT}/generate-cicd`, { projectType });
      setGeneratedFiles((prev) => ({
        ...prev,
        cicdYaml: typeof data === "string" ? data : data?.cicdYaml || "",
      }));
    } catch (err: any) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.errors?.[0]?.msg ||
        "Failed to generate CI/CD pipeline.";
      setGeneratorError(message);
    } finally {
      setIsGeneratingCICD(false);
    }
  }

  async function handleGenerateKubernetes() {
    if (!projectInfo) return;
    setGeneratorError(null);
    setIsGeneratingKubernetes(true);

    const projectType = projectInfo.projectType.type;

    try {
      const { data } = await axios.post(`${API_ROOT}/generate-kubernetes`, {
        projectType,
        repoName: projectInfo.repo,
      });

      setGeneratedFiles((prev) => ({
        ...prev,
        deploymentYaml: data?.deployment || "",
        serviceYaml: data?.service || "",
      }));
    } catch (err: any) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.errors?.[0]?.msg ||
        "Failed to generate Kubernetes config.";
      setGeneratorError(message);
    } finally {
      setIsGeneratingKubernetes(false);
    }
  }

  async function handleAnalyzeError() {
    if (!errorLog.trim()) return;
    setErrorResult(null);
    setErrorMessage(null);
    setIsErrorAnalyzing(true);

    try {
      const { data } = await axios.post(`${API_ROOT}/analyze-error`, {
        errorLog: errorLog.trim(),
      });
      setErrorResult({
        problem: data.problem,
        explanation: data.explanation,
        solution: data.solution,
        source: data.source,
      });
    } catch (err: any) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.errors?.[0]?.msg ||
        "Could not analyze logs. Make sure the backend and AI key are configured.";
      setErrorMessage(message);
    } finally {
      setIsErrorAnalyzing(false);
    }
  }

  const mainTitle = useMemo(() => {
    if (activeSection === "repo") return "Repository Analyzer";
    if (activeSection === "generator") return "DevOps File Generator";
    return "Error Analyzer";
  }, [activeSection]);

  const hasGeneratedFiles = Boolean(
    generatedFiles.dockerfile ||
      generatedFiles.dockerCompose ||
      generatedFiles.cicdYaml ||
      generatedFiles.deploymentYaml ||
      generatedFiles.serviceYaml
  );

  return (
    <div className="min-h-screen animated-grid">
      <Navbar />

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-10 pt-6 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-6"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">AthenaOps Dashboard</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-100 md:text-3xl">{mainTitle}</h1>
          <p className="mt-1 text-sm text-slate-400">
            AI-powered workspace for repository analysis, DevOps file generation, and error diagnosis.
          </p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-[16rem_1fr]">
          <SidebarNav activeSection={activeSection} onSelect={setActiveSection} />

          <div className="space-y-5">
            <DashboardCards />

            <AnimatePresence mode="wait">
              {activeSection === "repo" && (
                <motion.div
                  key="repo"
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -18 }}
                  transition={{ duration: 0.25 }}
                >
                  <RepositoryAnalyzer
                    repoUrl={repoUrl}
                    onRepoUrlChange={setRepoUrl}
                    onAnalyze={handleAnalyzeRepo}
                    isAnalyzing={isAnalyzing}
                    projectInfo={projectInfo}
                    error={repoError}
                  />
                </motion.div>
              )}

              {activeSection === "generator" && (
                <motion.div
                  key="generator"
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -18 }}
                  transition={{ duration: 0.25 }}
                >
                  <DevOpsFileGenerator
                    generatedFiles={generatedFiles}
                    onGenerateDockerfile={handleGenerateDockerfile}
                    onGenerateCICD={handleGenerateCICD}
                    onGenerateKubernetes={handleGenerateKubernetes}
                    isGeneratingDockerfile={isGeneratingDockerfile}
                    isGeneratingCICD={isGeneratingCICD}
                    isGeneratingKubernetes={isGeneratingKubernetes}
                    disabled={!projectInfo}
                  />
                  {!projectInfo && (
                    <p className="mt-3 text-sm text-amber-300">
                      Analyze a repository first to generate DevOps files.
                    </p>
                  )}
                  {generatorError && (
                    <p className="mt-3 text-sm text-rose-400">{generatorError}</p>
                  )}
                  {hasGeneratedFiles && (
                    <p className="mt-3 text-sm text-emerald-300">Files generated successfully.</p>
                  )}
                </motion.div>
              )}

              {activeSection === "error" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -18 }}
                  transition={{ duration: 0.25 }}
                >
                  <ErrorAnalyzer
                    errorLog={errorLog}
                    onErrorLogChange={setErrorLog}
                    onSubmit={handleAnalyzeError}
                    isLoading={isErrorAnalyzing}
                    error={errorMessage}
                    result={errorResult}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
