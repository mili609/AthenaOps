// ============================================================
// routes/generateDockerfileSimple.js
// POST /generate-dockerfile
// ============================================================
// Simplified endpoint — accepts only { projectType } and returns
// a plain-text Dockerfile ready to display in the code preview panel.
// Uses local templates for known types; falls back to AI for unknowns.

const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { askAI } = require("../services/aiService");
const dockerfileTemplates = require("../../../ai-engine/generators/dockerfile");

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
 * POST /generate-dockerfile
 * Body:  { "projectType": "node" }
 * Returns: plain-text Dockerfile
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
  const templateFn = dockerfileTemplates[projectType];
  if (templateFn) {
    const context = DEFAULT_CONTEXT[projectType] || {};
    const dockerfile = templateFn(context);
    return res.type("text/plain").send(dockerfile);
  }

  // 2. Fall back to AI for unrecognised project types
  try {
    const systemPrompt = `You are a DevOps expert who writes production-ready Dockerfiles.
Output ONLY the Dockerfile content — no markdown fences, no explanations, just the raw file.
Include helpful inline comments so the Dockerfile is easy to understand.`;

    const userPrompt = `Generate a production-ready, multi-stage Dockerfile for a "${projectType}" project.
Keep the final image as small as possible. Expose the appropriate port. Include a CMD instruction.`;

    const dockerfile = await askAI(systemPrompt, userPrompt);
    return res.type("text/plain").send(dockerfile);
  } catch (err) {
    console.error("generateDockerfileSimple error:", err.message);
    return res.status(500).type("text/plain").send(
      `# Error generating Dockerfile for project type: ${projectType}\n# ${err.message}`
    );
  }
});

module.exports = router;
