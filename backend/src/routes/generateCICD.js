// ============================================================
// routes/generateCICD.js
// POST /api/generate-cicd
// ============================================================
// Generates a GitHub Actions CI/CD workflow YAML file.

const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { askAI } = require("../services/aiService");
const cicdTemplates = require("../../../ai-engine/generators/cicd");

const validateRequest = [
  body("projectType").trim().notEmpty().withMessage("projectType is required."),
  body("language").trim().notEmpty().withMessage("language is required."),
  body("framework").optional().trim(),
  body("repoName").optional().trim(),
];

/**
 * POST /api/generate-cicd
 * Body: {
 *   projectType: "node",
 *   language: "JavaScript/TypeScript",
 *   framework: "Next.js",
 *   repoName: "my-app"
 * }
 *
 * Returns: { cicdYaml: "name: CI/CD Pipeline\n..." }
 */
router.post("/", validateRequest, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { projectType, language, framework, repoName = "app" } = req.body;

  try {
    // 1. Try local template first
    const templateFn = cicdTemplates[projectType];
    if (templateFn) {
      const cicdYaml = templateFn({ framework, repoName });
      return res.json({ success: true, cicdYaml, source: "template" });
    }

    // 2. Fall back to AI
    const systemPrompt = `You are a DevOps expert who specialises in GitHub Actions CI/CD pipelines.
Always output ONLY the YAML content of the workflow file — no markdown fences, no explanations.
Include helpful inline comments so beginners can understand each step.`;

    const userPrompt = `Generate a complete GitHub Actions CI/CD workflow file for a ${framework || language} project.
Project details:
- Language: ${language}
- Framework: ${framework || "N/A"}
- Project name: ${repoName}
Requirements:
- Run on push and pull_request to main branch
- Include install dependencies, build, and test steps
- Deploy step should be a placeholder with a comment explaining how to customise it`;

    const cicdYaml = await askAI(systemPrompt, userPrompt);
    res.json({ success: true, cicdYaml, source: "ai" });
  } catch (err) {
    console.error("generateCICD error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
