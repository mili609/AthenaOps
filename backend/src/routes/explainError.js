// ============================================================
// routes/explainError.js
// POST /api/explain-error
// ============================================================
// Accepts a build/deployment error log and uses AI to explain
// what went wrong and how to fix it, in plain English.

const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { askAI } = require("../services/aiService");

const validateRequest = [
  body("errorLog")
    .trim()
    .notEmpty().withMessage("errorLog is required.")
    .isLength({ max: 8000 }).withMessage("errorLog must be under 8000 characters."),
  body("context").optional().trim().isLength({ max: 500 }),
];

/**
 * POST /api/explain-error
 * Body: {
 *   errorLog: "Error: Cannot find module 'express'...",
 *   context: "Running npm start on a Node.js app"   // optional
 * }
 *
 * Returns: {
 *   explanation: "...",
 *   rootCause: "...",
 *   fixSteps: ["...", "..."]
 * }
 */
router.post("/", validateRequest, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { errorLog, context } = req.body;

  const systemPrompt = `You are a senior DevOps engineer and debugging expert.
When given an error log, you:
1. Explain what went wrong in simple, plain English (no jargon overload).
2. Identify the root cause clearly.
3. Provide numbered step-by-step fix instructions.

Always respond in this exact JSON format (no extra text outside the JSON):
{
  "explanation": "A clear, beginner-friendly explanation of the error.",
  "rootCause": "The specific root cause in one or two sentences.",
  "fixSteps": [
    "Step 1: ...",
    "Step 2: ..."
  ]
}`;

  const userPrompt = `${context ? `Context: ${context}\n\n` : ""}Error log:
\`\`\`
${errorLog}
\`\`\``;

  try {
    const rawResponse = await askAI(systemPrompt, userPrompt);

    // Parse the JSON response from the AI
    let parsed;
    try {
      // Strip any accidental markdown fences the AI might add
      const cleaned = rawResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // If parsing fails, return the raw text in a consistent shape
      parsed = {
        explanation: rawResponse,
        rootCause: "Could not extract root cause automatically.",
        fixSteps: ["Please review the explanation above for manual steps."],
      };
    }

    res.json({ success: true, ...parsed });
  } catch (err) {
    console.error("explainError error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
