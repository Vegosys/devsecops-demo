# Design Document — Hello API *(AI-generated)*

> Interpreted by the AI intake stage from a **plain-language brief** written by a
> non-technical stakeholder (`requirements/api-requirements.txt`).
> **Status: APPROVED.**

## 1. Overview
A minimal ASP.NET Core (.NET 8) API with three endpoints: a greeting with the current
date/time, a health check, and a ping/pong liveness check.

## 2. Architecture
- .NET 8 minimal API, single stateless service.
- Multi-stage container build → `mcr.microsoft.com/dotnet/aspnet:8.0`, runs as `$APP_UID`
  (non-root), listens on `:8080`.

## 3. API Specification
| Method | Path | Purpose | Success |
|--------|------|---------|---------|
| GET | `/hello` | Greeting + current date/time | 200 |
| GET | `/healthz` | Liveness/readiness probe | 200 |
| GET | `/ping` | Liveness check | 200 `pong` |

## 4. Security Design
- No user input, no data store — nothing to validate or leak.
- Container hardening: non-root, no shell in runtime image.

## 5. Test & Acceptance
`/hello` returns a message and a timestamp. `/healthz` returns 200. `/ping` returns `pong`.
