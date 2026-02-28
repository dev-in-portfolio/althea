# Rule Furnace (Fresh + Neon)

Rules engine builder and test harness built with Fresh and Neon. Author rules, run payloads, and review outcomes.

## Features
- Rule editor with priority + enable toggles
- Safe DSL evaluation (no code execution)
- Test harness with run history
- Neon-backed persistence

## Setup
1. Create `.env` from `.env.example`
2. Apply SQL in `sql/001_rule_furnace.sql`
3. Run locally
   - `deno task dev`

## Routes
- `/` rules list
- `/rules/new` create
- `/rules/:id` edit
- `/test` test harness
- `/runs` run history
