export interface ProjectInfo {
  owner: string;
  repo: string;
  repoInfo: {
    name: string;
    description: string | null;
    language: string | null;
    defaultBranch: string;
    stars: number;
  };
  rootFiles: string[];
  projectType: {
    type: string;
    language: string;
    framework: string;
  };
  recommendations?: string[];
}

export interface GeneratedFiles {
  dockerfile?: string;
  dockerCompose?: string;
  cicdYaml?: string;
  deploymentYaml?: string;
  serviceYaml?: string;
}

export interface ErrorAnalysisResult {
  problem: string;
  explanation: string;
  solution: string;
  source?: string;
}

export type DashboardSection = "repo" | "generator" | "error";
