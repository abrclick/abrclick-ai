import Conf from "conf";
import { AbrclickClient } from "@abrclick/sdk";

/**
 * Credential resolution — the same store the CLI writes, so `abrclick login` once is all it
 * takes. No env-var dance, no restart-with-env, no plaintext key in your shell profile.
 *
 * Priority:
 *   1. ABRCLICK_API_KEY / ABRCLICK_TOKEN env  → an `abr_sk_…` key (CI/headless). Never expires.
 *   2. The CLI login store (`abrclick login`)  → a JWT + refresh token. Auto-refreshed and
 *      persisted back to the store, so a long-lived server never goes stale mid-session.
 *   3. Neither → a clear error telling the user to run `abrclick login`.
 *
 * The store is the exact `conf` project the CLI uses (projectName "abrclick"), so its path is
 * resolved per-OS by conf/env-paths (macOS ~/Library/Preferences, Linux ~/.config,
 * Windows %APPDATA%) — identical on every machine, no hardcoded paths.
 */

interface CliConfigSchema {
  token: string;
  refreshToken: string;
  apiUrl: string;
  accountUrl: string;
  region: string;
}

// Must match abrclick-cli/src/lib/config.ts (projectName + these keys) so we read the same file.
const store = new Conf<CliConfigSchema>({
  projectName: "abrclick",
  defaults: {
    token: "",
    refreshToken: "",
    apiUrl: "https://api.abrclick.ir",
    accountUrl: "https://account.abrclick.ir",
    region: "",
  },
});

// The CLI stores bare origins (no /v1); the SDK expects the /v1 base. Normalize.
const withV1 = (url: string): string => `${url.replace(/\/+$/, "").replace(/\/v1$/, "")}/v1`;

export function createClient(): AbrclickClient {
  // Bases: explicit env override, else whatever region the CLI is pointed at.
  const apiUrl = withV1(process.env.ABRCLICK_API_URL ?? store.get("apiUrl"));
  const accountUrl = withV1(process.env.ABRCLICK_ACCOUNT_URL ?? store.get("accountUrl"));

  // env wins — an explicit API key is the deliberate CI/headless override.
  const envKey = process.env.ABRCLICK_API_KEY ?? process.env.ABRCLICK_TOKEN;
  if (envKey) {
    // API-key path: no refresh token, no interceptor — the SDK sets the header once.
    return new AbrclickClient({ apiUrl, accountUrl, token: envKey });
  }

  const token = store.get("token");
  if (!token) {
    throw new Error(
      "Not authenticated. Run `abrclick login` — this MCP server reads the same credentials.\n" +
        "For CI/headless, set ABRCLICK_API_KEY=abr_sk_… instead.\n" +
        "Get the CLI: npm i -g @abrclick/cli",
    );
  }

  const refreshToken = store.get("refreshToken");
  return new AbrclickClient({
    apiUrl,
    accountUrl,
    token,
    refreshToken: refreshToken || undefined,
    // Persist rotated tokens back to the shared store so CLI and MCP stay in lockstep.
    onTokenRefresh: ({ access_token, refresh_token }) => {
      store.set("token", access_token);
      store.set("refreshToken", refresh_token);
    },
  });
}
