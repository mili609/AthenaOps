// ============================================================
// extractDependencies.js - Extract dependencies by project type
// ============================================================

/**
 * Extract Node.js dependencies from package.json content.
 * @param {string} content
 * @returns {string[]}
 */
function extractNodeDependencies(content) {
  try {
    const pkg = JSON.parse(content);
    const deps = Object.keys(pkg.dependencies || {});
    const devDeps = Object.keys(pkg.devDependencies || {});
    return [...new Set([...deps, ...devDeps])];
  } catch {
    return [];
  }
}

/**
 * Extract Python dependencies from requirements.txt content.
 * @param {string} content
 * @returns {string[]}
 */
function extractPythonDependencies(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => line.split(/[=<>!~]/)[0].trim())
    .filter(Boolean);
}

/**
 * Extract Java dependencies from pom.xml content (artifactId values).
 * @param {string} content
 * @returns {string[]}
 */
function extractJavaDependencies(content) {
  const matches = [...content.matchAll(/<artifactId>([^<]+)<\/artifactId>/g)];
  const values = matches.map((m) => m[1].trim()).filter(Boolean);

  // Remove likely non-dependency artifact ids (project/build ids)
  const filtered = values.filter(
    (v) => !["project", "parent", "plugins", "plugin", "dependencies"].includes(v.toLowerCase())
  );

  return [...new Set(filtered)];
}

/**
 * Extract dependencies for supported project types.
 * @param {string} projectType - node | python | java | unknown
 * @param {{ packageJson?: string|null, requirementsTxt?: string|null, pomXml?: string|null }} manifests
 * @returns {string[]}
 */
function extractDependencies(projectType, manifests) {
  if (projectType === "node" && manifests.packageJson) {
    return extractNodeDependencies(manifests.packageJson);
  }

  if (projectType === "python" && manifests.requirementsTxt) {
    return extractPythonDependencies(manifests.requirementsTxt);
  }

  if (projectType === "java" && manifests.pomXml) {
    return extractJavaDependencies(manifests.pomXml);
  }

  return [];
}

module.exports = {
  extractDependencies,
  extractNodeDependencies,
  extractPythonDependencies,
  extractJavaDependencies,
};
