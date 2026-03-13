// ============================================================
// recommendDevOpsSetup.js - DevOps recommendations by project type
// ============================================================

/**
 * Return beginner-friendly DevOps recommendations by project type.
 * @param {string} projectType - node | python | java | unknown
 * @returns {string[]}
 */
function recommendDevOpsSetup(projectType) {
  const base = [
    "Create Dockerfile",
    "Add CI/CD pipeline",
    "Add Kubernetes deployment YAML",
  ];

  if (projectType === "node") {
    return [
      ...base,
      "Use npm ci in CI for reproducible builds",
      "Run unit tests before deployment",
    ];
  }

  if (projectType === "python") {
    return [
      ...base,
      "Pin dependency versions in requirements.txt",
      "Use a slim Python base image",
    ];
  }

  if (projectType === "java") {
    return [
      ...base,
      "Use a multi-stage Maven Docker build",
      "Run Maven tests in CI before deploy",
    ];
  }

  return [
    ...base,
    "Review repository manually for custom runtime requirements",
  ];
}

module.exports = { recommendDevOpsSetup };
