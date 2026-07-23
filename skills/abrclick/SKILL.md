---
name: abrclick
description: >
  Deploy and manage apps, databases, and infrastructure on Abrclick (Farsi-first PaaS +
  DBaaS for Iran) through the @abrclick/ai MCP server. Load whenever the user wants to
  deploy an app, provision a database (postgres/redis/mongo/mysql/mariadb/valkey/memcached/
  rabbitmq/kafka), link an app to a database, set environment variables, add a custom
  domain or TLS cert, manage DNS zones/records, promote to staging/production, roll back a
  deploy, read build/runtime/database logs or metrics, set alerts and backup schedules,
  manage project members, or check usage/billing on Abrclick. Requires the abrclick MCP
  server (`@abrclick/ai`) configured with an API key.
---

# Abrclick

Drive the [Abrclick](https://abrclick.ir) **PaaS + DBaaS** platform. Everything runs on
Kubernetes in Iran (Tehran, <10ms in-country latency). All operations go through the
`abrclick_*` tools provided by the `@abrclick/ai` MCP server.

## Setup check

If the `abrclick_*` tools are not available, the MCP server isn't wired up. Tell the user
to add it (they need an API key from `abrclick keys create "<name>"` or the dashboard →
Settings → API Keys):

```json
{
  "mcpServers": {
    "abrclick": {
      "command": "npx",
      "args": ["-y", "@abrclick/ai"],
      "env": { "ABRCLICK_API_KEY": "abr_sk_xxx" }
    }
  }
}
```

Confirm with `abrclick_whoami` — it returns the authenticated account.

## Core model — read before acting

- **Project → App / Database.** Everything lives under a **project** (one project = one
  isolated Kubernetes namespace; apps and databases inside it can talk to each other
  directly). Most create calls need a `project_id`. If the user hasn't named one, call
  `abrclick_list_projects` first and confirm which to use — or `abrclick_create_project`.
- **IDs, not names.** Tools take `app_id` / `db_id` / `project_id` / `zone_id` /
  `domain_id`. Resolve a name the user gives you by **listing first**
  (`abrclick_list_apps`, `abrclick_list_databases`, `abrclick_list_projects`), then match.
  Never guess an ID.
- **Config is snake_case.** Sizes are strings: CPU like `"500m"` / `"1"`, memory like
  `"512Mi"` / `"1Gi"`. `storage_gb` is a number. Call `abrclick_get_tiers` with
  `{ type: "app" }` or `{ type: "database" }` to see valid presets before create/update.
- **Changes need a redeploy.** Editing env vars, linking a DB, or changing config does
  **not** take effect until the app redeploys (`abrclick_redeploy_app`). Say so.
- **Farsi errors.** Tool errors carry both English and Farsi (`message_fa`). Surface the
  Farsi to the user when they're working in Farsi.
- **Regions.** `abrclick_list_regions` shows deployment regions. The API key is
  region-agnostic; pin a region with the `ABRCLICK_REGION` env var if needed.

## Common workflows

### Deploy an app from git

1. `abrclick_list_projects` → pick/confirm `project_id` (or `abrclick_create_project`).
2. `abrclick_create_app` `{ project_id, name, runtime, port? }`. Runtimes include
   `nodejs`, `nextjs`, `python`, `go`, `php`, `static`, `docker`, and framework presets
   (react/vue/nuxt/svelte/…). Set `port` if the app doesn't listen on 3000.
3. `abrclick_update_app` with `git_repo_url`, `git_branch`, and `git_auto_deploy: true`
   for push-to-deploy. (Needs the GitHub app connected for private repos — see below.)
4. `abrclick_deploy_app` `{ app_id, source_type: "git", git_commit_sha? }`.
5. Poll `abrclick_get_build_logs` `{ app_id, deploy_id, cursor }` — advance `cursor` from
   each response until `done: true`. Then `abrclick_get_runtime_logs` to confirm the
   container is healthy. The app is served at `https://<app-slug>.abrclick.ir`.

> Deploying from a **local folder** (uploading a source tarball) is **not** an MCP
> operation — the AI can't stream file bytes. `abrclick_get_source_upload_url` mints the
> URL, but tell the user to run `abrclick deploy` in their project directory to upload.

### Deploy a prebuilt image

`abrclick_deploy_app` `{ app_id, source_type: "image", image_tag: "registry/img:tag" }`.

### Connect GitHub (for private-repo git deploys)

1. `abrclick_get_github_install_url` → give the user the URL to open in a browser and
   authorize the Abrclick GitHub app.
2. `abrclick_list_github_repos` → confirm the repo is now accessible, then use its clone
   URL in `abrclick_update_app`.

### Provision a database and link it to an app

1. `abrclick_get_database_versions` to confirm an available version.
2. `abrclick_create_database` `{ project_id, name, type: "postgres", version, storage_gb,
   cpu_limit?, memory_limit?, replica_set? }`. Types: postgres, redis, mongo, mysql,
   mariadb, valkey, memcached, rabbitmq, kafka. (`replica_set` applies to mongo.)
3. `abrclick_link_db` `{ app_id, database_id, env_prefix? }` — injects connection env vars
   (e.g. `DATABASE_URL`, `DATABASE_HOST`) into the app. Then **redeploy the app**
   (`abrclick_redeploy_app`) for the new env to take effect.
4. `abrclick_get_database_credentials` `{ db_id }` for the raw connection string. Treat
   credentials as **secret** — don't echo them unless the user explicitly asks.

### Public database access

`abrclick_enable_db_public_access` `{ db_id }` exposes the DB on the public internet (via
gateway port). `abrclick_disable_db_public_access` closes it (**mark as sensitive** — apps
connecting over the public endpoint will break). Prefer in-namespace links over public
access when the consumer is another Abrclick app.

### Environment variables

- `abrclick_set_env` `{ app_id, vars: [{ key, value, is_secret?, is_build_time? }] }` —
  bulk upsert. Mark secrets with `is_secret: true`; mark vars needed during the build
  (e.g. during `npm run build`, not just at runtime) with `is_build_time: true`.
- `abrclick_get_env` `{ app_id, reveal: true }` to see secret values (secret; don't echo
  unprompted).
- `abrclick_delete_env_var` `{ app_id, key }`. **A change to env requires a redeploy.**

### Custom domain + TLS

1. `abrclick_add_domain` `{ app_id, domain }`.
2. Tell the user the DNS record to set (from the response).
3. `abrclick_verify_domain` `{ app_id, domain_id }` once DNS points at Abrclick. TLS is
   auto-issued (Let's Encrypt). For a bring-your-own cert, `abrclick_upload_cert`
   `{ app_id, domain_id, cert, key }` (the `key` is a secret).

### Managed DNS

1. `abrclick_create_dns_zone` `{ name }` → returns nameservers; user sets them at their
   registrar.
2. `abrclick_verify_dns_zone` `{ zone_id }` once delegation is live.
3. `abrclick_upsert_dns_record` `{ zone_id, name, type, records, ttl? }` — types A, AAAA,
   CNAME, TXT, MX, NS, CAA, SRV. `records` is an array of values.
4. `abrclick_delete_dns_record` / `abrclick_delete_dns_zone` (both destructive).

### Staging → production (environments & promote)

- `abrclick_create_environment` `{ app_id, environment: "staging" }` clones a slot.
- `abrclick_promote_app` `{ app_id, to: "production", confirm_production: true }` promotes
  the built image to another environment **without rebuilding**. Promoting **to
  production requires `confirm_production: true`** — confirm with the user first.

### One-click template (WordPress, n8n, Ghost, …)

1. `abrclick_list_templates` → find the slug.
2. `abrclick_get_template` `{ slug }` → see required `variables`.
3. `abrclick_deploy_template` `{ slug, project_id, app_name, variables? }`.
4. Poll `abrclick_get_template_deployment` `{ id }` until ready.

### Backups

- `abrclick_create_backup` `{ db_id }` — on-demand snapshot.
- `abrclick_set_backup_schedule` `{ db_id, schedule }` — cron expression (e.g.
  `"0 3 * * *"`), or `null` to disable automatic backups.
- `abrclick_clone_backup` `{ db_id, backup_id, name }` — **non-destructive**: spins up a
  brand-new database from the snapshot. Use this to test a restore safely.
- `abrclick_restore_backup` `{ db_id, backup_id }` — **DESTRUCTIVE, overwrites the live
  database.** Confirm first; suggest `clone_backup` if they only want a copy.

### Monitoring & alerts

- `abrclick_get_app_metrics` / `abrclick_get_database_metrics` `{ ..., range: "1h" }` —
  CPU/memory/etc. Good for diagnosing OOM or crash-loops.
- `abrclick_create_alert_rule` `{ resource_id, resource_type, metric, operator, threshold,
  duration_minutes?, notify_via? }` — e.g. CPU `gt` 80 for 5 min, notify via `both`.
  `abrclick_list_alert_rules` / `toggle_alert_rule` / `delete_alert_rule` manage them.

### Debug a broken deploy

- `abrclick_list_deployments` `{ app_id }` → find the failed one.
- `abrclick_get_build_logs` for build failures; `abrclick_get_runtime_logs` for crashes.
- `abrclick_rollback_deployment` `{ app_id, deploy_id }` to the last good deploy, or
  `abrclick_retry_deployment` to re-run.
- `abrclick_get_app_metrics` `{ app_id, range }` for OOM/crash-loop clues.

### Team & activity

`abrclick_invite_member` `{ project_id, email, role }` (role: admin|developer|viewer),
`abrclick_list_members`, `abrclick_update_member_role`, `abrclick_remove_member`,
`abrclick_list_invites`, `abrclick_cancel_invite`, `abrclick_get_activity` (audit log).

### Project tasks (kanban)

`abrclick_list_tasks` / `create_task` / `update_task` / `delete_task` — a per-project
kanban board (status: backlog|todo|doing|review|done, priority, labels, due date).

## Safety

These tools act on **live infrastructure**. Before any **destructive or irreversible**
call, state exactly what will be affected and **confirm with the user first**:

- `abrclick_delete_project` / `abrclick_delete_app` / `abrclick_delete_database` —
  destroy resources and data.
- `abrclick_delete_backup`, `abrclick_delete_dns_zone`, `abrclick_delete_dns_record`.
- `abrclick_restore_backup` — **overwrites** the live database (offer `clone_backup`).
- `abrclick_disable_db_public_access` — breaks anything connecting over the public
  endpoint.
- `abrclick_promote_app { to: "production" }` — needs `confirm_production: true`.

**Billing is read-only here** (`get_usage`, `get_plans`, `get_invoices`, `get_addons`,
`get_my_addons`, `get_wallet`, `get_wallet_transactions`, `get_agent_usage`). To upgrade a
plan, buy an add-on, or top up the wallet, **send the user to the dashboard** — those
money moves are intentionally not exposed to AI.

**Never echo secrets** (`get_database_credentials`, `get_env { reveal: true }`,
`upload_cert` key) unless the user explicitly asks for them.
