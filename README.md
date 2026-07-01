# AI-Driven DevSecOps Demo — Loan Fulfillment API

A POC that shows the full flow: **upload a requirement → AI writes a design doc →
human approves → the pipeline builds a real .NET container and runs every gate.**

## Repository layout
```
requirements/api-requirement.txt        # plain-text brief (non-technical stakeholder)
docs/generated/DESIGN.md                # AI-generated design doc (reviewed before approval)
src/DemoApi/                             # a REAL ASP.NET Core (.NET 8) API + Dockerfile
  ├─ Program.cs                          #   /health, GET+POST /api/loans (with validation)
  ├─ DemoApi.csproj
  └─ Dockerfile                          #   multi-stage, non-root container
.github/workflows/ai-devsecops-pipeline.yml
```

## The flow
1. **Upload requirement** — a non-technical stakeholder commits a plain-text brief
   `requirements/api-requirement.txt` (plain English) and pushes to `main`.
2. **AI design doc** — the `ai-design-doc` job interprets the brief and produces `docs/generated/DESIGN.md`
   (downloadable as a run artifact). *In production this is a real Anthropic API call.*
3. **Approval gate** — the pipeline pauses at the `await-approval` job until a reviewer approves.
4. **Pipeline runs** — security scans + AI review/test → **real `docker build` of the .NET API**
   → image scan / SBOM / sign → DAST → AI triage → deploy (prints success) → AI anomaly watch.

## One-time setup (required for the pause to work)
GitHub → **Settings → Environments → New environment → `design-approval`** →
add yourself (or a team) as a **Required reviewer**. That is what makes step 3 stop and wait.

GitHub → **Settings → Pages → Source: GitHub Actions**. That is what lets the `deploy` job
publish `site/` (the todo list webpage, from `requirements/webpage-requirement.txt`) to
GitHub Pages — the one real deploy target in this demo.

## Run it in a demo
- **Path A (the story):** tweak `requirements/api-requirement.txt` (or drop a new brief in), commit, push →
  watch the AI turn it into a design doc → approve in the Actions UI → pipeline completes.
- **Path B (manual):** Actions tab → *Run workflow* → pick `staging` or `production`.

## Real vs simulated
- **Real:** the .NET API, the Dockerfile, and the `docker build` in the Build stage.
- **Simulated (with `# REAL:` swap-in lines):** the AI stages, scanners, DAST, deploy.
  Each prints realistic output and shows the production action it maps to.

## Local sanity check (optional)
```bash
cd src/DemoApi
docker build -t loan-fulfillment-api:dev .
docker run -p 8080:8080 loan-fulfillment-api:dev
curl localhost:8080/health
```
