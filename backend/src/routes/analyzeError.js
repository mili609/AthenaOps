// ============================================================
// routes/analyzeError.js
// POST /analyze-error
// ============================================================
// Analyzes a build or deployment error log and returns a
// structured diagnosis: { problem, explanation, solution }.
//
// Strategy:
//   1. Rule-based pattern matching (instant, no API cost)
//      Covers ~25 of the most common build/deploy errors.
//   2. AI fallback (OpenAI) for anything unrecognised.

const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { askAI } = require("../services/aiService");
const { matchErrorPattern } = require("../utils/errorPatterns");

const validateRequest = [
  body("errorLog")
    .trim()
    .notEmpty()
    .withMessage("errorLog is required.")
    .isLength({ max: 10000 })
    .withMessage("errorLog must be under 10 000 characters."),
];

/**
 * POST /analyze-error
 * Body:  { "errorLog": "Error: Cannot find module 'express'..." }
 *
 * Returns:
 * {
 *   "problem":     "Missing module: express",
 *   "explanation": "Node.js cannot find the module...",
 *   "solution":    "Run `npm install express`...",
 *   "source":      "pattern" | "ai"
 * }
 */
router.post("/", validateRequest, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { errorLog } = req.body;

  // ---- 1. Fast rule-based match ----
  const patternResult = matchErrorPattern(errorLog);
  if (patternResult) {
    return res.json({ ...patternResult, source: "pattern" });
  }

  // ---- 2. AI fallback ----
  const systemPrompt = `You are a senior DevOps engineer and debugging expert specialising in build and deployment errors.

Analyse the error log provided and respond ONLY with a JSON object in this exact shape — no extra text, no markdown fences:
{
  "problem":     "A short one-line title identifying the problem",
  "explanation": "A clear, beginner-friendly explanation of why this error occurs",
  "solution":    "Concrete, numbered steps the developer should take to fix it"
}`;

  const userPrompt = `Analyse this build/deployment error log and return the diagnosis JSON:

\`\`\`
${errorLog}
\`\`\``;

  try {
    const raw = await askAI(systemPrompt, userPrompt);

    let parsed;
    try {
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // AI returned prose instead of JSON — shape it gracefully
      parsed = {
        problem: "Unrecognised error",
        explanation: raw,
        solution: "Review the explanation above and consult the documentation for the tool that produced this error.",
      };
    }

    return res.json({ ...parsed, source: "ai" });
  } catch (err) {
    console.error("analyzeError error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
