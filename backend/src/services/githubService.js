// ============================================================
// githubService.js - GitHub API integration
// ============================================================
// Fetches repository data (file tree, README, etc.) from GitHub.

const axios = require("axios");

const GITHUB_API = "https://api.github.com";

/**
 * Returns the Axios config with auth headers (if token is set).
 */
function getHeaders() {
  const headers = { Accept: "application/vnd.github.v3+json" };
  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return { headers };
}

/**
 * Parses a GitHub URL and returns { owner, repo }.
 * Supports: https://github.com/owner/repo and https://github.com/owner/repo.git
 * @param {string} repoUrl
 * @returns {{ owner: string, repo: string }}
 */
function parseGitHubUrl(repoUrl) {
  try {
    const url = new URL(repoUrl);
    const parts = url.pathname.replace(/^\//, "").replace(/\.git$/, "").split("/");
    if (parts.length < 2) throw new Error("Invalid GitHub URL format.");
    return { owner: parts[0], repo: parts[1] };
  } catch {
    throw new Error(`Could not parse GitHub URL: "${repoUrl}". Expected format: https://github.com/owner/repo`);
  }
}

/**
 * Fetches basic repository metadata.
 * @param {string} owner
 * @param {string} repo
 */
async function getRepoInfo(owner, repo) {
  const { data } = await axios.get(`${GITHUB_API}/repos/${owner}/${repo}`, getHeaders());
  return {
    name: data.name,
    description: data.description,
    language: data.language,
    defaultBranch: data.default_branch,
    stars: data.stargazers_count,
    isPrivate: data.private,
    htmlUrl: data.html_url,
  };
}

/**
 * Fetches the list of files and folders at the root of the repository.
 * @param {string} owner
 * @param {string} repo
 * @param {string} branch - The default branch name
 * @returns {string[]} - Array of file/folder names
 */
async function getRootFiles(owner, repo, branch = "main") {
  try {
    const { data } = await axios.get(
      `${GITHUB_API}/repos/${owner}/${repo}/contents/`,
      { ...getHeaders(), params: { ref: branch } }
    );
    return data.map((item) => item.name);
  } catch (err) {
    // Some repos use "master" as default branch — retry once
    if (err.response?.status === 404 && branch === "main") {
      const { data } = await axios.get(
        `${GITHUB_API}/repos/${owner}/${repo}/contents/`,
        { ...getHeaders(), params: { ref: "master" } }
      );
      return data.map((item) => item.name);
    }
    throw err;
  }
}

/**
 * Fetches the full file tree (recursive) so we can build a complete picture
 * of the repository structure.
 * @param {string} owner
 * @param {string} repo
 * @param {string} branch
 * @returns {string[]} - Array of all file paths in the repo
 */
async function getFullFileTree(owner, repo, branch = "main") {
  try {
    const { data } = await axios.get(
      `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
      getHeaders()
    );
    return data.tree.map((item) => item.path);
  } catch {
    // Return empty array if tree cannot be fetched
    return [];
  }
}

/**
 * Fetch a text file from repository root and decode its contents.
 * Returns null when the file does not exist.
 * @param {string} owner
 * @param {string} repo
 * @param {string} filePath
 * @param {string} branch
 * @returns {Promise<string|null>}
 */
async function getFileContent(owner, repo, filePath, branch = "main") {
  try {
    const { data } = await axios.get(
      `${GITHUB_API}/repos/${owner}/${repo}/contents/${filePath}`,
      { ...getHeaders(), params: { ref: branch } }
    );

    if (!data || data.type !== "file" || !data.content) {
      return null;
    }

    return Buffer.from(data.content, "base64").toString("utf8");
  } catch (err) {
    if (err.response?.status === 404) {
      return null;
    }
    throw err;
  }
}

module.exports = {
  parseGitHubUrl,
  getRepoInfo,
  getRootFiles,
  getFullFileTree,
  getFileContent,
};
