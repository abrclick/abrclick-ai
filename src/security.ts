export interface ToolAnnotations {
  readOnlyHint: boolean;
  destructiveHint: boolean;
}

interface ToolDetails {
  name: string;
  description: string;
}

interface ConfirmationRequest {
  mode: "form";
  message: string;
  requestedSchema: {
    type: "object";
    properties: {
      confirm: {
        type: "boolean";
        title: string;
      };
    };
    required: string[];
  };
}

interface ConfirmationResponse {
  action: "accept" | "decline" | "cancel";
  content?: Record<string, unknown>;
}

export interface ConfirmationRequester {
  getClientCapabilities(): { elicitation?: { form?: unknown } } | undefined;
  elicitInput(params: ConfirmationRequest): Promise<ConfirmationResponse>;
}

const DESTRUCTIVE_TOOL_NAME = /(delete|remove|revoke|rotate|restore|rollback|disable|stop|unlink|unassign|detach|cancel|disconnect)/;
const LOW_RISK_READ_ONLY_TOOLS = new Set([
  "abrclick_whoami",
  "abrclick_list_regions",
  "abrclick_list_projects",
  "abrclick_get_project",
  "abrclick_list_members",
  "abrclick_list_invites",
  "abrclick_list_apps",
  "abrclick_get_app",
  "abrclick_list_environments",
  "abrclick_list_deployments",
  "abrclick_list_databases",
  "abrclick_get_database",
  "abrclick_get_database_versions",
  "abrclick_list_backups",
  "abrclick_list_dns_zones",
  "abrclick_list_dns_records",
  "abrclick_list_templates",
  "abrclick_get_template",
  "abrclick_get_template_deployment",
  "abrclick_get_app_metrics",
  "abrclick_get_database_metrics",
  "abrclick_get_tiers",
  "abrclick_get_usage",
  "abrclick_get_plans",
  "abrclick_list_alert_rules",
  "abrclick_list_tasks",
  "abrclick_list_all_buckets",
  "abrclick_list_buckets",
  "abrclick_get_bucket",
  "abrclick_get_bucket_cors",
  "abrclick_get_bucket_versioning",
  "abrclick_get_bucket_lifecycle",
  "abrclick_list_all_registries",
  "abrclick_list_registries",
  "abrclick_get_registry",
  "abrclick_list_functions",
  "abrclick_get_function",
  "abrclick_get_function_metrics",
  "abrclick_list_function_triggers",
  "abrclick_list_crons",
  "abrclick_get_cron",
  "abrclick_get_cron_runs",
  "abrclick_list_disks",
  "abrclick_get_disk",
  "abrclick_list_disk_backups",
]);
const SENSITIVE_FIELD_NAMES = new Set([
  "password",
  "passphrase",
  "secret",
  "secretkey",
  "secretaccesskey",
  "accesskey",
  "accesskeyid",
  "refreshtoken",
  "accesstoken",
  "idtoken",
  "apikey",
  "privatekey",
  "connectionstring",
  "databaseurl",
]);

function isReadOnlyTool(name: string): boolean {
  return LOW_RISK_READ_ONLY_TOOLS.has(name);
}

export function requiresUserConfirmation(name: string): boolean {
  return !isReadOnlyTool(name);
}

export function getToolAnnotations(name: string): ToolAnnotations {
  if (!requiresUserConfirmation(name)) {
    return { readOnlyHint: true, destructiveHint: false };
  }

  return {
    readOnlyHint: false,
    destructiveHint: DESTRUCTIVE_TOOL_NAME.test(name),
  };
}

export async function executeWithUserConfirmation<T>(
  requester: ConfirmationRequester,
  tool: ToolDetails,
  handler: () => Promise<T>,
): Promise<T> {
  const capabilities = requester.getClientCapabilities();
  if (!capabilities?.elicitation?.form) {
    throw new Error("This client does not support user confirmations; refusing to execute this tool.");
  }

  const response = await requester.elicitInput({
    mode: "form",
    message: `Confirm execution of ${tool.name}: ${tool.description}`,
    requestedSchema: {
      type: "object",
      properties: {
        confirm: { type: "boolean", title: "Confirm" },
      },
      required: ["confirm"],
    },
  });

  if (response.action !== "accept" || response.content?.confirm !== true) {
    throw new Error("The user declined or cancelled this tool execution.");
  }

  return handler();
}

function isPlainObject(value: object): value is Record<string, unknown> {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function normalizeFieldName(name: string): string {
  return name.replace(/[-_]/g, "").toLowerCase();
}

export function redactSensitiveResult(result: unknown): unknown {
  const seen = new WeakSet<object>();

  const redact = (value: unknown): unknown => {
    if (value === null || typeof value !== "object") return value;
    if (!Array.isArray(value) && !isPlainObject(value)) return value;
    if (seen.has(value)) return "[Circular]";
    seen.add(value);

    if (Array.isArray(value)) return value.map(redact);

    const copy: Record<string, unknown> = {};
    for (const key of Object.keys(value)) {
      if (SENSITIVE_FIELD_NAMES.has(normalizeFieldName(key))) {
        copy[key] = "[REDACTED]";
        continue;
      }

      try {
        copy[key] = redact(value[key]);
      } catch {
        copy[key] = "[Unserializable]";
      }
    }
    return copy;
  };

  return redact(result);
}
