// ============================================================
// routes/generateCICDSimple.js
// POST /generate-cicd
// ============================================================
// Simplified endpoint — accepts only { projectType } and returns
// a plain-text GitHub Actions YAML workflow ready for the code
// preview panel.  Uses local templates for known types; falls
// back to AI for unknown types.

const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { askAI } = require("../services/aiService");
const cicdTemplates = require("../../../ai-engine/generators/cicd");

// Default framework hints so templates render sensibly with just a projectType
const DEFAULT_CONTEXT = {
  node:   { framework: "Node.js" },
  python: { framework: "Python" },
  java:   { framework: "Maven / Spring Boot" },
  go:     { framework: "Go" },
  ruby:   { framework: "Ruby" },
  php:    { framework: "PHP" },
  rust:   { framework: "Rust" },
  dotnet: { framework: ".NET" },
  static: { framework: "Static" },
};

const validateRequest = [
  body("projectType")
    .trim()
    .notEmpty()
    .withMessage("projectType is required.")
    .customSanitizer((val) => val.toLowerCase()),
];

/**
 * POST /generate-cicd
 * Body:  { "projectType": "node" }
 * Returns: plain-text GitHub Actions YAML workflow
 *
 * The returned YAML is intended to be saved as:
 *   .github/workflows/ci-cd.yml
 */
router.post("/", validateRequest, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).type("text/plain").send(
      errors.array().map((e) => e.msg).join("\n")
    );
  }

  const { projectType } = req.body;

  // 1. Try a local template (instant, no API cost)
  const templateFn = cicdTemplates[projectType];
  if (templateFn) {
    const context = DEFAULT_CONTEXT[projectType] || {};
    const yaml = templateFn(context);
    return res.type("text/plain").send(yaml);
  }

  // 2. Fall back to AI for unrecognised project types
  try {
    const systemPrompt = `You are a DevOps expert who writes production-ready GitHub Actions CI/CD pipelines.
Output ONLY the YAML content of the workflow file — no markdown fences, no explanations.
Include helpful inline comments so the workflow is easy to understand.`;

    const userPrompt = `Generate a complete GitHub Actions CI/CD workflow for a "${projectType}" project.
Requirements:
- Trigger on push and pull_request to the main branch
- Job 1 "build-and-test": checkout code, install dependencies, build the project, run tests
- Job 2 "docker-build-push": runs only on push to main, after build-and-test succeeds
  - Log in to GitHub Container Registry (ghcr.io) using GITHUB_TOKEN
  - Use docker/metadata-action to generate tags (latest, sha-)
  - Use docker/build-push-action to build and push the image
Save the file as .github/workflows/ci-cd.yml`;

    const yaml = await askAI(systemPrompt, userPrompt);
    return res.type("text/plain").send(yaml);
  } catch (err) {
    console.error("generateCICDSimple error:", err.message);
    return res.status(500).type("text/plain").send(
      `# Error generating CI/CD pipeline for project type: ${projectType}\n# ${err.message}`
    );
  }
});

module.exports = router;
