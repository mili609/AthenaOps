// ============================================================
// backend/src/utils/errorPatterns.js
// ============================================================
// Rule-based build/deployment error pattern matcher.
// Returns { problem, explanation, solution } for known error
// signatures, or null when no pattern matches (triggers AI fallback).
//
// Rules are evaluated in order — put more-specific patterns FIRST.

const patterns = [
  // ------------------------------------------------------------------
  // Node.js / npm
  // ------------------------------------------------------------------
  {
    match: /cannot find module ['"]([^'"]+)['"]/i,
    result: (m) => ({
      problem: `Missing module: ${m[1]}`,
      explanation: `Node.js cannot find the module "${m[1]}". It is either not installed, not listed in package.json, or the import path is wrong.`,
      solution: `Run \`npm install ${m[1]}\` to install it, or check the import path in your code for typos.`,
    }),
  },
  {
    match: /npm err! missing script:\s*(\S+)/i,
    result: (m) => ({
      problem: `Missing npm script: "${m[1]}"`,
      explanation: `The npm script "${m[1]}" is not defined in your package.json.`,
      solution: `Add a "${m[1]}" entry to the "scripts" section of package.json, or check for a typo in the script name.`,
    }),
  },
  {
    match: /npm err! code enoent/i,
    result: () => ({
      problem: "File or directory not found (ENOENT)",
      explanation: "npm could not find a required file or directory — usually package.json or node_modules.",
      solution: "Make sure you are in the correct project directory and that package.json exists. Run `npm install` to restore node_modules.",
    }),
  },
  {
    match: /eaddrinuse.*?:?(\d{2,5})/i,
    result: (m) => ({
      problem: `Port ${m[1]} already in use`,
      explanation: `Another process is already listening on port ${m[1]}, so your application cannot start.`,
      solution: `Find and stop the process using the port: \`lsof -ti:${m[1]} | xargs kill\` (Linux/macOS) or in PowerShell: \`Get-NetTCPConnection -LocalPort ${m[1]} | Select OwningProcess | Stop-Process\`. Then restart your application.`,
    }),
  },
  {
    match: /syntaxerror.*?unexpected token/i,
    result: () => ({
      problem: "JavaScript syntax error — unexpected token",
      explanation: "Node.js encountered invalid JavaScript syntax. This is usually a missing bracket, comma, or quote.",
      solution: "Check the file and line number shown above the error. Look for unclosed brackets `{}`, missing commas in JSON/objects, or mismatched quotes.",
    }),
  },
  {
    match: /error: cannot find module.*?node_modules/i,
    result: () => ({
      problem: "node_modules not installed",
      explanation: "The project dependencies have not been installed in this environment.",
      solution: "Run `npm ci` (preferred in CI) or `npm install` to install all dependencies from package.json.",
    }),
  },

  // ------------------------------------------------------------------
  // Python / pip
  // ------------------------------------------------------------------
  {
    match: /modulenotfounderror: no module named '([^']+)'/i,
    result: (m) => ({
      problem: `Missing Python module: ${m[1]}`,
      explanation: `Python cannot find the module "${m[1]}". It is not installed in the current environment.`,
      solution: `Run \`pip install ${m[1]}\` or add it to requirements.txt and run \`pip install -r requirements.txt\`.`,
    }),
  },
  {
    match: /indentationerror/i,
    result: () => ({
      problem: "Python indentation error",
      explanation: "Python is strict about indentation. A block is indented inconsistently — mixing tabs and spaces or using the wrong number of spaces.",
      solution: "Use a consistent indentation style (4 spaces is standard). Check the file and line number in the traceback. Many editors can auto-fix this.",
    }),
  },
  {
    match: /syntaxerror: invalid syntax/i,
    result: () => ({
      problem: "Python syntax error",
      explanation: "Python found invalid syntax in your code — often a missing colon, bracket, or comma.",
      solution: "Check the file and line number shown in the traceback. Common causes: missing `:` at end of `if`/`for`/`def`, unclosed parentheses, or using Python 3 syntax in a Python 2 environment.",
    }),
  },

  // ------------------------------------------------------------------
  // Java / Maven
  // ------------------------------------------------------------------
  {
    match: /build failure/i,
    result: () => ({
      problem: "Maven build failure",
      explanation: "The Maven build failed. This is usually caused by a compilation error, failing test, or unresolvable dependency.",
      solution: "Run `mvn clean install -X` for verbose output. Look for `ERROR` lines above this message. Common fixes: check pom.xml for correct dependency versions, ensure the Java version matches `<java.version>`, and fix any compilation errors shown.",
    }),
  },
  {
    match: /classnotfoundexception:\s*(\S+)/i,
    result: (m) => ({
      problem: `Java class not found: ${m[1]}`,
      explanation: `The JVM cannot find the class "${m[1]}" at runtime. The required JAR is missing from the classpath.`,
      solution: `Add the dependency containing "${m[1]}" to pom.xml or build.gradle, then rebuild. Run \`mvn dependency:tree\` to inspect the classpath.`,
    }),
  },
  {
    match: /java\.lang\.outofmemoryerror/i,
    result: () => ({
      problem: "Java OutOfMemoryError",
      explanation: "The JVM ran out of heap memory. The application exceeded its configured memory limit.",
      solution: "Increase the JVM heap with `-Xmx` (e.g. `java -Xmx1g -jar app.jar`). In Kubernetes, raise the memory limit and set `JAVA_OPTS: -Xmx768m`. Check for memory leaks with a profiler (VisualVM, YourKit).",
    }),
  },

  // ------------------------------------------------------------------
  // Docker
  // ------------------------------------------------------------------
  {
    match: /cannot connect to the docker daemon/i,
    result: () => ({
      problem: "Docker daemon not running",
      explanation: "The Docker CLI cannot reach the Docker daemon. Docker Desktop may not be started, or the current user lacks permission to access the socket.",
      solution: "Start Docker Desktop (Windows/macOS) or run `sudo systemctl start docker` (Linux). On Linux, add your user to the docker group: `sudo usermod -aG docker $USER` then log out and back in.",
    }),
  },
  {
    match: /error response from daemon.*?no space left on device/i,
    result: () => ({
      problem: "Docker: no disk space left",
      explanation: "The Docker host has run out of disk space, usually due to accumulated unused images, containers, or volumes.",
      solution: "Run `docker system prune -af --volumes` to remove all unused resources. Check disk usage with `df -h`. Consider adding more storage to the host.",
    }),
  },
  {
    match: /pull access denied|repository does not exist|unauthorized: authentication required/i,
    result: () => ({
      problem: "Docker image pull failed — authentication error",
      explanation: "Docker could not pull the image because it either does not exist or requires credentials.",
      solution: "Check the image name and tag for typos. If it is a private registry, run `docker login <registry>` first. For GitHub Container Registry, authenticate with `echo $CR_PAT | docker login ghcr.io -u USERNAME --password-stdin`.",
    }),
  },
  {
    match: /dockerfile.*?no such file or directory/i,
    result: () => ({
      problem: "Dockerfile not found",
      explanation: "Docker cannot find a Dockerfile in the specified build context directory.",
      solution: "Make sure a file named `Dockerfile` (capital D) exists in the directory where you run `docker build`. Use `-f path/to/Dockerfile` to specify a different location.",
    }),
  },

  // ------------------------------------------------------------------
  // Kubernetes
  // ------------------------------------------------------------------
  {
    match: /imagepullbackoff|errimagepull/i,
    result: () => ({
      problem: "Kubernetes: ImagePullBackOff",
      explanation: "Kubernetes cannot pull the container image. The image name may be wrong, the tag does not exist, or the cluster lacks credentials to access a private registry.",
      solution: "1. Verify the image name and tag: `kubectl describe pod <pod-name>`\n2. For private registries, create an imagePullSecret: `kubectl create secret docker-registry regcred --docker-server=... --docker-username=... --docker-password=...`\n3. Reference the secret in your deployment under `spec.imagePullSecrets`.",
    }),
  },
  {
    match: /crashloopbackoff/i,
    result: () => ({
      problem: "Kubernetes: CrashLoopBackOff",
      explanation: "The container keeps starting and then crashing. Kubernetes retries with exponential back-off.",
      solution: "1. Check the container logs: `kubectl logs <pod-name> --previous`\n2. Review your application startup code for uncaught exceptions or missing environment variables\n3. Ensure the CMD/ENTRYPOINT in your Dockerfile is correct\n4. Verify all required Secrets and ConfigMaps are mounted.",
    }),
  },
  {
    match: /oomkilled/i,
    result: () => ({
      problem: "Kubernetes: OOMKilled — container ran out of memory",
      explanation: "The container exceeded its memory limit and was killed by the Out-Of-Memory (OOM) manager.",
      solution: "Increase the `resources.limits.memory` value in your deployment YAML (e.g. from `256Mi` to `512Mi`). For JVM apps, also set heap flags via `JAVA_OPTS: -Xmx400m`. Monitor actual usage with `kubectl top pods`.",
    }),
  },
  {
    match: /pods? .+ is forbidden.*?exceeded quota/i,
    result: () => ({
      problem: "Kubernetes: ResourceQuota exceeded",
      explanation: "The namespace has reached its resource quota limit. The new Pod cannot be scheduled.",
      solution: "Check current quota usage: `kubectl describe quota -n <namespace>`. Either reduce the resource requests in your deployment or ask your cluster admin to increase the namespace quota.",
    }),
  },
  {
    match: /back-off restarting failed container/i,
    result: () => ({
      problem: "Kubernetes: container is restarting repeatedly",
      explanation: "The container has failed several times and Kubernetes is slowing down restart attempts.",
      solution: "Run `kubectl logs <pod-name> --previous` to see the last crash output. Fix the root cause (missing env var, bad config, application error) and redeploy.",
    }),
  },
  {
    match: /connection refused.*?(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})?:?(\d{2,5})/i,
    result: (m) => ({
      problem: `Connection refused${m[2] ? ` on port ${m[2]}` : ""}`,
      explanation: `Nothing is listening on the target address${m[2] ? ` (port ${m[2]})` : ""}. The service may not be running, the wrong port is configured, or a firewall is blocking the connection.`,
      solution: `1. Verify the target service is running\n2. Confirm the correct host and port in your configuration\n3. Check firewall rules / security groups\n4. In Kubernetes, ensure the Service selector matches the Pod labels`,
    }),
  },

  // ------------------------------------------------------------------
  // GitHub Actions / CI
  // ------------------------------------------------------------------
  {
    match: /error: process completed with exit code (\d+)/i,
    result: (m) => ({
      problem: `CI step failed with exit code ${m[1]}`,
      explanation: `A command in your GitHub Actions workflow exited with a non-zero code (${m[1]}), which GitHub Actions treats as a failure.`,
      solution: "Scroll up in the workflow logs to find the failing command and its output. Exit code 1 usually means a script error; exit code 127 means command not found; exit code 137 means OOM kill.",
    }),
  },
  {
    match: /permission denied.*?\.github|permission denied.*?workflow/i,
    result: () => ({
      problem: "CI/CD: permission denied on workflow file",
      explanation: "The GitHub Actions runner does not have permission to read or execute a script in the workflow.",
      solution: "Make scripts executable: add `chmod +x script.sh` as a step before running it, or add `permissions: write-all` to the job. Check that the file is committed with the executable bit set: `git update-index --chmod=+x script.sh`.",
    }),
  },
  {
    match: /denied: permission_denied.*?ghcr\.io|unauthorized.*?ghcr\.io/i,
    result: () => ({
      problem: "GHCR push denied — insufficient permissions",
      explanation: "The workflow token does not have permission to push an image to GitHub Container Registry.",
      solution: "Add `permissions: packages: write` to the job in your workflow YAML, and ensure you are using `secrets.GITHUB_TOKEN` (not a PAT) for `docker/login-action`. Also verify the image name is `ghcr.io/<owner>/<repo>:tag` (all lowercase).",
    }),
  },

  // ------------------------------------------------------------------
  // General
  // ------------------------------------------------------------------
  {
    match: /eacces.*?permission denied/i,
    result: () => ({
      problem: "Permission denied (EACCES)",
      explanation: "The process does not have permission to access a file, port, or directory.",
      solution: "Avoid running as root. If installing global npm packages, configure a user-writable prefix: `npm config set prefix ~/.npm-global`. For port < 1024 on Linux, use `authbind` or map to a higher port.",
    }),
  },
  {
    match: /etimeout|etimedout|connection timed out/i,
    result: () => ({
      problem: "Network timeout",
      explanation: "A network connection attempt timed out. The target host may be unreachable, overloaded, or behind a firewall.",
      solution: "1. Check network connectivity to the target host\n2. Verify DNS resolution\n3. Increase timeout values in your application config\n4. Check security group / firewall rules if on a cloud provider",
    }),
  },
  {
    match: /ssl.*?certificate.*?verify|certificate.*?expired|certificate.*?invalid/i,
    result: () => ({
      problem: "SSL/TLS certificate error",
      explanation: "The SSL certificate presented by the server is invalid, expired, self-signed, or the CA is not trusted.",
      solution: "1. If it is a self-signed cert in dev, set `NODE_TLS_REJECT_UNAUTHORIZED=0` (dev only — never in production)\n2. Renew an expired certificate (Let's Encrypt: `certbot renew`)\n3. Ensure the certificate chain includes all intermediate CAs",
    }),
  },
];

/**
 * Attempts to match an error log against known patterns.
 * @param {string} errorLog
 * @returns {{ problem: string, explanation: string, solution: string } | null}
 */
function matchErrorPattern(errorLog) {
  for (const { match, result } of patterns) {
    const m = errorLog.match(match);
    if (m) return result(m);
  }
  return null;
}

module.exports = { matchErrorPattern };
