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
1. **Upload requirement** — a non-technical stakeholder commits a plain-text brief under
   `requirements/*.txt` (plain English) and pushes to `main`.
2. **AI design doc** — the `ai-design-doc` job detects which requirement changed and publishes
   the matching `docs/generated/DESIGN.md` as a run artifact. *In production this is a real
   Anthropic API call reading the brief's actual text, not just its filename.*
3. **Approval gate** — the pipeline pauses at the `await-approval` job until a reviewer approves.
4. **AI writes the code** — the `codegen` job materializes the approved design (from `templates/`)
   into `site/` or `src/DemoApi/` and **commits + pushes it to `main` itself**. *In production
   this is a real Anthropic API call instead of a template copy.*
5. **Pipeline runs (against the fresh code)** — security scans + AI review/test →
   **real `docker build` of the .NET API** → image scan / SBOM / sign → DAST → AI triage →
   **real deploy to GitHub Pages** → AI anomaly watch.

## Autonomous codegen
The `codegen` job is what makes step 4 fully autonomous — no interactive session required:
- It's **filename-keyed, not content-understanding** — it only recognizes `*webpage*` and `*api*`
  in the requirement's filename (see `templates/README.md`). A requirement it doesn't recognize
  gets a graceful stub design doc instead of a crash; approving it just lets the pipeline
  continue against whatever code already exists.
- It commits with **`[skip ci]`** in the message, so its own push (which touches `site/**`, a
  trigger path) doesn't re-trigger the workflow.
- Downstream jobs checkout **`ref: main`** (not the original triggering commit) so they scan/build
  the code `codegen` just wrote.
- It pushes directly to `main` using the default `GITHUB_TOKEN` — **this requires `main` to allow
  direct pushes from Actions.** If branch protection requires PRs, this job's push will be
  rejected; see one-time setup below.

## One-time setup (required for the pause to work)
GitHub → **Settings → Environments → New environment → `design-approval`** →
add yourself (or a team) as a **Required reviewer**. That is what makes step 3 stop and wait.

GitHub → **Settings → Pages → Source: GitHub Actions**. That is what lets the `deploy` job
publish `site/` (the todo list webpage, from `requirements/webpage-requirement.txt`) to
GitHub Pages — the one real deploy target in this demo.

GitHub → **Settings → Branches** → confirm `main` allows Actions to push directly (no
required-PR protection blocking the `github-actions[bot]` actor). That is what lets the
`codegen` job commit its generated code straight to `main`.

## Run it in a demo
- **Path A (the story):** tweak `requirements/api-requirement.txt` (or drop a new brief in), commit, push →
  watch the AI turn it into a design doc → approve in the Actions UI → pipeline completes.
- **Path B (manual):** Actions tab → *Run workflow* → pick `staging` or `production`.

## Real vs simulated
- **Real:** the .NET API, the Dockerfile, the `docker build` in the Build stage, and the
  GitHub Pages deploy.
- **Simulated (with `# REAL:` swap-in lines):** the AI design doc, the `codegen` job (template
  copy instead of an Anthropic API call), scanners, DAST.
  Each prints realistic output and shows the production action it maps to.

## Local sanity check (optional)
```bash
cd src/DemoApi
docker build -t loan-fulfillment-api:dev .
docker run -p 8080:8080 loan-fulfillment-api:dev
curl localhost:8080/health
```
