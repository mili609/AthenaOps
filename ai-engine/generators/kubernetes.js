// ============================================================
// ai-engine/generators/kubernetes.js
// ============================================================
// Kubernetes Deployment + Service YAML generators.
//
// Every exported function accepts an options object and returns:
//   { deployment: "<deployment.yaml text>", service: "<service.yaml text>" }
//
// This keeps the two manifests separate so the frontend can display
// each one in its own code tab.

// ---------------------------------------------------------------------------
// Core builders — shared by all language-specific generators
// ---------------------------------------------------------------------------

/**
 * Builds a deployment.yaml string.
 */
function buildDeployment({
  appName,
  image = "your-image-name:latest",
  port,
  replicas,
  envVars = [],
  cpuRequest = "100m",
  cpuLimit = "500m",
  memRequest = "128Mi",
  memLimit = "512Mi",
}) {
  const envBlock =
    envVars.length > 0
      ? envVars.map((e) => `            - name: ${e.name}\n              value: "${e.value}"`).join("\n")
      : `            - name: APP_ENV\n              value: "production"`;

  return `# ============================================================
# deployment.yaml — ${appName}
# Apply with: kubectl apply -f deployment.yaml
# ============================================================

apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${appName}
  labels:
    app: ${appName}
spec:
  # Number of identical Pods to keep running at all times
  replicas: ${replicas}

  selector:
    matchLabels:
      app: ${appName}

  template:
    metadata:
      labels:
        app: ${appName}
    spec:
      containers:
        - name: ${appName}
          # Replace with your actual image pushed to GHCR / Docker Hub
          # e.g. ghcr.io/<your-org>/${appName}:latest
          image: ${image}
          imagePullPolicy: Always

          ports:
            - containerPort: ${port}
              protocol: TCP

          # Environment variables — extend as needed
          env:
${envBlock}

          # Resource limits prevent a single Pod exhausting the node
          resources:
            requests:
              cpu: "${cpuRequest}"
              memory: "${memRequest}"
            limits:
              cpu: "${cpuLimit}"
              memory: "${memLimit}"

          # Liveness probe — Kubernetes restarts the Pod if this fails
          livenessProbe:
            httpGet:
              path: /
              port: ${port}
            initialDelaySeconds: 30
            periodSeconds: 20
            failureThreshold: 3

          # Readiness probe — Kubernetes only routes traffic when this passes
          readinessProbe:
            httpGet:
              path: /
              port: ${port}
            initialDelaySeconds: 10
            periodSeconds: 10
            failureThreshold: 3
`;
}

/**
 * Builds a service.yaml string.
 * serviceType: "ClusterIP" (internal only) | "LoadBalancer" (cloud public IP)
 */
function buildService({ appName, port, serviceType = "ClusterIP" }) {
  const nodePortComment =
    serviceType === "ClusterIP"
      ? "  # To expose publicly on a cloud cluster, change type to LoadBalancer."
      : "  # LoadBalancer provisions a cloud public IP. Use ClusterIP for internal-only access.";

  return `# ============================================================
# service.yaml — ${appName}
# Apply with: kubectl apply -f service.yaml
# ============================================================

apiVersion: v1
kind: Service
metadata:
  name: ${appName}-service
  labels:
    app: ${appName}
spec:
  # The selector tells the Service which Pods to route traffic to
  selector:
    app: ${appName}
${nodePortComment}
  type: ${serviceType}

  ports:
    - name: http
      protocol: TCP
      port: 80            # Port the Service listens on inside the cluster
      targetPort: ${port}  # Port on the container
`;
}

// ---------------------------------------------------------------------------
// Language-specific generators — each returns { deployment, service }
// ---------------------------------------------------------------------------

/**
 * Generic Kubernetes manifests — works for most web applications.
 */
function defaultKubernetes({ repoName = "app", port = 3000, replicas = 2 }) {
  const appName = repoName.toLowerCase().replace(/[^a-z0-9-]/g, "-");

  return {
    deployment: buildDeployment({ appName, port, replicas }),
    service: buildService({ appName, port }),
  };
}

/** Node.js — port 3000, moderate resources */
function nodeKubernetes({ repoName = "app", port = 3000, replicas = 2 }) {
  const appName = repoName.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  return {
    deployment: buildDeployment({
      appName, port, replicas,
      cpuRequest: "100m", cpuLimit: "500m",
      memRequest: "128Mi", memLimit: "512Mi",
      envVars: [
        { name: "NODE_ENV", value: "production" },
        { name: "PORT", value: String(port) },
      ],
    }),
    service: buildService({ appName, port }),
  };
}

/** Python — port 8000, moderate resources */
function pythonKubernetes({ repoName = "app", port = 8000, replicas = 2 }) {
  const appName = repoName.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  return {
    deployment: buildDeployment({
      appName, port, replicas,
      cpuRequest: "100m", cpuLimit: "500m",
      memRequest: "128Mi", memLimit: "512Mi",
      envVars: [
        { name: "PYTHONUNBUFFERED", value: "1" },
        { name: "PORT", value: String(port) },
      ],
    }),
    service: buildService({ appName, port }),
  };
}

/** Java / Spring Boot — port 8080, higher memory ceiling for JVM */
function javaKubernetes({ repoName = "app", port = 8080, replicas = 2 }) {
  const appName = repoName.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  return {
    deployment: buildDeployment({
      appName, port, replicas,
      cpuRequest: "250m", cpuLimit: "1000m",
      memRequest: "512Mi", memLimit: "1024Mi",
      envVars: [
        { name: "JAVA_OPTS", value: "-Xmx768m -Xms256m" },
        { name: "SERVER_PORT", value: String(port) },
      ],
    }),
    service: buildService({ appName, port }),
  };
}

/** Go — port 8080, very lean resource footprint */
function goKubernetes({ repoName = "app", port = 8080, replicas = 2 }) {
  const appName = repoName.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  return {
    deployment: buildDeployment({
      appName, port, replicas,
      cpuRequest: "50m", cpuLimit: "250m",
      memRequest: "32Mi", memLimit: "128Mi",
      envVars: [
        { name: "PORT", value: String(port) },
      ],
    }),
    service: buildService({ appName, port }),
  };
}

/** Ruby / Rails — port 3000 */
function rubyKubernetes({ repoName = "app", port = 3000, replicas = 2 }) {
  const appName = repoName.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  return {
    deployment: buildDeployment({
      appName, port, replicas,
      cpuRequest: "100m", cpuLimit: "500m",
      memRequest: "256Mi", memLimit: "512Mi",
      envVars: [
        { name: "RAILS_ENV", value: "production" },
        { name: "PORT", value: String(port) },
      ],
    }),
    service: buildService({ appName, port }),
  };
}

/** PHP — port 80, served via php-fpm + nginx */
function phpKubernetes({ repoName = "app", port = 80, replicas = 2 }) {
  const appName = repoName.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  return {
    deployment: buildDeployment({
      appName, port, replicas,
      cpuRequest: "100m", cpuLimit: "500m",
      memRequest: "128Mi", memLimit: "256Mi",
      envVars: [
        { name: "APP_ENV", value: "production" },
      ],
    }),
    service: buildService({ appName, port }),
  };
}

/** Rust — port 8080, very lean (statically linked binary) */
function rustKubernetes({ repoName = "app", port = 8080, replicas = 2 }) {
  const appName = repoName.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  return {
    deployment: buildDeployment({
      appName, port, replicas,
      cpuRequest: "50m", cpuLimit: "250m",
      memRequest: "32Mi", memLimit: "128Mi",
      envVars: [
        { name: "RUST_LOG", value: "info" },
        { name: "PORT", value: String(port) },
      ],
    }),
    service: buildService({ appName, port }),
  };
}

/** .NET — port 8080 */
function dotnetKubernetes({ repoName = "app", port = 8080, replicas = 2 }) {
  const appName = repoName.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  return {
    deployment: buildDeployment({
      appName, port, replicas,
      cpuRequest: "250m", cpuLimit: "1000m",
      memRequest: "256Mi", memLimit: "512Mi",
      envVars: [
        { name: "ASPNETCORE_ENVIRONMENT", value: "Production" },
        { name: "ASPNETCORE_URLS", value: `http://+:${port}` },
      ],
    }),
    service: buildService({ appName, port }),
  };
}

/** Static website — port 80, served by nginx, tiny resource footprint */
function staticKubernetes({ repoName = "app", port = 80, replicas = 2 }) {
  const appName = repoName.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  return {
    deployment: buildDeployment({
      appName, port, replicas,
      cpuRequest: "50m", cpuLimit: "100m",
      memRequest: "32Mi", memLimit: "64Mi",
      envVars: [],
    }),
    service: buildService({ appName, port }),
  };
}

module.exports = {
  default: defaultKubernetes,
  node:    nodeKubernetes,
  python:  pythonKubernetes,
  java:    javaKubernetes,
  go:      goKubernetes,
  ruby:    rubyKubernetes,
  php:     phpKubernetes,
  rust:    rustKubernetes,
  dotnet:  dotnetKubernetes,
  static:  staticKubernetes,
};
