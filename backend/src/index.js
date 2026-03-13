// ============================================================
// AthenaOps Backend - Main Server Entry Point
// ============================================================
// This file starts the Express server and registers all routes.

require("dotenv").config();
const express = require("express");
const cors = require("cors");

const analyzeRepoRoute = require("./routes/analyzeRepo");
const generateDockerfileRoute = require("./routes/generateDockerfile");
const generateDockerfileSimpleRoute = require("./routes/generateDockerfileSimple");
const generateCICDRoute = require("./routes/generateCICD");
const generateCICDSimpleRoute = require("./routes/generateCICDSimple");
const generateKubernetesRoute = require("./routes/generateKubernetes");
const generateKubernetesSimpleRoute = require("./routes/generateKubernetesSimple");
const explainErrorRoute = require("./routes/explainError");
const analyzeErrorRoute = require("./routes/analyzeError");

const app = express();
const PORT = process.env.PORT || 5000;

// ---- Middleware ----
app.use(cors()); // Allow requests from the frontend
app.use(express.json()); // Parse incoming JSON bodies

// ---- Health Check ----
app.get("/", (req, res) => {
  res.json({ message: "AthenaOps API is running!", version: "1.0.0" });
});

// ---- API Routes ----
app.use("/api/analyze-repo", analyzeRepoRoute);
app.use("/analyze-repo", analyzeRepoRoute);
app.use("/api/generate-dockerfile", generateDockerfileRoute);
app.use("/generate-dockerfile", generateDockerfileSimpleRoute);
app.use("/api/generate-cicd", generateCICDRoute);
app.use("/generate-cicd", generateCICDSimpleRoute);
app.use("/api/generate-kubernetes", generateKubernetesRoute);
app.use("/generate-kubernetes", generateKubernetesSimpleRoute);
app.use("/api/explain-error", explainErrorRoute);
app.use("/analyze-error", analyzeErrorRoute);

// ---- Global Error Handler ----
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ error: "Internal server error", details: err.message });
});

// ---- Start Server ----
app.listen(PORT, () => {
  console.log(`AthenaOps backend running on http://localhost:${PORT}`);
});
