// ============================================================
// detectProjectType.js - Detects the project type from file list
// ============================================================
// This utility looks at the list of files in a repo and returns
// the most likely project type (e.g. "node", "python", "java").

/**
 * Detects the project type based on files present in the repository.
 * @param {string[]} files - Array of file/folder names from the repo root
 * @returns {{ type: string, language: string, framework: string }}
 */
function detectProjectType(files) {
  const fileSet = new Set(files.map((f) => f.toLowerCase()));

  // ---- Node.js / JavaScript ----
  if (fileSet.has("package.json")) {
    let framework = "Node.js";

    // Check for common frameworks inside package.json indicators
    if (files.some((f) => f.toLowerCase().includes("next.config"))) {
      framework = "Next.js";
    } else if (fileSet.has("angular.json")) {
      framework = "Angular";
    } else if (files.some((f) => f.toLowerCase().includes("vite.config"))) {
      framework = "Vite / React";
    }

    return { type: "node", language: "JavaScript/TypeScript", framework };
  }

  // ---- Python ----
  if (
    fileSet.has("requirements.txt") ||
    fileSet.has("pyproject.toml") ||
    fileSet.has("setup.py") ||
    fileSet.has("pipfile")
  ) {
    let framework = "Python";

    if (files.some((f) => f.toLowerCase().includes("manage.py"))) {
      framework = "Django";
    } else if (fileSet.has("app.py") || fileSet.has("wsgi.py")) {
      framework = "Flask";
    } else if (fileSet.has("main.py")) {
      framework = "FastAPI / Python";
    }

    return { type: "python", language: "Python", framework };
  }

  // ---- Java / Maven / Gradle ----
  if (fileSet.has("pom.xml")) {
    return { type: "java", language: "Java", framework: "Maven / Spring Boot" };
  }
  if (fileSet.has("build.gradle") || fileSet.has("build.gradle.kts")) {
    return { type: "java", language: "Java/Kotlin", framework: "Gradle" };
  }

  // ---- Go ----
  if (fileSet.has("go.mod")) {
    return { type: "go", language: "Go", framework: "Go Modules" };
  }

  // ---- Ruby ----
  if (fileSet.has("gemfile") || fileSet.has("gemfile.lock")) {
    return { type: "ruby", language: "Ruby", framework: "Ruby / Rails" };
  }

  // ---- PHP ----
  if (fileSet.has("composer.json")) {
    return { type: "php", language: "PHP", framework: "Composer / Laravel" };
  }

  // ---- Rust ----
  if (fileSet.has("cargo.toml")) {
    return { type: "rust", language: "Rust", framework: "Cargo" };
  }

  // ---- .NET / C# ----
  if (files.some((f) => f.endsWith(".csproj") || f.endsWith(".sln"))) {
    return { type: "dotnet", language: "C#", framework: ".NET" };
  }

  // ---- Static HTML ----
  if (fileSet.has("index.html")) {
    return { type: "static", language: "HTML/CSS/JS", framework: "Static Site" };
  }

  // ---- Unknown ----
  return { type: "unknown", language: "Unknown", framework: "Unknown" };
}

module.exports = { detectProjectType };
