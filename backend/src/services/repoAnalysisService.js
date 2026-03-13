// ============================================================
// repoAnalysisService.js - Orchestrates repository analysis
// ============================================================

const {
  parseGitHubUrl,
  getRepoInfo,
  getRootFiles,
  getFullFileTree,
  getFileContent,
} = require("./githubService");
const { detectProjectType } = require("../utils/detectProjectType");
const { extractDependencies } = require("../utils/extractDependencies");
const { recommendDevOpsSetup } = require("../utils/recommendDevOpsSetup");

/**
 * Human-readable project type label for API responses.
 * @param {string} type
 * @returns {string}
 */
function projectTypeLabel(type) {
  if (type === "node") return "Node.js";
  if (type === "python") return "Python";
  if (type === "java") return "Java";
  if (type === "go") return "Go";
  if (type === "dotnet") return ".NET";
  return "Unknown";
}

/**
 * Analyze a GitHub repository and return project insights.
 * @param {string} repoUrl
 */
async function analyzeRepository(repoUrl) {
  const { owner, repo } = parseGitHubUrl(repoUrl);

  const repoInfo = await getRepoInfo(owner, repo);
  const rootFiles = await getRootFiles(owner, repo, repoInfo.defaultBranch);
  const fullTree = await getFullFileTree(owner, repo, repoInfo.defaultBranch);

  const allFiles = [...new Set([...rootFiles, ...fullTree.map((p) => p.split("/").pop())])];
  const projectProfile = detectProjectType(allFiles);

  // Fetch manifest files for dependency extraction.
  const [packageJson, requirementsTxt, pomXml] = await Promise.all([
    getFileContent(owner, repo, "package.json", repoInfo.defaultBranch),
    getFileContent(owner, repo, "requirements.txt", repoInfo.defaultBranch),
    getFileContent(owner, repo, "pom.xml", repoInfo.defaultBranch),
  ]);

  const dependencies = extractDependencies(projectProfile.type, {
    packageJson,
    requirementsTxt,
    pomXml,
  });

  const recommendations = recommendDevOpsSetup(projectProfile.type);

  return {
    owner,
    repo,
    repoInfo,
    rootFiles,
    projectProfile,
    projectType: projectTypeLabel(projectProfile.type),
    dependencies,
    recommendations,
  };
}

module.exports = { analyzeRepository };
