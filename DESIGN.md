# Design Document — Loan Fulfillment API  *(AI-generated, pending approval)*

> Interpreted by the AI intake stage from a **plain-language brief** written by a
> non-technical stakeholder (`requirements/api-requirement.txt`).
> The technical decisions below were **proposed by the AI** to fill gaps the brief left open —
> review them and approve in the `design-approval` environment to release the pipeline.
> **Status: AWAITING APPROVAL.**

## 1. Overview
A stateless ASP.NET Core (.NET 8) Web API to submit, retrieve, and track loan applications —
replacing the current email + spreadsheet process Priya (Product) described. Packaged as a
non-root container and deployed to EKS via the AI-enabled DevSecOps pipeline. The brief left
the technology choice to the team; the AI's proposals and assumptions are flagged in §7.

## 2. Architecture
- **Runtime:** .NET 8 minimal API, single stateless service, horizontally scalable.
- **Container:** multi-stage build → `mcr.microsoft.com/dotnet/aspnet:8.0`, runs as `$APP_UID` (non-root), listens on `:8080`.
- **Deploy:** ECR → ArgoCD GitOps → Argo Rollouts canary on EKS.
- **Edge:** TLS termination + rate limiting at the gateway (Envoy/Cloudflare).

## 3. API Specification
| Method | Path | Purpose | Success | Errors |
|--------|------|---------|---------|--------|
| GET | `/health` | Readiness/liveness | 200 | — |
| POST | `/api/loans` | Submit application | 201 + Location | 400 validation |
| GET | `/api/loans/{id}` | Fetch application | 200 | 404 not found |

## 4. Data Model
`LoanApplication { id: string, applicant: string, amount: decimal, status: enum[SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED] }`

## 5. Security Design
- OAuth2/JWT bearer auth on `/api/*` (health left anonymous for probes).
- TLS 1.2+ enforced at the edge; HSTS on.
- Server-side validation: `applicant` required, `amount` in 10,000–50,000,000.
- Rate limit 100 req/min/client; structured logging with PII redaction.
- Container hardening: non-root, read-only FS, no shell in runtime image.

## 6. Non-Functional Targets
p95 latency < 200 ms · availability 99.9% · SOC 2 Type II + PII policy alignment.

## 7. AI-proposed decisions & assumptions (the brief did not specify)
The stakeholder gave intent, not specifications. The AI proposed the following — **each needs sign-off**:
- **Tech stack:** .NET 8 minimal API + container on EKS (brief said "your call").
- **Auth:** OAuth2/JWT bearer on `/api/*` (brief said "must be secure" but no mechanism).
- **Datastore:** external Aurora Postgres behind a repository interface (not mentioned; stubbed for the POC).
- **Performance target:** p95 < 200 ms (brief said "fast" — quantified by the AI).
- **Amount range:** 10,000–50,000,000 (AI mapped "ten thousand to a few crore" to a validated range).

## 8. Test & Acceptance
Derived from the brief: applications submit and are retrievable with correct status; invalid
input rejected with 400; no PII in logs; container non-root; image passes scan with 0 fixable
HIGH/CRITICAL. AI test-gen covers validation paths and the health contract.

## 9. Open questions for the approver (Priya / tech lead)
1. Confirm the datastore (Aurora Postgres assumed).
2. Confirm the identity provider / JWT issuer for authentication.
3. Confirm the exact upper amount bound and data-retention window for applications.
