# MediBook Development Rules

These rules apply to every task in this project.

## Read first

- Read `PRD.md` before starting every task.
- Read `design/README.md` before making any visual or UI change.
- Treat the requirements and design rules in those files as the project's source of truth.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- lucide-react
- Supabase with `@supabase/ssr`

## Security

- Never put secret keys in browser or client-side code.
- Never commit `.env` files or credentials.
- Use server-side authorization checks for protected and admin functionality.

## UI quality

- Every page must work on mobile and desktop.
- Every data-driven page must include loading, empty, and error states.
- Follow the reusable visual rules in `design/README.md`.
- Keep status colors, spacing, typography, buttons, cards, forms, and navigation consistent.
- Preserve accessibility: visible focus states, readable contrast, labels, keyboard support, and useful error messages.

## Workflow

- Make one focused feature or change at a time.
- After each change, run `npm run lint` and `npm run build`, then fix every relevant error.
- Test the affected user flow before marking work complete.
- Do not change the Supabase database schema unless the user explicitly requests it.
- Explain completed changes in simple words.
- Commit each working feature with a clear commit message when Git is available.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
