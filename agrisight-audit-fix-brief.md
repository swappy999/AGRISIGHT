# AgriSight — Full App Audit & Fix Brief (for Antigravity)

## How to use this file
Either:
- Paste this whole document as your first message to Antigravity in this project, **or**
- Save it as `AGENTS.md` in the project root (or `.agents/AGENTS.md`) so every agent session loads it automatically before starting work.

---

## Project Context

AgriSight is a multilingual AI-powered smart farming assistant.

- **Frontend:** Next.js / React (also shipped to Android via Capacitor)
- **Backend:** FastAPI (Python) — sits between frontend and all AI/DB calls
- **AI:** Google Gemini (vision for crop scans, conversational for the AI Assistant)
- **Auth/DB:** Supabase (Google OAuth, user profiles, field data, Row Level Security)
- **Languages supported:** English (`en-IN`), Hindi (`hi-IN`), Bengali (`bn-IN`) — covers UI text, AI responses, voice input (STT), and voice output (TTS)

---

## Mission

1. Audit the entire app for defects — not just the two issues below.
2. Fix the priority issues first.
3. Do **not** silently redesign or add new features while fixing bugs — fix the root cause, keep scope tight.
4. Produce a written report: what was broken, what you changed and why, what you couldn't fix and why not.
5. Stop after fixing and hand back the test plan at the bottom — don't declare the app "done," the owner will run manual testing next.

---

## Priority Issue 1 — Multilingual support is incomplete

**Reported symptom:** switching the app language (English / Hindi / Bengali) does not fully apply everywhere. Specifically broken in:
- The **Crop Scan** flow (capture → analysis → result display)
- The **AI Assistant** chat

**Investigate these likely root causes, and report which ones are actually present:**
1. Hardcoded English strings in scan-result or assistant-chat components instead of going through the i18n layer.
2. The Gemini prompt sent for scan analysis doesn't explicitly instruct the model to respond in the currently selected language.
3. The Gemini prompt sent from the AI Assistant chat doesn't pass/enforce the current language either.
4. Voice input (STT) locale isn't kept in sync with the UI language toggle — it may be defaulting to `en-IN` regardless of selection.
5. Voice output (TTS) locale/voice isn't kept in sync with the UI language.
6. Language preference isn't read from a single global source — some components may read a stale default instead of the user's actual selection or saved profile preference.
7. Language switch requires a page reload/app restart to take effect somewhere it shouldn't.

**Fix requirements:**
- One single source of truth for "current language" (shared context/store), read consistently everywhere — no per-component defaults.
- Every AI-facing call (scan analysis, assistant chat) must explicitly tell Gemini which language to respond in.
- No literal English strings left in scan result cards, assistant chat bubbles, or empty/error states — all through i18n keys.
- Voice input and voice output locale must always match whatever language is currently active, and update immediately on switch.

---

## Priority Issue 2 — Dashboard widget alignment

**Reported symptom:** one or more dashboard widgets are visually misaligned relative to the others. (Possibly the weather widget — confirm exactly which one(s) during the audit rather than assuming.)

**Investigate:**
- Grid/flex container inconsistency across dashboard cards
- Differing card heights caused by variable content length (e.g. weather card vs. alert card vs. field card)
- Responsive breakpoint issues between mobile, tablet, and desktop widths
- Whether the Capacitor/Android WebView renders differently from the browser preview

**Fix requirements:**
- Normalize alignment/heights across all dashboard cards using one consistent grid/flex system.
- Verify the fix holds at mobile widths, since this ships as an Android app.
- Check every dashboard card for the same class of bug — don't only patch the one that was reported.

---

## Full Audit Checklist

Work through this even where the owner hasn't reported a specific bug. For each item, record: **Working / Partially working / Broken / Not yet implemented**.

- [ ] Auth flow (Google OAuth → Supabase session → protected routes → logout → session expiry handling)
- [ ] Crop Scan (capture/upload → image validation → Gemini vision call → localized result rendering)
- [ ] Crop / non-crop validation (cleanly rejects irrelevant images, message shown in the selected language)
- [ ] AI Assistant chat (text in/out correctly localized, conversation context retained across turns)
- [ ] Voice input (mic → STT in the correct locale → text delivered to AI correctly)
- [ ] Voice output (AI response → TTS in the correct locale/voice)
- [ ] Weather widget (data loads for the correct field/location, labels localized)
- [ ] Alerts/risk cards (render correctly, localized, never show placeholder data as if it were real)
- [ ] Field management (create/edit a field, per-field context persists correctly)
- [ ] Analytics (shows "not enough data yet" instead of fabricating trends when data is sparse)
- [ ] Mobile shell (Android back button, drawers, modals, splash screen, offline/network-lost state)
- [ ] Secrets handling (confirm `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_CLIENT_SECRET` never reach client bundle, Android build, or logs)

---

## Fix Guidelines

- Fix the shared root cause once, not each screen individually — e.g. if the bug is "language context isn't read here," fix that pattern everywhere it appears, not only in Scan.
- Keep all secrets and Gemini/Supabase service-role calls server-side in FastAPI — never add a new client-side call that bypasses this.
- If something looks like an unimplemented future feature (e.g. Edge AI, offline mode, real IoT ingestion) rather than a bug, just note it as "not yet implemented" — don't build it now, that's out of scope for this pass.

---

## Test Plan to Hand Back After Fixing

For **each** of English / Hindi / Bengali, verify and report pass/fail:

1. All UI text is localized — no leftover English strings.
2. Crop Scan result text is localized.
3. AI Assistant response text is localized.
4. Voice input correctly recognizes speech in that language.
5. Voice output correctly speaks back in that language.
6. Dashboard renders with no misaligned widgets, at both mobile and desktop widths.

Report back with: what was broken, what you changed and why, what couldn't be fixed and why not, and this test table filled in.
