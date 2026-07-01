# Design Document — Todo List Webpage *(AI-generated)*

> Interpreted by the AI intake stage from a **plain-language brief** written by a
> non-technical stakeholder (`requirements/webpage-requirement.txt`).
> **Status: APPROVED.**

## 1. Overview
A static, client-only todo list page: add a task, mark it done, delete it, and have it
persist across visits. No login, no backend, no database — matches the brief exactly.
Hosted as a static site on GitHub Pages via the existing DevSecOps pipeline's `deploy` job.

## 2. Architecture
- Plain HTML + CSS + vanilla JS — no build step, no framework, no dependencies.
- State persisted client-side in `localStorage` (no server, so no data leaves the browser).
- Published as a static artifact from `site/` by `actions/upload-pages-artifact` +
  `actions/deploy-pages` to GitHub Pages.

## 3. Page Behavior
| Action | Result |
|---|---|
| Type a task + press Enter / click Add | Task appended to the list, saved to `localStorage` |
| Click a task's checkbox | Task marked complete (strikethrough style), saved |
| Click a task's delete button | Task removed from the list, saved |
| Reload / reopen the page | List restored from `localStorage` |

## 4. Data Model
`Task { id: string, text: string, done: boolean }` — stored as a JSON array under a single
`localStorage` key.

## 5. Security Design
- No backend, no network calls, no auth — nothing to compromise server-side.
- User input rendered as text content (not `innerHTML`) to avoid DOM-based XSS from task text.
- All data stays in the visitor's own browser storage; nothing is transmitted or logged.

## 6. Non-Functional Targets
Loads instantly (static HTML/CSS/JS, no dependencies to fetch); works offline once loaded.

## 7. AI-proposed decisions & assumptions
- **Storage:** `localStorage` (brief said "remember the list", didn't specify a mechanism).
- **Styling:** minimal inline stylesheet, no external CSS framework (brief said "nothing fancy").

## 8. Test & Acceptance
Add a task → appears in the list. Check a task → shows as complete. Delete a task → removed
from the list. Reload the page → list matches what was there before reload.
