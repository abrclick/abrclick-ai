# @abrclick/ai

**Give your AI coding tool full control of [Abrclick](https://abrclick.ir)** — the
Farsi-first **PaaS + DBaaS** for Iran. Point any MCP-capable AI (Claude Code, Cursor,
Codex, Windsurf, Copilot, Cline, …) at this package and it can create projects, deploy
apps, provision databases, link app↔DB, manage env vars, custom domains, DNS, backups,
metrics, alerts, and team members — all on your Abrclick account, straight from chat.

It is a thin, safe wrapper over [`@abrclick/sdk`](../abrclick-sdk) and speaks the
**Model Context Protocol (MCP)** over **stdio**, so it plugs into every MCP client the
same way.

> **What is this, exactly?** A local program your AI tool launches. Your AI never talks
> to Abrclick directly — it calls the `abrclick_*` tools this package exposes, which call
> the Abrclick API with your key. No plugin store, no browser extension. One `npx` line.

## Why

You describe what you want — "deploy this Next.js repo and give it a Postgres" — and your
AI does it end to end: creates the project, the app, wires the git repo, provisions the
database, links them, kicks off the build, tails the logs, and hands you the live URL.
98 tools cover the whole platform.

## Prerequisites

- Node.js **>= 18**
- An Abrclick **API key** (`abr_sk_...`). Create one with the CLI:

  ```bash
  abrclick keys create "my-ai-tool"
  ```

  or from the dashboard under **Settings → API Keys**. The key is shown once — copy it.

## Quick start

```bash
# Claude Code
claude mcp add abrclick --env ABRCLICK_API_KEY=abr_sk_xxx -- npx -y @abrclick/ai
```

That's it. Ask Claude: *"list my Abrclick projects"* — if it answers, you're wired up.

## Configuration

Configured entirely through environment variables:

| Variable               | Required | Default                          | Purpose                                                         |
| ---------------------- | -------- | -------------------------------- | --------------------------------------------------------------- |
| `ABRCLICK_API_KEY`     | **yes**  | —                                | Your API key. The server refuses to start without it.           |
| `ABRCLICK_API_URL`     | no       | `https://api.abrclick.ir/v1`     | Regional resource plane base URL. Override for self-host / dev.  |
| `ABRCLICK_ACCOUNT_URL` | no       | `https://account.abrclick.ir/v1` | Global identity plane (auth, regions, billing reads).            |
| `ABRCLICK_REGION`      | no       | —                                | A region's `api_url` to pin the resource plane to a region.      |

> **Two planes.** Abrclick separates a *global account plane* (who you are, regions,
> billing) from *regional resource planes* (where your apps and databases actually run).
> The package handles the split for you; set `ABRCLICK_REGION` only if you want to pin a
> specific region.

## Wiring it into an AI tool

### Claude Code

```bash
claude mcp add abrclick --env ABRCLICK_API_KEY=abr_sk_xxx -- npx -y @abrclick/ai
```

Or add it to `.mcp.json` in your project:

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

### Codex CLI

Add to `~/.codex/config.toml`:

```toml
[mcp_servers.abrclick]
command = "npx"
args = ["-y", "@abrclick/ai"]
env = { ABRCLICK_API_KEY = "abr_sk_xxx" }
```

### Cursor

Add to `.cursor/mcp.json` (project) or `~/.cursor/mcp.json` (global):

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

### Windsurf / Cline / Continue / any other MCP client

Launch `npx -y @abrclick/ai` as a **stdio** MCP server with `ABRCLICK_API_KEY` set in its
environment. The config blocks above are the same shape every client uses — copy one and
change the file it goes in.

## Tools

**98 tools**, all `abrclick_`-prefixed, grouped by resource:

### Identity & regions

`whoami`, `list_regions`

### Projects & team

`list_projects`, `create_project`, `get_project`, `update_project`, `delete_project`,
`list_members`, `invite_member`, `remove_member`, `update_member_role`, `list_invites`,
`cancel_invite`, `get_activity`

### Apps

`list_apps`, `create_app`, `get_app`, `update_app`, `delete_app`, `start_app`, `stop_app`,
`restart_app`, `deploy_app`, `redeploy_app`, `get_source_upload_url`,
`get_source_download_url`

### Environments (staging / development / promote)

`list_environments`, `create_environment`, `promote_app`

### Deployments & logs

`list_deployments`, `rollback_deployment`, `retry_deployment`, `get_build_logs`,
`get_runtime_logs`

### Env vars

`get_env`, `set_env`, `delete_env_var`

### App ↔ DB links

`get_app_links`, `link_db`, `unlink_db`

### Domains & TLS

`list_domains`, `add_domain`, `verify_domain`, `remove_domain`, `upload_cert`

### GitHub integration

`get_github_install_url`, `list_github_repos`, `github_disconnect`

### Databases

`list_databases`, `get_database_versions`, `create_database`, `get_database`,
`update_database`, `get_database_credentials`, `delete_database`,
`enable_db_public_access`, `disable_db_public_access`, `get_database_logs`

### Backups

`list_backups`, `create_backup`, `restore_backup`, `clone_backup`, `set_backup_schedule`,
`delete_backup`

### DNS

`list_dns_zones`, `create_dns_zone`, `verify_dns_zone`, `delete_dns_zone`,
`list_dns_records`, `upsert_dns_record`, `delete_dns_record`

### One-click templates

`list_templates`, `get_template`, `deploy_template`, `get_template_deployment`

### Metrics & tiers

`get_app_metrics`, `get_database_metrics`, `get_tiers`

### Billing (read-only)

`get_usage`, `get_plans`, `get_invoices`, `get_addons`, `get_my_addons`, `get_wallet`,
`get_wallet_transactions`, `get_agent_usage`

### Alerts

`list_alert_rules`, `create_alert_rule`, `toggle_alert_rule`, `delete_alert_rule`

### Notifications

`get_notifications`, `get_unread_count`, `mark_notification_read`,
`mark_all_notifications_read`

### Tasks (per-project kanban)

`list_tasks`, `create_task`, `update_task`, `delete_task`

## Bundled skill

This package ships an **Abrclick skill** (`skills/abrclick/SKILL.md`) that teaches your AI
how to actually use these tools well — the project→app→database model, the deploy flow,
how to poll build logs, how to link a database, and which calls are destructive. MCP
clients that support skills load it automatically; others can read it for the same
guidance.

## Scope & safety

Designed so a well-meaning-but-fallible AI can drive real infrastructure without
foot-guns:

- **Billing is read-only.** `get_*` for usage, plans, invoices, wallet, and add-ons are
  exposed. Plan upgrades/downgrades, add-on **purchases**, and wallet **top-ups** are
  intentionally **not** — money moves are a human decision in the dashboard.
- **Auth is not exposed.** No login, register, password change, or device-code flow — an
  API key already establishes identity. GitHub **repo access** (for deploys) is exposed;
  GitHub/Google **sign-in** is not.
- **Destructive calls are marked.** Tool descriptions flag DESTRUCTIVE operations
  (`delete_project`, `delete_app`, `delete_database`, `delete_backup`, `delete_dns_zone`,
  `delete_dns_record`, `restore_backup`, `disable_db_public_access`). The bundled skill
  tells the AI to confirm with you first. **Nothing here prompts on its own** — enforce
  confirmations via your MCP client's approval settings for real safety.
- **Tarball deploy needs the CLI.** `deploy_app` supports `git` and `image` fully.
  `source_type: "upload"` deploys a tarball your AI can't upload (it can't stream file
  bytes) — for local-folder deploys, run `abrclick deploy` in your project directory.
- **Credentials are secret.** `get_database_credentials` and `get_env {reveal:true}`
  return live secrets. The skill instructs the AI not to echo them unless you ask.

## Development

```bash
npm install        # links ../abrclick-sdk via file:
npm run type-check # tsc --noEmit
npm run build      # tsc → dist/
npm start          # runs dist/index.js (needs ABRCLICK_API_KEY)
```

The tool surface tracks `@abrclick/sdk`. When the SDK gains a capability (e.g. container
registries, disks, cron jobs), add a matching `ToolDefinition` in `src/tools.ts` and list
it in the `tools` array — one wrapper per SDK method.

## License

Proprietary. See [LICENSE](./LICENSE).
