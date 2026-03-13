// ============================================================
// routes/generateKubernetes.js
// POST /api/generate-kubernetes
// ============================================================
// Generates Kubernetes deployment + service YAML files.

const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { askAI } = require("../services/aiService");
const kubernetesTemplates = require("../../../ai-engine/generators/kubernetes");

const validateRequest = [
  body("repoName").trim().notEmpty().withMessage("repoName is required."),
  body("projectType").trim().notEmpty().withMessage("projectType is required."),
  body("port").optional().isInt({ min: 1, max: 65535 }).withMessage("port must be a number between 1 and 65535."),
  body("replicas").optional().isInt({ min: 1, max: 20 }).withMessage("replicas must be between 1 and 20."),
];

/**
 * POST /api/generate-kubernetes
 * Body: {
 *   repoName: "my-app",
 *   projectType: "node",
 *   port: 3000,       // optional, default 3000
 *   replicas: 2       // optional, default 2
 * }
 *
 * Returns: { kubernetesYaml: "apiVersion: apps/v1\n..." }
 */
router.post("/", validateRequest, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { repoName, projectType, port = 3000, replicas = 2 } = req.body;

  try {
    // 1. Try local template first
    const templateFn = kubernetesTemplates[projectType] || kubernetesTemplates["default"];
    if (templateFn) {
      const { deployment, service } = templateFn({ repoName, port, replicas });
      return res.json({ success: true, deployment, service, source: "template" });
    }

    // 2. Fall back to AI
    const systemPrompt = `You are a Kubernetes expert. Output ONLY the raw YAML content — no markdown fences, no explanations.
Include helpful comments so beginners understand each section.
Return a JSON object with two keys: "deployment" and "service", each containing a separate YAML string.`;

    const userPrompt = `Generate Kubernetes manifests for a ${projectType} app named "${repoName}".
Return two separate YAML strings:
1. deployment.yaml — Deployment with ${replicas} replicas, containerPort ${port}, resource limits, liveness probe, readiness probe
2. service.yaml — Service of type ClusterIP on port 80 targeting ${port}
Respond ONLY with a JSON object: { "deployment": "...", "service": "..." }`;

    const raw = await askAI(systemPrompt, userPrompt);
    let deployment, service;
    try {
      ({ deployment, service } = JSON.parse(raw));
    } catch {
      // AI returned raw YAML rather than JSON — treat it as deployment only
      deployment = raw;
      service = "";
    }
    res.json({ success: true, deployment, service, source: "ai" });
  } catch (err) {
    console.error("generateKubernetes error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
