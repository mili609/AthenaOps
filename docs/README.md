# AthenaOps

> **AI-Powered DevOps Configuration Generator**  
> Final Year Project — DevOps + AI

AthenaOps connects to any public GitHub repository, analyses its project type, and automatically generates production-ready DevOps configuration files:

- **Dockerfile** — multi-stage, optimised builds
- **GitHub Actions CI/CD workflow** — automated build, test, and deploy pipeline
- **Kubernetes Deployment + Service YAML** — ready to apply to any cluster
- **AI Error Explainer** — paste any build/deployment log and get a plain-English explanation with fix steps

---

## Tech Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Frontend    | Next.js 14, TypeScript, Tailwind CSS |
| Backend     | Node.js, Express, express-validator |
| AI Engine   | OpenAI API (GPT-3.5 / GPT-4)     |
| GitHub API  | REST API via Axios                |

---

## Project Structure

```
AthenaOps/
├── frontend/                   # Next.js dashboard
│   ├── app/
│   │   ├── page.tsx            # Root page (renders Dashboard)
│   │   ├── layout.tsx          # HTML shell + metadata
│   │   └── globals.css         # Tailwind base styles
│   ├── components/
│   │   ├── Dashboard.tsx       # Main shell — manages state
│   │   ├── RepoInput.tsx       # GitHub URL input form
│   │   ├── FileDisplay.tsx     # Tabbed code viewer with download
│   │   └── ErrorExplainer.tsx  # AI error analysis UI
│   ├── lib/
│   │   └── apiConfig.ts        # Backend base URL config
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── backend/                    # Express API server
│   ├── src/
│   │   ├── index.js            # Entry point — registers all routes
│   │   ├── routes/
│   │   │   ├── analyzeRepo.js       # POST /api/analyze-repo
│   │   │   ├── generateDockerfile.js # POST /api/generate-dockerfile
│   │   │   ├── generateCICD.js      # POST /api/generate-cicd
│   │   │   ├── generateKubernetes.js # POST /api/generate-kubernetes
│   │   │   └── explainError.js      # POST /api/explain-error
│   │   ├── services/
│   │   │   ├── githubService.js     # GitHub API integration
│   │   │   └── aiService.js         # OpenAI API integration
│   │   └── utils/
│   │       └── detectProjectType.js # Heuristic project type detection
│   ├── .env.example
│   └── package.json
│
├── ai-engine/                  # Local file generation templates
│   └── generators/
│       ├── dockerfile.js       # Dockerfile templates per project type
│       ├── cicd.js             # GitHub Actions YAML templates
│       └── kubernetes.js       # Kubernetes YAML templates
│
├── docs/
│   └── README.md               # This file
├── docker-compose.yml          # Run the full stack with one command
└── .gitignore
```

---

## Getting Started

### Prerequisites

- [Node.js 18+](https://nodejs.org/)
- An [OpenAI API key](https://platform.openai.com/api-keys)
- (Optional) A [GitHub Personal Access Token](https://github.com/settings/tokens) to avoid rate limits

---

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/AthenaOps.git
cd AthenaOps
```

### 2. Set up the Backend

```bash
cd backend
npm install

# Copy the example env file and fill in your keys
cp .env.example .env
```

Edit `backend/.env`:

```env
PORT=5000
GITHUB_TOKEN=your_github_token_here      # optional but recommended
OPENAI_API_KEY=your_openai_api_key_here  # required for AI generation
OPENAI_MODEL=gpt-3.5-turbo              # or gpt-4 for better results
```

Start the backend:

```bash
npm run dev     # development (auto-restart on file changes)
# or
npm start       # production
```

The API will be available at **http://localhost:5000**

---

### 3. Set up the Frontend

```bash
cd ../frontend
npm install
npm run dev
```

Open **http://localhost:3000** in your browser.

---

### 4. (Alternative) Run with Docker Compose

```bash
# From the project root
docker-compose up --build
```

- Frontend → http://localhost:3000  
- Backend  → http://localhost:5000

---

## API Reference

All endpoints accept and return JSON.

### `POST /api/analyze-repo`
Fetches repository metadata and detects the project type.

**Request body:**
```json
{ "repoUrl": "https://github.com/owner/repo" }
```

**Response:**
```json
{
  "success": true,
  "owner": "owner",
  "repo": "repo",
  "repoInfo": { "name": "...", "language": "...", "stars": 0 },
  "rootFiles": ["package.json", "src/", "..."],
  "projectType": { "type": "node", "language": "JavaScript", "framework": "Next.js" }
}
```

---

### `POST /api/generate-dockerfile`
Generates a Dockerfile.

**Request body:**
```json
{
  "projectType": "node",
  "language": "JavaScript/TypeScript",
  "framework": "Next.js",
  "repoName": "my-app"
}
```

---

### `POST /api/generate-cicd`
Generates a GitHub Actions CI/CD YAML workflow.

Same body format as `/generate-dockerfile`.

---

### `POST /api/generate-kubernetes`
Generates a Kubernetes Deployment + Service YAML.

**Request body:**
```json
{
  "repoName": "my-app",
  "projectType": "node",
  "port": 3000,
  "replicas": 2
}
```

---

### `POST /api/explain-error`
Explains a build or deployment error log.

**Request body:**
```json
{
  "errorLog": "Error: Cannot find module 'express'...",
  "context": "Running npm start inside Docker"
}
```

**Response:**
```json
{
  "success": true,
  "explanation": "The application cannot find a required package...",
  "rootCause": "The node_modules directory is missing...",
  "fixSteps": ["Run npm install", "Rebuild the Docker image"]
}
```

---

## Supported Project Types

| Type       | Detected by                               |
|------------|-------------------------------------------|
| Node.js    | `package.json`                            |
| Next.js    | `package.json` + `next.config.*`          |
| Python     | `requirements.txt`, `pyproject.toml`, etc.|
| Django     | `manage.py`                               |
| Flask      | `app.py` or `wsgi.py`                     |
| Java/Maven | `pom.xml`                                 |
| Go         | `go.mod`                                  |
| Ruby       | `Gemfile`                                 |
| PHP        | `composer.json`                           |
| .NET / C#  | `*.csproj` or `*.sln`                     |
| Static     | `index.html`                              |

---

## Architecture Diagram

```
Browser (Next.js)
      │
      │  HTTP (Axios)
      ▼
Express API (Node.js)
      │
      ├── /analyze-repo ──► GitHub API
      │
      ├── /generate-dockerfile
      ├── /generate-cicd        ──► ai-engine templates (local)
      ├── /generate-kubernetes       └── fallback: OpenAI API
      │
      └── /explain-error ────────► OpenAI API
```

---

## License

MIT
