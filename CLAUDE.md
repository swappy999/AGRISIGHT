# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run Commands
- **Backend**:
  - Build: `go build -o backend/bin/server backend/archive_go/main.go`
  - Run: `./backend/bin/server` (listens on port 8080)
  - Test: `go test ./...` (no tests currently)
- **Frontend**:
  - Dev: `npm run dev` (runs Next.js development server)
  - Build: `npm run build` (produces `.next` output)
  - Start: `npm run start` (runs the built app on port 3000)
  - Lint: `npm run lint`

## High‑Level Architecture
- **Backend** (`backend/archive_go/`):
  - Built in Go using the **Gin** web framework.
  - Exposes REST endpoints `/ping`, `/analyze`, and `/chat`.
  - Uses the **Google Gemini** API (multimodal) to process leaf images and natural‑language queries.
  - Maintains simple in‑memory session state (`sessions` map) to keep track of the last analysis per `session_id`.
  - Weather data is fetched from the public **open‑meteo** API and used to enrich Gemini prompts.

- **Frontend** (`frontend/`):
  - Next.js (v16) application.
  - UI built with **React**, **Tailwind CSS**, and custom styling.
  - Handles authentication via **Supabase JS**.
  - Communicates with the backend via `fetch` to the `/analyze` and `/chat` endpoints.
  - Supports multilingual UI through a custom `LanguageContext` hook.

## Development Notes
- **Environment Variables**:
  - `GEMINI_API_KEY` – required for backend Gemini calls.
  - Any Supabase configuration is stored in the usual `supabase` env variables (e.g., `SUPABASE_URL`, `SUPABASE_ANON_KEY`).
- The backend and frontend are separate services; run them concurrently during development.
- The repo includes example UI screens in `frontend/stitch/...` for reference.

---

See `frontend/CLAUDE.md` for frontend‑specific commands.
