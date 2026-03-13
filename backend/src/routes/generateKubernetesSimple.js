// ============================================================
// routes/generateKubernetesSimple.js
// POST /generate-kubernetes
// ============================================================
// Simplified endpoint — accepts only { projectType } and returns
//   { deployment: "<deployment.yaml>", service: "<service.yaml>" }
// so the frontend can display each manifest in its own code tab.

const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { askAI } = require("../services/aiService");
const kubernetesTemplates = require("../../../ai-engine/generators/kubernetes");

// Default app name and replica count used when only projectType is supplied
const DEFAULTS = {
  repoName: "app",
  replicas: 2,
};

const validateRequest = [
  body("projectType")
    .trim()
    .notEmpty()
    .withMessage("projectType is required.")
    .customSanitizer((val) => val.toLowerCase()),
  body("repoName")
    .optional()
    .trim()
    .customSanitizer((val) => val || DEFAULTS.repoName),
  body("replicas")
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage("replicas must be between 1 and 20.")
    .toInt(),
];

/**
 * POST /generate-kubernetes
 * Body:  { "projectType": "node", "repoName": "my-app", "replicas": 3 }
 *        (repoName and replicas are optional)
 *
 * Returns JSON:
 * {
 *   "deployment": "# deployment.yaml\n...",
 *   "service":    "# service.yaml\n..."
 * }
 */
router.post("/", validateRequest, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    projectType,
    repoName = DEFAULTS.repoName,
    replicas = DEFAULTS.replicas,
  } = req.body;

  // 1. Try a local template (instant, no API cost)
  const templateFn = kubernetesTemplates[projectType] || kubernetesTemplates["default"];
  if (templateFn) {
    const { deployment, service } = templateFn({ repoName, replicas });
    return res.json({ deployment, service });
  }

  // 2. Fall back to AI for unrecognised project types
  try {
    const systemPrompt = `You are a Kubernetes expert.
Output ONLY a valid JSON object with two keys: "deployment" and "service".
Each value must be a raw YAML string for the respective Kubernetes manifest.
No markdown fences, no extra explanation — just the JSON object.`;

    const userPrompt = `Generate Kubernetes manifests for a "${projectType}" app named "${repoName}".
Requirements:
- deployment.yaml: Deployment with ${replicas} replicas, correct containerPort, resource requests/limits, liveness probe, readiness probe
- service.yaml: Service of type ClusterIP on port 80 targeting the application port
Respond with: { "deployment": "<yaml>", "service": "<yaml>" }`;

    const raw = await askAI(systemPrompt, userPrompt);

    let deployment, service;
    try {
      ({ deployment, service } = JSON.parse(raw));
    } catch {
      // AI returned plain YAML — expose it as deployment, stub service
      deployment = raw;
      service = `# Could not generate service.yaml automatically.\n# Create a Service targeting the port exposed by ${repoName}.`;
    }

    return res.json({ deployment, service });
  } catch (err) {
    console.error("generateKubernetesSimple error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
