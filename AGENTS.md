# TreinoDuoTreino — dev log

## Goal
Build and deploy a personal gym workout tracking web app (TreinoDuoTreino) with per-user auth, session-based training, global exercise/equipment catalog, and technique-based workout logging.

## Stack
- Hosted on GitHub Pages (`https://feknows.github.io/treinoDuoTreino/`)
- Node.js + React (Vite)
- Supabase (free tier) for DB and auth; anon key in client
- GitHub Actions (peaceiris/gh-pages) for deploy
- Repo: `https://github.com/feknows/treinoDuoTreino`

## Auth
- Login with email/password
- Public signup disabled; invite-only via `supabase.auth.signUp()` inside the app
- AuthContext manages user state, provides `signOut()`
- AuthPage handles login, forgot password, password reset via recovery link

## Workout Structure
- 1 session/day with blocks for warmup + main
- Techniques: Pump Set, Loading Set, Valid Set, Muscle Round (dynamic blocks, optional Drop Sets, configurable default load)
- Warmup in template has no sets/reps (filled during workout), just a Concluir button
- Exercise Form: "Próximo →" for non-last main exercise, "✅ Concluir Treino" for last (auto-finishes session)
- "Série Válida" badge (red) on Loading Set form

## Database
- Global catalog: all users share same exercises and equipment
- Per-user private data: workout sessions, session exercises, templates
- Templates can be shared with other users by email via `template_shares` table
- RLS recursion fixed via SECURITY DEFINER helper functions (`is_template_owner`, `get_shared_template_ids`)
- `start_session_from_template` RPC copies template exercises to session
- SQL files organized in `sql/` directory

## Key Decisions
- Technique types stored as fixed enum (technique_types table) + JSONB for config/execution data
- Exercises/equipment shared globally (user_id filter removed on SELECT; INSERT allowed to all authenticated, UPDATE/DELETE restricted to creator)
- Delete confirmation is inline (✕ becomes "Excluir? ✓ ✕") instead of browser popup
- Template form doesn't render technique config (only selects technique type)
- On "Treinar" tab: always shows start panel (template select, avulso, or "▶ Continuar Treino Atual")

## Completed Features
- Vite + React scaffold, all deps installed
- App structure: tabs (Início, Treinar, Histórico, Progresso, Gerenciar, Ajuda) via useState
- AuthContext, AuthPage (login, forgot password, password reset)
- Profile: display/edit name, change password, change email, logout button
- Dashboard with welcome, quick stats, action links
- WorkoutSession: start session from template or avulso, step through exercises with technique-specific forms
- TemplateForm: create/edit templates with warmup (only exercise + equipment) and main exercises
- Manage: ItemManager with inline edit + inline delete confirmation
- History: sessions grouped by date, expandable, inline delete confirmation, date format (weekday DD-MM-YYYY), sort filter (newest/oldest), incomplete exercise alert
- Progress: Chart.js line graph for Valid Set (load + estimated 1RM over time)
- CSS: dark theme, responsive, all component styles
- Pump Set: simplified (load + reps, no checkbox)
- Loading Set: simplified (1 pair load/reps, "SÉRIE VÁLIDA" badge)
- Muscle Round: dynamic blocks, default load + default drop load (side by side)
- Native number spinners hidden
- Git repo, GitHub Actions deploy configured

## UI Conventions
- No popups/confirm dialogs on delete — inline confirmation
- Delete = ✕, Confirm = ✓, Cancel = ✕
- Dark theme: --bg #121212, --surface #1e1e1e, --surface2 #2a2a2a, --primary #00e676, --secondary #7c4dff, --danger #ff5252
- "Continuar Treino Atual" button: purple (--secondary), full width
- "Iniciar Treino" button: green (--primary), full width
- "Sair da Conta" button: red outline (--danger)

## Pending/Migration SQLs (run in Supabase SQL Editor)
- `sql/global-catalog.sql` — migrate to global catalog (idempotent)
- `sql/migration-fix-rls-recursion.sql` — SECURITY DEFINER helper functions
- `sql/migration-remove-template-warmup.sql` — update start_session_from_template

## Next Steps (suggested)
1. Run pending SQLs if not already
2. Test full flow: create template → start session → complete exercises → check history
3. Any further feature requests or bug fixes

## Common Commands
```bash
npm run dev      # Start dev server
npm run build    # Build for production
git add . && git commit -m "msg" && git push  # Deploy
```
