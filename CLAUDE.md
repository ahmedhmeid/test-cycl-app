# Build Agent

## Project
- Name: New app
- Description: This app is for demonstrating cycl
- Framework: Next.js (App Router) with TypeScript

## How To Build
1. Read `.build/plan.md` for the full implementation plan
2. Read `.build/tasks.md` for all tasks with done-when criteria
3. Read `.build/react-best-practices.md` for framework best practices — follow these rules
4. Read `.build/supabase-best-practices.md` for framework best practices — follow these rules
5. Read `.build/nextjs-docs-index.md` for framework best practices — follow these rules
6. Read `.build/nextjs-breaking-changes.md` for framework best practices — follow these rules
7. Implement tasks in the order specified in the plan

## Code Traceability
When implementing a task, add a comment at the start of each new function, component, class, or route handler you create:
  // [CYCL:<taskId>] <brief description of what this code does and why>
Use the full task ID from the task you are currently working on.
Do NOT add traceability comments to every line — only at the start of key code blocks (functions, components, classes, route handlers).
Do NOT add traceability comments to imports, type definitions, or trivial helper lines.

If you encounter existing [CYCL:<id>] comments in the codebase from previous cycles and need
to understand what they refer to, use the `cycl` MCP server's `lookup_entity` tool with the
UUID to get the task name, description, feature context, and acceptance criteria. This is
useful when modifying or extending code built in earlier cycles.

## Progress Reporting
IMPORTANT: You MUST output these markers for every task you work on.

When starting a task, output on its own line:
  [TASK_START:<taskId>]

When a task is complete, output on its own line:
  [TASK_COMPLETE:<taskId>:<one-line summary>]

If blocked on a task, output on its own line:
  [TASK_BLOCKED:<taskId>:<reason>]

Commit after each completed task with message: feat(cycl): <taskName>

## Rules
- Implement tasks in plan order — do NOT skip ahead
- Do NOT mark tasks complete without actually implementing them
- Read the plan and tasks files first, then implement — don't re-read repeatedly
- Focus on working code, not perfection
- Do not create unnecessary test files unless the task explicitly requires tests
- If a task seems unclear, make a reasonable decision and move on
- Verify .gitignore exists and includes node_modules/, .env, .env.local, .next/ BEFORE your first commit — create one if missing
- NEVER commit secrets, .env files, or dependency directories to git
- NEVER import or reference a file/module you haven't created yet — create dependency files BEFORE the files that import them
- Keep the codebase compilable after every commit — don't leave broken imports or missing modules
- Don't read the same file more than once — read it, understand it, then implement
- Avoid broad exploration (Glob *.tsx, find, ls -R) — read specific files by path
- If you are running low on context or budget, prioritize completing in-progress tasks over starting new ones
- Every component, hook, utility, or function you create MUST be imported and used in the app. Never leave orphan files. If a task says "build X", that means build it AND wire it into the app — import it in the appropriate parent page or layout, call it from the correct code path, and create new pages/routes if needed so the feature is accessible to users. Code that exists but is never rendered or called is a bug.
- When writing Supabase RLS policies, default to the anon key + RLS approach — policies should allow the `authenticated` role for user-facing operations. Only use `service_role` for server-side admin operations that genuinely need to bypass RLS, and protect those code paths carefully. If your API routes use the standard Supabase client (anon key), your RLS policies must allow `authenticated` — not just `service_role`.
- After every 3 completed tasks, run `npx tsc --noEmit` to catch type errors early. Fix any errors before continuing to the next task. This prevents type errors from snowballing across the entire build.
- When scaffolding a new project (e.g. create-next-app), do NOT run the scaffolding command in the current directory (`.`) — the build context files (.build/, CLAUDE.md) will cause conflicts. Instead: scaffold in a subdirectory (`npx create-next-app tempapp --yes ...`), then move the generated files to the repo root (`shopt -s dotglob && mv tempapp/* . && rm -rf tempapp`)

## MCP Tools

You have access to MCP servers configured for this project. Follow the safety rules strictly for each:

### cycl
**Safety rules:** Read-only server for looking up Cycl entity details. Use lookup_entity to resolve [CYCL:<id>] traceability comment UUIDs from previous cycles.

### Supabase
**Safety rules:** May create and alter tables (profiles, groups, group_members, group_invites, habits, habit_logs, kudos, badges, notification_preferences, weekly_summaries, push_subscriptions), run queries, and manage schemas. May modify RLS policies for new tables only. May access storage buckets for avatar uploads. Do NOT delete the project, modify existing auth providers, or alter core auth.users table.

### General MCP Rules
- Prefer read operations over writes when possible
- Never perform destructive operations (delete, drop, purge) unless a task's done-when criteria explicitly requires it
- If a task requires a write operation, do the minimum necessary change

### MCP Priority
- When an MCP server provides a tool for an operation (e.g. Supabase execute_sql, apply_migration), ALWAYS use the MCP tool. NEVER fall back to curl, REST API calls, or raw HTTP requests for the same operation.
- Do NOT use bash curl/wget to interact with services that have MCP tools available.
- Do NOT hardcode access tokens or API keys in bash commands. MCP tools handle authentication automatically.
- If an MCP tool call fails, report the error — do not work around it with curl.

### MCP Reproducibility
- When you use an MCP tool to modify external state (database schemas, tables, configurations, deployments), you MUST also create a corresponding local file in the repo that records that change
- For database schema changes: create SQL migration files in the project's migration directory (e.g., supabase/migrations/, prisma/migrations/, drizzle/, or migrations/). Use timestamped filenames
- For other stateful operations: create a config file or script that can reproduce the change in another environment
- The repo is the source of truth — MCP tools are a convenience for applying changes to the dev environment, not a replacement for checked-in files
- NEVER make an MCP state change that is not also recorded as a file in the codebase
