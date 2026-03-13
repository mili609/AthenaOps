// ============================================================
// routes/generateDockerfile.js
// POST /api/generate-dockerfile
// ============================================================
// Generates a Dockerfile for the detected project type.
// Uses local templates first; falls back to AI for unknown types.

const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { askAI } = require("../services/aiService");
const dockerfileTemplates = require("../../../ai-engine/generators/dockerfile");

const validateRequest = [
  body("projectType").trim().notEmpty().withMessage("projectType is required."),
  body("language").trim().notEmpty().withMessage("language is required."),
  body("framework").optional().trim(),
  body("repoName").optional().trim(),
];

/**
 * POST /api/generate-dockerfile
 * Body: {
 *   projectType: "node",
 *   language: "JavaScript/TypeScript",
 *   framework: "Next.js",
 *   repoName: "my-app"   // optional
 * }
 *
 * Returns: { dockerfile: "FROM node:18-alpine\n..." }
 */
router.post("/", validateRequest, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { projectType, language, framework, repoName = "app" } = req.body;

  try {
    // 1. Try local template first (fast, no API cost)
    const templateFn = dockerfileTemplates[projectType];
    if (templateFn) {
      const dockerfile = templateFn({ framework, repoName });
      return res.json({ success: true, dockerfile, source: "template" });
    }

    // 2. Fall back to AI generation for unknown project types
    const systemPrompt = `You are a DevOps expert who specialises in writing production-ready Dockerfiles.
Always output ONLY the Dockerfile content — no markdown fences, no explanations, just the raw file content.
Include helpful inline comments so beginners can understand each step.`;

    const userPrompt = `Generate a production-ready Dockerfile for a ${framework || language} project.
Project details:
- Language: ${language}
- Framework: ${framework || "N/A"}
- Project name: ${repoName}
Include multi-stage builds where appropriate to keep the image small.`;

    const dockerfile = await askAI(systemPrompt, userPrompt);
    res.json({ success: true, dockerfile, source: "ai" });
  } catch (err) {
    console.error("generateDockerfile error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
