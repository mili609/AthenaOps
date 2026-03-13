// ============================================================
// ai-engine/generators/cicd.js
// ============================================================
// GitHub Actions CI/CD workflow templates for common project types.
// All pipelines include:
//   1. Checkout repository
//   2. Install dependencies
//   3. Build / test the project
//   4. Build Docker image
//   5. Push image to GitHub Container Registry (GHCR)
//
// Required repository secrets (Settings → Secrets → Actions):
//   GHCR_TOKEN  — a GitHub Personal Access Token with write:packages scope
//                 (or use the built-in GITHUB_TOKEN for GHCR)

// ---------------------------------------------------------------------------
// Shared Docker build-and-push job snippet reused across all templates.
// Parameters:
//   registryImage — e.g. "ghcr.io/${{ github.repository }}"
//   buildContext  — Docker build context (default ".")
// ---------------------------------------------------------------------------
function dockerJob({ registryImage = "ghcr.io/\${{ github.repository }}", buildContext = "." } = {}) {
  return `
  # ----------------------------------------------------------------
  # Job 2: Build the Docker image and push to GHCR
  # Only runs on pushes to main (not on pull requests).
  # ----------------------------------------------------------------
  docker-build-push:
    name: Build & Push Docker Image
    runs-on: ubuntu-latest
    needs: build-and-test
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    permissions:
      contents: read
      packages: write   # required to push to GHCR

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      # Log in to GitHub Container Registry using the built-in token
      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}

      # Generate image tags and labels (e.g. :latest, :<sha>, :pr-42)
      - name: Extract Docker metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${registryImage}
          tags: |
            type=ref,event=branch
            type=sha,prefix=sha-
            type=raw,value=latest,enable={{is_default_branch}}

      # Build the image and push — uses QEMU for multi-platform if needed
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: ${buildContext}
          push: true
          tags: \${{ steps.meta.outputs.tags }}
          labels: \${{ steps.meta.outputs.labels }}
`;
}

/**
 * GitHub Actions workflow for Node.js projects.
 */
function nodeCICD({ framework = "Node.js", repoName = "app" }) {
  const buildStep =
    framework === "Next.js"
      ? "      - name: Build\n        run: npm run build"
      : "      # Add a build step here if your project has one\n      # - name: Build\n      #   run: npm run build";

  return `# ============================================================
# .github/workflows/ci-cd.yml
# GitHub Actions CI/CD Pipeline — Node.js / ${framework}
# ============================================================
# Triggers: push or PR to main / master
# Steps: checkout → install → test → build → docker build → docker push

name: CI/CD Pipeline

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  # ----------------------------------------------------------------
  # Job 1: Install, test, and build the application
  # ----------------------------------------------------------------
  build-and-test:
    name: Build and Test
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      # 1. Check out the source code
      - name: Checkout repository
        uses: actions/checkout@v4

      # 2. Set up Node.js (version comes from the matrix above)
      - name: Set up Node.js \${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: \${{ matrix.node-version }}
          cache: "npm"

      # 3. Install dependencies with clean install for reproducibility
      - name: Install dependencies
        run: npm ci

      # 4. Run linter (uncomment if you have one configured)
      # - name: Lint
      #   run: npm run lint

      # 5. Run the test suite
      - name: Run tests
        run: npm test --if-present

      # 6. Build the application
${buildStep}
${dockerJob()}`;
}

/**
 * GitHub Actions workflow for Python projects.
 */
function pythonCICD({ framework = "Python", repoName = "app" }) {
  return `# ============================================================
# .github/workflows/ci-cd.yml
# GitHub Actions CI/CD Pipeline — Python / ${framework}
# ============================================================

name: CI/CD Pipeline

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  # ----------------------------------------------------------------
  # Job 1: Install, lint, and test the application
  # ----------------------------------------------------------------
  build-and-test:
    name: Build and Test
    runs-on: ubuntu-latest

    strategy:
      matrix:
        python-version: ["3.10", "3.11", "3.12"]

    steps:
      # 1. Check out the source code
      - name: Checkout repository
        uses: actions/checkout@v4

      # 2. Set up the Python version from the matrix
      - name: Set up Python \${{ matrix.python-version }}
        uses: actions/setup-python@v5
        with:
          python-version: \${{ matrix.python-version }}
          cache: "pip"

      # 3. Install dependencies
      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt

      # 4. Lint with flake8 (uncomment to enable)
      # - name: Lint with flake8
      #   run: pip install flake8 && flake8 .

      # 5. Run tests with pytest
      - name: Run tests
        run: |
          pip install pytest
          pytest --tb=short
${dockerJob()}`;
}

/**
 * GitHub Actions workflow for Java (Maven / Spring Boot) projects.
 */
function javaCICD({ framework = "Maven / Spring Boot", repoName = "app" }) {
  return `# ============================================================
# .github/workflows/ci-cd.yml
# GitHub Actions CI/CD Pipeline — Java / ${framework}
# ============================================================

name: CI/CD Pipeline

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  # ----------------------------------------------------------------
  # Job 1: Build and test with Maven
  # ----------------------------------------------------------------
  build-and-test:
    name: Build and Test
    runs-on: ubuntu-latest

    steps:
      # 1. Check out the source code
      - name: Checkout repository
        uses: actions/checkout@v4

      # 2. Set up JDK 17 (Temurin distribution)
      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: "17"
          distribution: "temurin"
          cache: maven

      # 3. Build the project and run tests
      - name: Build with Maven
        run: mvn -B package --file pom.xml

      # 4. Run unit tests explicitly
      - name: Run tests
        run: mvn test
${dockerJob()}`;
}

/**
 * GitHub Actions workflow for Go projects.
 */
function goCICD({ framework = "Go", repoName = "app" }) {
  return `# ============================================================
# .github/workflows/ci-cd.yml
# GitHub Actions CI/CD Pipeline — Go
# ============================================================

name: CI/CD Pipeline

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  # ----------------------------------------------------------------
  # Job 1: Build, vet, and test the Go application
  # ----------------------------------------------------------------
  build-and-test:
    name: Build and Test
    runs-on: ubuntu-latest

    steps:
      # 1. Check out the source code
      - name: Checkout repository
        uses: actions/checkout@v4

      # 2. Set up Go
      - name: Set up Go
        uses: actions/setup-go@v5
        with:
          go-version: "1.21"
          cache: true

      # 3. Download module dependencies
      - name: Download dependencies
        run: go mod download

      # 4. Run go vet (static analysis)
      - name: Vet
        run: go vet ./...

      # 5. Run tests with race detector
      - name: Run tests
        run: go test -race -coverprofile=coverage.out ./...

      # 6. Build the binary
      - name: Build
        run: go build -v ./...
${dockerJob()}`;
}

/**
 * GitHub Actions workflow for Ruby / Rails projects.
 */
function rubyCICD({ framework = "Ruby", repoName = "app" }) {
  const isRails = framework === "Rails";
  return `# ============================================================
# .github/workflows/ci-cd.yml
# GitHub Actions CI/CD Pipeline — ${isRails ? "Ruby on Rails" : "Ruby"}
# ============================================================

name: CI/CD Pipeline

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  # ----------------------------------------------------------------
  # Job 1: Install gems, run linter and tests
  # ----------------------------------------------------------------
  build-and-test:
    name: Build and Test
    runs-on: ubuntu-latest

    steps:
      # 1. Check out the source code
      - name: Checkout repository
        uses: actions/checkout@v4

      # 2. Set up Ruby with automatic bundle install
      - name: Set up Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: "3.2"
          bundler-cache: true

      # 3. Run tests
      - name: Run tests
        run: ${isRails ? "bundle exec rails test" : "bundle exec rspec"}
${dockerJob()}`;
}

/**
 * GitHub Actions workflow for PHP / Laravel projects.
 */
function phpCICD({ framework = "PHP", repoName = "app" }) {
  const isLaravel = framework === "Laravel";
  return `# ============================================================
# .github/workflows/ci-cd.yml
# GitHub Actions CI/CD Pipeline — ${isLaravel ? "Laravel" : "PHP"}
# ============================================================

name: CI/CD Pipeline

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  # ----------------------------------------------------------------
  # Job 1: Install, lint, and test the PHP application
  # ----------------------------------------------------------------
  build-and-test:
    name: Build and Test
    runs-on: ubuntu-latest

    steps:
      # 1. Check out the source code
      - name: Checkout repository
        uses: actions/checkout@v4

      # 2. Set up PHP with extensions
      - name: Set up PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: "8.2"
          extensions: mbstring, pdo, pdo_mysql, tokenizer, xml, ctype, json
          coverage: xdebug

      # 3. Install Composer dependencies
      - name: Install dependencies
        run: composer install --prefer-dist --no-progress --no-interaction

      # 4. Run tests
      - name: Run tests
        run: ${isLaravel ? "php artisan test" : "./vendor/bin/phpunit"}
${dockerJob()}`;
}

/**
 * GitHub Actions workflow for Rust projects.
 */
function rustCICD({ framework = "Rust", repoName = "app" }) {
  return `# ============================================================
# .github/workflows/ci-cd.yml
# GitHub Actions CI/CD Pipeline — Rust
# ============================================================

name: CI/CD Pipeline

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  # ----------------------------------------------------------------
  # Job 1: Format check, clippy lint, build, and test
  # ----------------------------------------------------------------
  build-and-test:
    name: Build and Test
    runs-on: ubuntu-latest

    steps:
      # 1. Check out the source code
      - name: Checkout repository
        uses: actions/checkout@v4

      # 2. Set up Rust stable toolchain with rustfmt and clippy
      - name: Set up Rust
        uses: dtolnay/rust-toolchain@stable
        with:
          components: rustfmt, clippy

      # 3. Cache Cargo registry to speed up builds
      - name: Cache Cargo registry
        uses: actions/cache@v4
        with:
          path: |
            ~/.cargo/registry
            ~/.cargo/git
            target
          key: \${{ runner.os }}-cargo-\${{ hashFiles('**/Cargo.lock') }}

      # 4. Check formatting
      - name: Check formatting
        run: cargo fmt --all -- --check

      # 5. Run Clippy linter (deny warnings)
      - name: Run Clippy
        run: cargo clippy --all-targets --all-features -- -D warnings

      # 6. Build the release binary
      - name: Build
        run: cargo build --release --locked

      # 7. Run tests
      - name: Run tests
        run: cargo test --locked
${dockerJob()}`;
}

/**
 * GitHub Actions workflow for .NET projects.
 */
function dotnetCICD({ framework = ".NET", repoName = "app" }) {
  return `# ============================================================
# .github/workflows/ci-cd.yml
# GitHub Actions CI/CD Pipeline — .NET
# ============================================================

name: CI/CD Pipeline

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  # ----------------------------------------------------------------
  # Job 1: Restore, build, and test the .NET application
  # ----------------------------------------------------------------
  build-and-test:
    name: Build and Test
    runs-on: ubuntu-latest

    steps:
      # 1. Check out the source code
      - name: Checkout repository
        uses: actions/checkout@v4

      # 2. Set up .NET SDK 8
      - name: Set up .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: "8.0.x"

      # 3. Restore NuGet packages
      - name: Restore dependencies
        run: dotnet restore

      # 4. Build the project
      - name: Build
        run: dotnet build --no-restore --configuration Release

      # 5. Run unit tests
      - name: Run tests
        run: dotnet test --no-build --configuration Release --verbosity normal
${dockerJob()}`;
}

/**
 * GitHub Actions workflow for static websites (also builds + pushes a Docker/Nginx image).
 */
function staticCICD({ framework = "Static", repoName = "app" }) {
  return `# ============================================================
# .github/workflows/ci-cd.yml
# GitHub Actions CI/CD Pipeline — Static Website
# Validates the site and pushes an Nginx Docker image to GHCR.
# ============================================================

name: CI/CD Pipeline

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  # ----------------------------------------------------------------
  # Job 1: Validate / build the static site
  # ----------------------------------------------------------------
  build-and-test:
    name: Build and Test
    runs-on: ubuntu-latest

    steps:
      # 1. Check out the source code
      - name: Checkout repository
        uses: actions/checkout@v4

      # 2. (Optional) Build with your static site generator
      # - name: Build site
      #   run: npm run build   # for Vite / Parcel / Hugo / etc.

      # 3. Upload the built site as a Pages artifact
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: "."   # change to "dist" or "public" after enabling a build step

  # ----------------------------------------------------------------
  # Job 2: Deploy to GitHub Pages (push to main only)
  # ----------------------------------------------------------------
  deploy-pages:
    name: Deploy to GitHub Pages
    runs-on: ubuntu-latest
    needs: build-and-test
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    permissions:
      pages: write
      id-token: write

    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}

    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
${dockerJob()}`;
}

module.exports = {
  node:   nodeCICD,
  python: pythonCICD,
  java:   javaCICD,
  go:     goCICD,
  ruby:   rubyCICD,
  php:    phpCICD,
  rust:   rustCICD,
  dotnet: dotnetCICD,
  static: staticCICD,
};
