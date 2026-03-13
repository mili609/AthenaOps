// ============================================================
// routes/analyzeRepo.js
// POST /api/analyze-repo and POST /analyze-repo
// ============================================================
// Accepts a GitHub repository URL and returns project analysis,
// dependencies, and recommended DevOps setup.

const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { analyzeRepository } = require("../services/repoAnalysisService");

// Validation rules for the request body
const validateRequest = [
  body("repoUrl")
    .trim()
    .notEmpty().withMessage("repoUrl is required.")
    .isURL().withMessage("repoUrl must be a valid URL."),
];

/**
 * POST /api/analyze-repo
 * Body: { repoUrl: "https://github.com/owner/repo" }
 *
 * Returns:
 * {
 *   projectType,
 *   dependencies,
 *   recommendations
 * }
 */
router.post("/", validateRequest, async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { repoUrl } = req.body;

  try {
    const analysis = await analyzeRepository(repoUrl);

    res.json({
      projectType: analysis.projectType,
      dependencies: analysis.dependencies,
      recommendations: analysis.recommendations,

      // Extra metadata for debugging and future extension
      owner: analysis.owner,
      repo: analysis.repo,
      repoInfo: analysis.repoInfo,
      rootFiles: analysis.rootFiles,
      projectProfile: analysis.projectProfile,
    });
  } catch (err) {
    // Surface GitHub API errors clearly
    if (err.response?.status === 404) {
      return res.status(404).json({ error: "Repository not found. Make sure the URL is correct and the repo is public." });
    }
    if (err.response?.status === 403) {
      return res.status(403).json({ error: "GitHub API rate limit exceeded or access denied. Set a GITHUB_TOKEN in .env to increase rate limits." });
    }
    console.error("analyzeRepo error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
