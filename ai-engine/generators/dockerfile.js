// ============================================================
// ai-engine/generators/dockerfile.js
// ============================================================
// Local Dockerfile templates for common project types.
// These run instantly without any API call.
// The key of each export matches the "projectType" string
// returned by detectProjectType.js.

/**
 * Generates a Dockerfile for a Node.js project.
 * Supports Next.js with a standalone server build.
 */
function nodeDockerfile({ framework = "Node.js", repoName = "app" }) {
  if (framework === "Next.js") {
    return `# ============================================================
# Dockerfile — Next.js Application
# Multi-stage build: keeps the final image small
# ============================================================

# Stage 1: Install dependencies
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Stage 2: Build the application
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Enable Next.js standalone output (add output:'standalone' to next.config.js)
RUN npm run build

# Stage 3: Run the production server
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy only what's needed to run
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
`;
  }

  return `# ============================================================
# Dockerfile — Node.js Application
# Multi-stage build to reduce image size
# ============================================================

# Stage 1: Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files first (better Docker layer caching)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy the rest of the source code
COPY . .

# Stage 2: Production stage
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Only copy production dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Copy built source from builder
COPY --from=builder /app/src ./src

EXPOSE 3000
CMD ["node", "src/index.js"]
`;
}

/**
 * Generates a Dockerfile for a Python project.
 */
function pythonDockerfile({ framework = "Python", repoName = "app" }) {
  const isDjango = framework === "Django";
  const isFlask = framework === "Flask";

  const startCmd = isDjango
    ? `CMD ["gunicorn", "--bind", "0.0.0.0:8000", "${repoName}.wsgi:application"]`
    : isFlask
    ? `CMD ["gunicorn", "--bind", "0.0.0.0:8000", "app:app"]`
    : `CMD ["python", "main.py"]`;

  const port = isDjango || isFlask ? 8000 : 8080;

  return `# ============================================================
# Dockerfile — Python / ${framework} Application
# ============================================================

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \\
    PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \\
    gcc \\
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

EXPOSE ${port}
${startCmd}
`;
}

/**
 * Generates a Dockerfile for a Java (Maven/Spring Boot) project.
 */
function javaDockerfile({ framework = "Maven / Spring Boot", repoName = "app" }) {
  return `# ============================================================
# Dockerfile — Java / Spring Boot Application
# Multi-stage build
# ============================================================

# Stage 1: Build with Maven
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app

# Download dependencies first (caching layer)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Build the application
COPY src ./src
RUN mvn package -DskipTests

# Stage 2: Run with a slim JRE
FROM eclipse-temurin:17-jre-alpine AS runner
WORKDIR /app

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080
CMD ["java", "-jar", "app.jar"]
`;
}

/**
 * Generates a Dockerfile for a Go project.
 */
function goDockerfile({ repoName = "app" }) {
  return `# ============================================================
# Dockerfile — Go Application
# Multi-stage build: final image is ~10MB
# ============================================================

# Stage 1: Build
FROM golang:1.21-alpine AS builder
WORKDIR /app

# Download modules (cached layer)
COPY go.mod go.sum ./
RUN go mod download

# Build the binary
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/server .

# Stage 2: Minimal runtime image
FROM scratch
COPY --from=builder /app/server /server
EXPOSE 8080
CMD ["/server"]
`;
}

/**
 * Generates a Dockerfile for a static HTML site (served with Nginx).
 */
function staticDockerfile({ repoName = "app" }) {
  return `# ============================================================
# Dockerfile — Static Website (served with Nginx)
# ============================================================

FROM nginx:alpine

# Copy static files into the Nginx web root
COPY . /usr/share/nginx/html

# Expose port 80
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`;
}

/**
 * Generates a Dockerfile for a Ruby (Rails) project.
 */
function rubyDockerfile({ framework = "Ruby", repoName = "app" }) {
  const isRails = framework === "Rails";
  return `# ============================================================
# Dockerfile — ${isRails ? "Ruby on Rails" : "Ruby"} Application
# ============================================================

FROM ruby:3.2-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \\
    build-essential \\
    libpq-dev \\
    nodejs \\
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install gems (cached layer)
COPY Gemfile Gemfile.lock ./
RUN bundle install --without development test

# Copy application code
COPY . .

${isRails ? "# Precompile assets\nRUN bundle exec rake assets:precompile\n" : ""}
EXPOSE ${isRails ? 3000 : 4567}
CMD [${isRails ? '"bundle", "exec", "rails", "server", "-b", "0.0.0.0"' : '"ruby", "app.rb"'}]
`;
}

/**
 * Generates a Dockerfile for a PHP project.
 */
function phpDockerfile({ framework = "PHP", repoName = "app" }) {
  const isLaravel = framework === "Laravel";
  return `# ============================================================
# Dockerfile — ${isLaravel ? "Laravel" : "PHP"} Application
# ============================================================

FROM php:8.2-fpm-alpine

# Install PHP extensions and tools
RUN apk add --no-cache \\
    nginx \\
    supervisor \\
    && docker-php-ext-install pdo pdo_mysql opcache

WORKDIR /var/www/html

${isLaravel ? "# Install Composer\nCOPY --from=composer:2 /usr/bin/composer /usr/bin/composer\n\n# Install PHP dependencies\nCOPY composer.json composer.lock ./\nRUN composer install --no-dev --optimize-autoloader\n" : ""}
# Copy application code
COPY . .

${isLaravel ? "RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache" : ""}

EXPOSE 80
CMD ["php-fpm"]
`;
}

/**
 * Generates a Dockerfile for a Rust project.
 */
function rustDockerfile({ repoName = "app" }) {
  return `# ============================================================
# Dockerfile — Rust Application
# Multi-stage build: final image is minimal
# ============================================================

# Stage 1: Build
FROM rust:1.75-alpine AS builder

RUN apk add --no-cache musl-dev

WORKDIR /app

# Cache dependency compilation
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -f target/release/deps/${repoName}*

# Build the real binary
COPY src ./src
RUN cargo build --release

# Stage 2: Minimal runtime
FROM alpine:3.19 AS runner
RUN apk add --no-cache ca-certificates
WORKDIR /app

COPY --from=builder /app/target/release/${repoName} ./server

EXPOSE 8080
CMD ["./server"]
`;
}

/**
 * Generates a Dockerfile for a .NET project.
 */
function dotnetDockerfile({ framework = ".NET", repoName = "app" }) {
  return `# ============================================================
# Dockerfile — .NET Application
# Multi-stage build
# ============================================================

# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS builder
WORKDIR /app

# Restore NuGet packages (cached layer)
COPY *.csproj ./
RUN dotnet restore

# Build and publish
COPY . .
RUN dotnet publish -c Release -o /app/publish --no-restore

# Stage 2: Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runner
WORKDIR /app

COPY --from=builder /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "${repoName}.dll"]
`;
}

// Export each generator keyed by project type
module.exports = {
  node: nodeDockerfile,
  python: pythonDockerfile,
  java: javaDockerfile,
  go: goDockerfile,
  ruby: rubyDockerfile,
  php: phpDockerfile,
  rust: rustDockerfile,
  dotnet: dotnetDockerfile,
  static: staticDockerfile,
};
