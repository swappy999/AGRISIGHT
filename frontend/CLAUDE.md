# Build & Run Commands

- **Backend**:
  - Build: `go build -o ../../backend/bin/server backend/archive_go/main.go`
  - Run: `../../backend/bin/server` (listens on port 8080)
  - Test: `go test ./...` (no tests currently)
- Dev: `npm run dev`
- Build: `npm run build`
- Local Start: `npm run start`
- Lint: `npm run lint`

# Style & Conventions
- Framework: Next.js (Note: Version 16+ may have API changes)
- Styling: Tailwind CSS & Vanilla CSS mix
- Auth: Supabase JS
- Translations: Custom LanguageContext hook in `@/context/LanguageContext`
- Icons: Material Symbols Outlined (Google Fonts)

@AGENTS.md
