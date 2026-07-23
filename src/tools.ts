import { z, ZodRawShape } from "zod";
import type { AbrclickClient } from "@abrclick/sdk";

type Json = Record<string, unknown>;

interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: ZodRawShape;
  handler: (client: AbrclickClient, args: Record<string, unknown>) => Promise<unknown>;
}

// Identity/regions
const whoami: ToolDefinition = {
  name: "abrclick_whoami",
  description: "Get current authenticated Abrclick user information",
  inputSchema: {},
  handler: async (client) => client.getMe(),
};

const listRegions: ToolDefinition = {
  name: "abrclick_list_regions",
  description: "List available Abrclick regions for deployment",
  inputSchema: {},
  handler: async (client) => client.listRegions(),
};

// Projects
const listProjects: ToolDefinition = {
  name: "abrclick_list_projects",
  description: "List all Abrclick projects for the authenticated user",
  inputSchema: {},
  handler: async (client) => client.getProjects(),
};

const createProject: ToolDefinition = {
  name: "abrclick_create_project",
  description: "Create a new Abrclick project",
  inputSchema: {
    name: z.string(),
    description: z.string().optional(),
  },
  handler: async (client, args) => client.createProject(args as { name: string; description?: string }),
};

const getProject: ToolDefinition = {
  name: "abrclick_get_project",
  description: "Get Abrclick project details by ID",
  inputSchema: {
    project_id: z.string(),
  },
  handler: async (client, args) => client.getProject(args.project_id as string),
};

const updateProject: ToolDefinition = {
  name: "abrclick_update_project",
  description: "Update an Abrclick project",
  inputSchema: {
    project_id: z.string(),
    name: z.string().optional(),
    description: z.string().optional(),
  },
  handler: async (client, args) => {
    const { project_id, ...input } = args;
    return client.updateProject(project_id as string, input);
  },
};

const deleteProject: ToolDefinition = {
  name: "abrclick_delete_project",
  description: "Delete an Abrclick project (DESTRUCTIVE — removes the project and its resources)",
  inputSchema: {
    project_id: z.string(),
  },
  handler: async (client, args) => {
    await client.deleteProject(args.project_id as string);
    return { success: true };
  },
};

// Project members / invites / activity
const listMembers: ToolDefinition = {
  name: "abrclick_list_members",
  description: "List members of an Abrclick project (with their roles)",
  inputSchema: {
    project_id: z.string(),
  },
  handler: async (client, args) => {
    const members = await client.getMembers(args.project_id as string);
    return { members };
  },
};

const inviteMember: ToolDefinition = {
  name: "abrclick_invite_member",
  description: "Invite a user to an Abrclick project by email with a role",
  inputSchema: {
    project_id: z.string(),
    email: z.string(),
    role: z.enum(["admin", "developer", "viewer"]),
  },
  handler: async (client, args) =>
    client.inviteMember(args.project_id as string, {
      email: args.email as string,
      role: args.role as "admin" | "developer" | "viewer",
    }),
};

const removeMember: ToolDefinition = {
  name: "abrclick_remove_member",
  description: "Remove a member from an Abrclick project",
  inputSchema: {
    project_id: z.string(),
    user_id: z.string(),
  },
  handler: async (client, args) => {
    await client.removeMember(args.project_id as string, args.user_id as string);
    return { success: true };
  },
};

const updateMemberRole: ToolDefinition = {
  name: "abrclick_update_member_role",
  description: "Change a project member's role",
  inputSchema: {
    project_id: z.string(),
    user_id: z.string(),
    role: z.enum(["admin", "developer", "viewer"]),
  },
  handler: async (client, args) =>
    client.updateMemberRole(
      args.project_id as string,
      args.user_id as string,
      args.role as "admin" | "developer" | "viewer",
    ),
};

const listInvites: ToolDefinition = {
  name: "abrclick_list_invites",
  description: "List pending member invites for an Abrclick project",
  inputSchema: {
    project_id: z.string(),
  },
  handler: async (client, args) => {
    const invites = await client.getInvites(args.project_id as string);
    return { invites };
  },
};

const cancelInvite: ToolDefinition = {
  name: "abrclick_cancel_invite",
  description: "Cancel a pending project invite by its token",
  inputSchema: {
    token: z.string(),
  },
  handler: async (client, args) => {
    await client.cancelInvite(args.token as string);
    return { success: true };
  },
};

const getActivity: ToolDefinition = {
  name: "abrclick_get_activity",
  description: "Get the recent activity/audit log for an Abrclick project",
  inputSchema: {
    project_id: z.string(),
  },
  handler: async (client, args) => {
    const activity = await client.getActivity(args.project_id as string);
    return { activity };
  },
};

// Apps
const listApps: ToolDefinition = {
  name: "abrclick_list_apps",
  description: "List Abrclick apps (optionally filtered by project)",
  inputSchema: {
    project_id: z.string().optional(),
    page: z.number().optional(),
    limit: z.number().optional(),
  },
  handler: async (client, args) => {
    if (args.project_id) {
      return client.getApps(args.project_id as string, args.page as number, args.limit as number);
    }
    return client.getAllApps(args.page as number, args.limit as number);
  },
};

const createApp: ToolDefinition = {
  name: "abrclick_create_app",
  description: "Create a new Abrclick app",
  inputSchema: {
    project_id: z.string(),
    name: z.string(),
    runtime: z.string(),
    port: z.number().optional(),
    cpu_limit: z.string().optional(),
    memory_limit: z.string().optional(),
    root_dir: z.string().optional(),
  },
  handler: async (client, args) => {
    const { project_id, ...input } = args as {
      project_id: string;
      name: string;
      runtime: string;
      port?: number;
      cpu_limit?: string;
      memory_limit?: string;
      root_dir?: string;
    };
    return client.createApp(project_id, input);
  },
};

const getApp: ToolDefinition = {
  name: "abrclick_get_app",
  description: "Get Abrclick app details by ID",
  inputSchema: {
    app_id: z.string(),
  },
  handler: async (client, args) => client.getApp(args.app_id as string),
};

const updateApp: ToolDefinition = {
  name: "abrclick_update_app",
  description: "Update an Abrclick app configuration",
  inputSchema: {
    app_id: z.string(),
    cpu_limit: z.string().optional(),
    memory_limit: z.string().optional(),
    replicas: z.number().optional(),
    git_repo_url: z.string().optional(),
    git_branch: z.string().optional(),
    git_auto_deploy: z.boolean().optional(),
    port: z.number().optional(),
    autoscale_enabled: z.boolean().optional(),
    autoscale_min: z.number().optional(),
    autoscale_max: z.number().optional(),
    health_check_path: z.string().nullable().optional(),
    root_dir: z.string().nullable().optional(),
  },
  handler: async (client, args) => {
    const { app_id, ...input } = args;
    return client.updateApp(app_id as string, input);
  },
};

const deleteApp: ToolDefinition = {
  name: "abrclick_delete_app",
  description: "Delete an Abrclick app",
  inputSchema: {
    app_id: z.string(),
  },
  handler: async (client, args) => {
    await client.deleteApp(args.app_id as string);
    return { success: true };
  },
};

const startApp: ToolDefinition = {
  name: "abrclick_start_app",
  description: "Start an Abrclick app",
  inputSchema: {
    app_id: z.string(),
  },
  handler: async (client, args) => {
    await client.startApp(args.app_id as string);
    return { success: true };
  },
};

const stopApp: ToolDefinition = {
  name: "abrclick_stop_app",
  description: "Stop an Abrclick app",
  inputSchema: {
    app_id: z.string(),
  },
  handler: async (client, args) => {
    await client.stopApp(args.app_id as string);
    return { success: true };
  },
};

const restartApp: ToolDefinition = {
  name: "abrclick_restart_app",
  description: "Restart an Abrclick app",
  inputSchema: {
    app_id: z.string(),
  },
  handler: async (client, args) => {
    await client.restartApp(args.app_id as string);
    return { success: true };
  },
};

const deployApp: ToolDefinition = {
  name: "abrclick_deploy_app",
  description:
    "Deploy an Abrclick app. source_type 'git' builds from the app's configured repo (optionally pin git_commit_sha); 'image' deploys a prebuilt image (image_tag); 'upload' deploys a source tarball previously uploaded via abrclick_get_source_upload_url (source_key). NOTE: uploading the tarball bytes is a file transfer this tool can't perform — the human must run `abrclick deploy` locally for tarball uploads.",
  inputSchema: {
    app_id: z.string(),
    source_type: z.enum(["git", "image", "upload"]),
    image_tag: z.string().optional(),
    git_commit_sha: z.string().optional(),
    source_key: z.string().optional(),
  },
  handler: async (client, args) => {
    const { app_id, ...input } = args as {
      app_id: string;
      source_type: "git" | "image" | "upload";
      image_tag?: string;
      git_commit_sha?: string;
      source_key?: string;
    };
    return client.deployApp(app_id, input);
  },
};

const getSourceUploadUrl: ToolDefinition = {
  name: "abrclick_get_source_upload_url",
  description:
    "Get a presigned URL to upload an app source tarball (returns source_key + upload URL). The actual byte upload must be done by the human via `abrclick deploy`; this only mints the URL.",
  inputSchema: {
    app_id: z.string(),
  },
  handler: async (client, args) => client.getSourceUploadUrl(args.app_id as string),
};

const getSourceDownloadUrl: ToolDefinition = {
  name: "abrclick_get_source_download_url",
  description: "Get a presigned URL to download the current source tarball of an Abrclick app",
  inputSchema: {
    app_id: z.string(),
  },
  handler: async (client, args) => client.getSourceDownloadUrl(args.app_id as string),
};

// Environments (staging/development clones) + promote
const listEnvironments: ToolDefinition = {
  name: "abrclick_list_environments",
  description: "List an Abrclick app's environment slots (production/staging/development)",
  inputSchema: {
    app_id: z.string(),
  },
  handler: async (client, args) => {
    const environments = await client.listEnvironments(args.app_id as string);
    return { environments };
  },
};

const createEnvironment: ToolDefinition = {
  name: "abrclick_create_environment",
  description: "Create a staging or development environment clone for an Abrclick app",
  inputSchema: {
    app_id: z.string(),
    environment: z.enum(["staging", "development"]),
  },
  handler: async (client, args) =>
    client.createEnvironment(args.app_id as string, args.environment as "staging" | "development"),
};

const promoteApp: ToolDefinition = {
  name: "abrclick_promote_app",
  description:
    "Promote an Abrclick app's build to another environment without rebuilding. Promoting TO production requires confirm_production: true.",
  inputSchema: {
    app_id: z.string(),
    to: z.enum(["production", "staging", "development"]),
    confirm_production: z.boolean().optional(),
  },
  handler: async (client, args) =>
    client.promoteApp(
      args.app_id as string,
      args.to as "production" | "staging" | "development",
      args.confirm_production as boolean | undefined,
    ),
};

const redeployApp: ToolDefinition = {
  name: "abrclick_redeploy_app",
  description: "Redeploy an Abrclick app with the last deployment configuration",
  inputSchema: {
    app_id: z.string(),
  },
  handler: async (client, args) => client.redeployApp(args.app_id as string),
};

const listDeployments: ToolDefinition = {
  name: "abrclick_list_deployments",
  description: "List Abrclick app deployment history",
  inputSchema: {
    app_id: z.string(),
    page: z.number().optional(),
    limit: z.number().optional(),
  },
  handler: async (client, args) => {
    return client.getDeployments(args.app_id as string, args.page as number, args.limit as number);
  },
};

const rollbackDeployment: ToolDefinition = {
  name: "abrclick_rollback_deployment",
  description: "Rollback an Abrclick app to a previous deployment",
  inputSchema: {
    app_id: z.string(),
    deploy_id: z.string(),
  },
  handler: async (client, args) => {
    return client.rollbackDeployment(args.app_id as string, args.deploy_id as string);
  },
};

const retryDeployment: ToolDefinition = {
  name: "abrclick_retry_deployment",
  description: "Retry a failed Abrclick deployment",
  inputSchema: {
    app_id: z.string(),
    deploy_id: z.string(),
  },
  handler: async (client, args) => {
    return client.retryDeployment(args.app_id as string, args.deploy_id as string);
  },
};

const getBuildLogs: ToolDefinition = {
  name: "abrclick_get_build_logs",
  description: "Get Abrclick app build logs for a deployment",
  inputSchema: {
    app_id: z.string(),
    deploy_id: z.string(),
    cursor: z.number().optional(),
  },
  handler: async (client, args) => {
    return client.getBuildLogs(args.app_id as string, args.deploy_id as string, args.cursor as number);
  },
};

const getRuntimeLogs: ToolDefinition = {
  name: "abrclick_get_runtime_logs",
  description: "Get Abrclick app runtime logs",
  inputSchema: {
    app_id: z.string(),
    lines: z.number().optional(),
  },
  handler: async (client, args) => {
    const lines = await client.getRuntimeLogs(args.app_id as string, args.lines as number);
    return { lines };
  },
};

// Env
const getEnv: ToolDefinition = {
  name: "abrclick_get_env",
  description: "Get Abrclick app environment variables",
  inputSchema: {
    app_id: z.string(),
    reveal: z.boolean().optional(),
  },
  handler: async (client, args) => {
    const vars = await client.getEnv(args.app_id as string, args.reveal as boolean);
    return { vars };
  },
};

const setEnv: ToolDefinition = {
  name: "abrclick_set_env",
  description: "Set Abrclick app environment variables",
  inputSchema: {
    app_id: z.string(),
    vars: z.array(z.object({
      key: z.string(),
      value: z.string().optional(),
      is_secret: z.boolean().optional(),
      is_build_time: z.boolean().optional(),
    })),
  },
  handler: async (client, args) => {
    await client.setEnv(args.app_id as string, args.vars as Array<{
      key: string;
      value?: string;
      is_secret?: boolean;
      is_build_time?: boolean;
    }>);
    return { success: true };
  },
};

const deleteEnvVar: ToolDefinition = {
  name: "abrclick_delete_env_var",
  description: "Delete an Abrclick app environment variable",
  inputSchema: {
    app_id: z.string(),
    key: z.string(),
  },
  handler: async (client, args) => {
    await client.deleteEnvVar(args.app_id as string, args.key as string);
    return { success: true };
  },
};

// DB links
const getAppLinks: ToolDefinition = {
  name: "abrclick_get_app_links",
  description: "Get Abrclick app database links",
  inputSchema: {
    app_id: z.string(),
  },
  handler: async (client, args) => {
    const links = await client.getLinks(args.app_id as string);
    return { links };
  },
};

const linkDb: ToolDefinition = {
  name: "abrclick_link_db",
  description: "Link an Abrclick database to an app",
  inputSchema: {
    app_id: z.string(),
    database_id: z.string(),
    env_prefix: z.string().optional(),
  },
  handler: async (client, args) => {
    return client.linkDb(args.app_id as string, args.database_id as string, args.env_prefix as string);
  },
};

const unlinkDb: ToolDefinition = {
  name: "abrclick_unlink_db",
  description: "Unlink an Abrclick database from an app",
  inputSchema: {
    app_id: z.string(),
    link_id: z.string(),
  },
  handler: async (client, args) => {
    await client.unlinkDb(args.app_id as string, args.link_id as string);
    return { success: true };
  },
};

// Domains
const listDomains: ToolDefinition = {
  name: "abrclick_list_domains",
  description: "List Abrclick app custom domains",
  inputSchema: {
    app_id: z.string(),
  },
  handler: async (client, args) => {
    const domains = await client.getDomains(args.app_id as string);
    return { domains };
  },
};

const addDomain: ToolDefinition = {
  name: "abrclick_add_domain",
  description: "Add a custom domain to an Abrclick app",
  inputSchema: {
    app_id: z.string(),
    domain: z.string(),
  },
  handler: async (client, args) => {
    return client.addDomain(args.app_id as string, args.domain as string);
  },
};

const verifyDomain: ToolDefinition = {
  name: "abrclick_verify_domain",
  description: "Verify a custom domain for an Abrclick app",
  inputSchema: {
    app_id: z.string(),
    domain_id: z.string(),
  },
  handler: async (client, args) => {
    return client.verifyDomain(args.app_id as string, args.domain_id as string);
  },
};

const removeDomain: ToolDefinition = {
  name: "abrclick_remove_domain",
  description: "Remove a custom domain from an Abrclick app",
  inputSchema: {
    app_id: z.string(),
    domain_id: z.string(),
  },
  handler: async (client, args) => {
    await client.removeDomain(args.app_id as string, args.domain_id as string);
    return { success: true };
  },
};

const uploadCert: ToolDefinition = {
  name: "abrclick_upload_cert",
  description:
    "Upload a custom TLS certificate (PEM cert + private key) for a domain, instead of using auto-issued Let's Encrypt. Treat the key as a secret.",
  inputSchema: {
    app_id: z.string(),
    domain_id: z.string(),
    cert: z.string(),
    key: z.string(),
  },
  handler: async (client, args) =>
    client.uploadCert(
      args.app_id as string,
      args.domain_id as string,
      args.cert as string,
      args.key as string,
    ),
};

// GitHub app (repo access for git deploys — NOT sign-in)
const getGithubInstallUrl: ToolDefinition = {
  name: "abrclick_get_github_install_url",
  description:
    "Get the URL to install/authorize the Abrclick GitHub app (grants repo access for git deploys). The human opens it in a browser.",
  inputSchema: {},
  handler: async (client) => client.getGithubInstallUrl(),
};

const listGithubRepos: ToolDefinition = {
  name: "abrclick_list_github_repos",
  description: "List GitHub repositories the Abrclick GitHub app can access (for git deploys)",
  inputSchema: {},
  handler: async (client) => client.listGithubRepos(),
};

const githubDisconnect: ToolDefinition = {
  name: "abrclick_github_disconnect",
  description: "Disconnect the Abrclick GitHub app integration",
  inputSchema: {},
  handler: async (client) => {
    await client.githubDisconnect();
    return { success: true };
  },
};

// Databases
const listDatabases: ToolDefinition = {
  name: "abrclick_list_databases",
  description: "List Abrclick databases (optionally filtered by project)",
  inputSchema: {
    project_id: z.string().optional(),
    page: z.number().optional(),
    limit: z.number().optional(),
  },
  handler: async (client, args) => {
    if (args.project_id) {
      return client.getDatabases(args.project_id as string, args.page as number, args.limit as number);
    }
    return client.getAllDatabases(args.page as number, args.limit as number);
  },
};

const getDatabaseVersions: ToolDefinition = {
  name: "abrclick_get_database_versions",
  description: "Get available Abrclick database engine versions",
  inputSchema: {},
  handler: async (client) => client.getDatabaseVersions(),
};

const createDatabase: ToolDefinition = {
  name: "abrclick_create_database",
  description: "Create a new Abrclick database",
  inputSchema: {
    project_id: z.string(),
    name: z.string(),
    type: z.enum(["postgres", "redis", "mongo", "mysql", "mariadb", "valkey", "memcached", "rabbitmq", "kafka"]),
    version: z.string(),
    storage_gb: z.number(),
    cpu_limit: z.string().optional(),
    memory_limit: z.string().optional(),
    replica_set: z.boolean().optional(),
  },
  handler: async (client, args) => {
    const { project_id, ...input } = args as {
      project_id: string;
      name: string;
      type: "postgres" | "redis" | "mongo" | "mysql" | "mariadb" | "valkey" | "memcached" | "rabbitmq" | "kafka";
      version: string;
      storage_gb: number;
      cpu_limit?: string;
      memory_limit?: string;
      replica_set?: boolean;
    };
    return client.createDatabase(project_id, input);
  },
};

const getDatabase: ToolDefinition = {
  name: "abrclick_get_database",
  description: "Get Abrclick database details by ID",
  inputSchema: {
    db_id: z.string(),
  },
  handler: async (client, args) => client.getDatabase(args.db_id as string),
};

const updateDatabase: ToolDefinition = {
  name: "abrclick_update_database",
  description: "Update an Abrclick database configuration",
  inputSchema: {
    db_id: z.string(),
    storage_gb: z.number().optional(),
    cpu_limit: z.string().optional(),
    memory_limit: z.string().optional(),
  },
  handler: async (client, args) => {
    const { db_id, ...input } = args;
    return client.updateDatabase(db_id as string, input);
  },
};

const getDatabaseCredentials: ToolDefinition = {
  name: "abrclick_get_database_credentials",
  description: "Get Abrclick database connection credentials",
  inputSchema: {
    db_id: z.string(),
  },
  handler: async (client, args) => client.getDatabaseCredentials(args.db_id as string),
};

const deleteDatabase: ToolDefinition = {
  name: "abrclick_delete_database",
  description: "Delete an Abrclick database",
  inputSchema: {
    db_id: z.string(),
  },
  handler: async (client, args) => {
    await client.deleteDatabase(args.db_id as string);
    return { success: true };
  },
};

const enableDbPublicAccess: ToolDefinition = {
  name: "abrclick_enable_db_public_access",
  description: "Enable public internet access for an Abrclick database",
  inputSchema: {
    db_id: z.string(),
  },
  handler: async (client, args) => client.enablePublicAccess(args.db_id as string),
};

const disableDbPublicAccess: ToolDefinition = {
  name: "abrclick_disable_db_public_access",
  description: "Disable public internet access for an Abrclick database",
  inputSchema: {
    db_id: z.string(),
  },
  handler: async (client, args) => {
    await client.disablePublicAccess(args.db_id as string);
    return { success: true };
  },
};

const getDatabaseLogs: ToolDefinition = {
  name: "abrclick_get_database_logs",
  description: "Get Abrclick database logs",
  inputSchema: {
    db_id: z.string(),
    cursor: z.number().optional(),
  },
  handler: async (client, args) => {
    return client.getDatabaseLogs(args.db_id as string, args.cursor as number);
  },
};

// Backups
const listBackups: ToolDefinition = {
  name: "abrclick_list_backups",
  description: "List Abrclick database backups",
  inputSchema: {
    db_id: z.string(),
  },
  handler: async (client, args) => {
    const backups = await client.getBackups(args.db_id as string);
    return { backups };
  },
};

const createBackup: ToolDefinition = {
  name: "abrclick_create_backup",
  description: "Create an Abrclick database backup",
  inputSchema: {
    db_id: z.string(),
  },
  handler: async (client, args) => client.createBackup(args.db_id as string),
};

const restoreBackup: ToolDefinition = {
  name: "abrclick_restore_backup",
  description: "Restore an Abrclick database from a backup",
  inputSchema: {
    db_id: z.string(),
    backup_id: z.string(),
  },
  handler: async (client, args) => {
    return client.restoreBackup(args.db_id as string, args.backup_id as string);
  },
};

const setBackupSchedule: ToolDefinition = {
  name: "abrclick_set_backup_schedule",
  description:
    "Set or clear an Abrclick database's automatic backup schedule. schedule is a cron expression (e.g. '0 3 * * *'), or null to disable.",
  inputSchema: {
    db_id: z.string(),
    schedule: z.string().nullable(),
  },
  handler: async (client, args) => {
    return client.setBackupSchedule(args.db_id as string, args.schedule as string | null);
  },
};

const cloneBackup: ToolDefinition = {
  name: "abrclick_clone_backup",
  description:
    "Clone a backup into a brand-new database (non-destructive — the original is untouched). Useful to spin up a copy for testing.",
  inputSchema: {
    db_id: z.string(),
    backup_id: z.string(),
    name: z.string(),
    cpu_limit: z.string().optional(),
    memory_limit: z.string().optional(),
    storage_gb: z.number().optional(),
  },
  handler: async (client, args) => {
    const { db_id, backup_id, ...input } = args as {
      db_id: string;
      backup_id: string;
      name: string;
      cpu_limit?: string;
      memory_limit?: string;
      storage_gb?: number;
    };
    return client.cloneBackup(db_id, backup_id, input);
  },
};

const deleteBackup: ToolDefinition = {
  name: "abrclick_delete_backup",
  description: "Delete an Abrclick database backup (DESTRUCTIVE — the snapshot is gone)",
  inputSchema: {
    db_id: z.string(),
    backup_id: z.string(),
  },
  handler: async (client, args) => {
    await client.deleteBackup(args.db_id as string, args.backup_id as string);
    return { success: true };
  },
};

// DNS
const listDnsZones: ToolDefinition = {
  name: "abrclick_list_dns_zones",
  description: "List Abrclick DNS zones",
  inputSchema: {},
  handler: async (client) => {
    const zones = await client.getDnsZones();
    return { zones };
  },
};

const createDnsZone: ToolDefinition = {
  name: "abrclick_create_dns_zone",
  description: "Create an Abrclick DNS zone for a domain (returns nameservers to set at the registrar)",
  inputSchema: {
    name: z.string(),
  },
  handler: async (client, args) => client.createDnsZone(args.name as string),
};

const verifyDnsZone: ToolDefinition = {
  name: "abrclick_verify_dns_zone",
  description: "Verify an Abrclick DNS zone's nameserver delegation is live",
  inputSchema: {
    zone_id: z.string(),
  },
  handler: async (client, args) => client.verifyDnsZone(args.zone_id as string),
};

const deleteDnsZone: ToolDefinition = {
  name: "abrclick_delete_dns_zone",
  description: "Delete an Abrclick DNS zone and all its records (DESTRUCTIVE)",
  inputSchema: {
    zone_id: z.string(),
  },
  handler: async (client, args) => {
    await client.deleteDnsZone(args.zone_id as string);
    return { success: true };
  },
};

const listDnsRecords: ToolDefinition = {
  name: "abrclick_list_dns_records",
  description: "List Abrclick DNS records for a zone",
  inputSchema: {
    zone_id: z.string(),
  },
  handler: async (client, args) => {
    const records = await client.getDnsRecords(args.zone_id as string);
    return { records };
  },
};

const upsertDnsRecord: ToolDefinition = {
  name: "abrclick_upsert_dns_record",
  description: "Create or update an Abrclick DNS record",
  inputSchema: {
    zone_id: z.string(),
    name: z.string(),
    type: z.enum(["A", "AAAA", "CNAME", "TXT", "MX", "NS", "CAA", "SRV"]),
    ttl: z.number().optional(),
    records: z.array(z.string()),
  },
  handler: async (client, args) => {
    const { zone_id, ...input } = args as {
      zone_id: string;
      name: string;
      type: "A" | "AAAA" | "CNAME" | "TXT" | "MX" | "NS" | "CAA" | "SRV";
      ttl?: number;
      records: string[];
    };
    return client.upsertDnsRecord(zone_id, input);
  },
};

const deleteDnsRecord: ToolDefinition = {
  name: "abrclick_delete_dns_record",
  description: "Delete an Abrclick DNS record",
  inputSchema: {
    zone_id: z.string(),
    name: z.string(),
    type: z.enum(["A", "AAAA", "CNAME", "TXT", "MX", "NS", "CAA", "SRV"]),
  },
  handler: async (client, args) => {
    const { zone_id, ...input } = args as {
      zone_id: string;
      name: string;
      type: "A" | "AAAA" | "CNAME" | "TXT" | "MX" | "NS" | "CAA" | "SRV";
    };
    await client.deleteDnsRecord(zone_id, input);
    return { success: true };
  },
};

// Templates
const listTemplates: ToolDefinition = {
  name: "abrclick_list_templates",
  description: "List Abrclick one-click app templates (WordPress, n8n, Ghost, etc.)",
  inputSchema: {},
  handler: async (client) => {
    const templates = await client.getTemplates();
    return { templates };
  },
};

const getTemplate: ToolDefinition = {
  name: "abrclick_get_template",
  description: "Get an Abrclick one-click template's details and required variables by slug",
  inputSchema: {
    slug: z.string(),
  },
  handler: async (client, args) => client.getTemplate(args.slug as string),
};

const deployTemplate: ToolDefinition = {
  name: "abrclick_deploy_template",
  description: "Deploy an Abrclick one-click app template",
  inputSchema: {
    slug: z.string(),
    project_id: z.string(),
    app_name: z.string(),
    app_cpu: z.string().optional(),
    app_memory: z.string().optional(),
    db_cpu: z.string().optional(),
    db_memory: z.string().optional(),
    variables: z.record(z.string()).optional(),
  },
  handler: async (client, args) => {
    const { slug, ...input } = args as {
      slug: string;
      project_id: string;
      app_name: string;
      app_cpu?: string;
      app_memory?: string;
      db_cpu?: string;
      db_memory?: string;
      variables?: Record<string, string>;
    };
    return client.deployTemplate(slug, input);
  },
};

const getTemplateDeployment: ToolDefinition = {
  name: "abrclick_get_template_deployment",
  description: "Get Abrclick template deployment status by ID",
  inputSchema: {
    id: z.string(),
  },
  handler: async (client, args) => client.getTemplateDeployment(args.id as string),
};

// Metrics
const getAppMetrics: ToolDefinition = {
  name: "abrclick_get_app_metrics",
  description: "Get Abrclick app resource metrics",
  inputSchema: {
    app_id: z.string(),
    range: z.string().optional(),
  },
  handler: async (client, args) => {
    return client.getAppMetrics(args.app_id as string, args.range as string);
  },
};

const getDatabaseMetrics: ToolDefinition = {
  name: "abrclick_get_database_metrics",
  description: "Get Abrclick database resource metrics",
  inputSchema: {
    db_id: z.string(),
    range: z.string().optional(),
  },
  handler: async (client, args) => {
    return client.getDatabaseMetrics(args.db_id as string, args.range as string);
  },
};

// Resource sizing tiers
const getTiers: ToolDefinition = {
  name: "abrclick_get_tiers",
  description:
    "Get the available resource sizing tiers (CPU/memory presets) for apps or databases. Use before create/update to pick valid cpu_limit/memory_limit values.",
  inputSchema: {
    type: z.enum(["app", "database"]),
  },
  handler: async (client, args) => client.getTiers(args.type as "app" | "database"),
};

// Billing (READ-ONLY — plan changes, add-on purchases, and wallet top-ups are intentionally
// NOT exposed to AI tools; send the human to the dashboard for those).
const getUsage: ToolDefinition = {
  name: "abrclick_get_usage",
  description: "Get Abrclick resource usage (optionally for a project)",
  inputSchema: {
    project_id: z.string().optional(),
  },
  handler: async (client, args) => client.getUsage(args.project_id as string),
};

const getPlans: ToolDefinition = {
  name: "abrclick_get_plans",
  description: "Get available Abrclick billing plans (planet tiers) and their prices in Toman",
  inputSchema: {},
  handler: async (client) => client.getPlans(),
};

const getInvoices: ToolDefinition = {
  name: "abrclick_get_invoices",
  description: "List Abrclick invoices (read-only)",
  inputSchema: {
    page: z.number().optional(),
    limit: z.number().optional(),
  },
  handler: async (client, args) => client.getInvoices(args.page as number, args.limit as number),
};

const getAddons: ToolDefinition = {
  name: "abrclick_get_addons",
  description: "List the Abrclick add-ons available for purchase (read-only)",
  inputSchema: {},
  handler: async (client) => client.getAddons(),
};

const getMyAddons: ToolDefinition = {
  name: "abrclick_get_my_addons",
  description: "List the add-ons the current account has purchased (read-only)",
  inputSchema: {
    page: z.number().optional(),
    limit: z.number().optional(),
  },
  handler: async (client, args) => client.getMyAddons(args.page as number, args.limit as number),
};

const getWallet: ToolDefinition = {
  name: "abrclick_get_wallet",
  description: "Get Abrclick wallet balance and information (read-only)",
  inputSchema: {},
  handler: async (client) => client.getWallet(),
};

const getWalletTransactions: ToolDefinition = {
  name: "abrclick_get_wallet_transactions",
  description: "List Abrclick wallet transactions (read-only)",
  inputSchema: {
    limit: z.number().optional(),
    offset: z.number().optional(),
  },
  handler: async (client, args) =>
    client.getWalletTransactions(args.limit as number, args.offset as number),
};

const getAgentUsage: ToolDefinition = {
  name: "abrclick_get_agent_usage",
  description: "Get metered AI-agent token usage for the account (read-only). period: day|week|month.",
  inputSchema: {
    period: z.string().optional(),
  },
  handler: async (client, args) => client.getAgentUsage(args.period as string),
};

// Alert rules (auto-alerts on CPU/memory/disk/connection thresholds)
const listAlertRules: ToolDefinition = {
  name: "abrclick_list_alert_rules",
  description: "List Abrclick alert rules for apps and databases",
  inputSchema: {},
  handler: async (client) => {
    const rules = await client.getAlertRules();
    return { rules };
  },
};

const createAlertRule: ToolDefinition = {
  name: "abrclick_create_alert_rule",
  description:
    "Create an alert rule that notifies you when a metric crosses a threshold (e.g. CPU > 80% for 5 minutes).",
  inputSchema: {
    resource_id: z.string(),
    resource_type: z.enum(["app", "database"]),
    metric: z.enum(["cpu", "memory", "disk", "connections"]),
    operator: z.enum(["gt", "lt", "gte", "lte"]),
    threshold: z.number(),
    duration_minutes: z.number().optional(),
    notify_via: z.enum(["sms", "email", "both"]).optional(),
  },
  handler: async (client, args) =>
    client.createAlertRule({
      resourceId: args.resource_id as string,
      resourceType: args.resource_type as "app" | "database",
      metric: args.metric as "cpu" | "memory" | "disk" | "connections",
      operator: args.operator as "gt" | "lt" | "gte" | "lte",
      threshold: args.threshold as number,
      durationMinutes: args.duration_minutes as number | undefined,
      notifyVia: args.notify_via as "sms" | "email" | "both" | undefined,
    }),
};

const toggleAlertRule: ToolDefinition = {
  name: "abrclick_toggle_alert_rule",
  description: "Enable or disable an Abrclick alert rule",
  inputSchema: {
    rule_id: z.string(),
    enabled: z.boolean(),
  },
  handler: async (client, args) =>
    client.toggleAlertRule(args.rule_id as string, args.enabled as boolean),
};

const deleteAlertRule: ToolDefinition = {
  name: "abrclick_delete_alert_rule",
  description: "Delete an Abrclick alert rule",
  inputSchema: {
    rule_id: z.string(),
  },
  handler: async (client, args) => {
    await client.deleteAlertRule(args.rule_id as string);
    return { success: true };
  },
};

// Notifications
const getNotifications: ToolDefinition = {
  name: "abrclick_get_notifications",
  description: "Get Abrclick notifications (optionally unread only)",
  inputSchema: {
    unread_only: z.boolean().optional(),
  },
  handler: async (client, args) => {
    const notifications = await client.getNotifications(args.unread_only as boolean);
    return { notifications };
  },
};

const getUnreadCount: ToolDefinition = {
  name: "abrclick_get_unread_count",
  description: "Get the number of unread Abrclick notifications",
  inputSchema: {},
  handler: async (client) => {
    const count = await client.getUnreadCount();
    return { count };
  },
};

const markNotificationRead: ToolDefinition = {
  name: "abrclick_mark_notification_read",
  description: "Mark a single Abrclick notification as read",
  inputSchema: {
    id: z.string(),
  },
  handler: async (client, args) => client.markNotificationRead(args.id as string),
};

const markAllNotificationsRead: ToolDefinition = {
  name: "abrclick_mark_all_notifications_read",
  description: "Mark all Abrclick notifications as read",
  inputSchema: {},
  handler: async (client) => {
    await client.markAllNotificationsRead();
    return { success: true };
  },
};

// Tasks (per-project kanban)
const listTasks: ToolDefinition = {
  name: "abrclick_list_tasks",
  description: "List the kanban tasks of an Abrclick project",
  inputSchema: {
    project_id: z.string(),
  },
  handler: async (client, args) => {
    const tasks = await client.getTasks(args.project_id as string);
    return { tasks };
  },
};

const createTask: ToolDefinition = {
  name: "abrclick_create_task",
  description: "Create a kanban task in an Abrclick project",
  inputSchema: {
    project_id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    app_id: z.string().optional(),
    status: z.enum(["backlog", "todo", "doing", "review", "done"]).optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    due_date: z.string().optional(),
    labels: z.array(z.string()).optional(),
    assignee_id: z.string().optional(),
  },
  handler: async (client, args) =>
    client.createTask(args.project_id as string, {
      title: args.title as string,
      description: args.description as string | undefined,
      appId: args.app_id as string | undefined,
      status: args.status as "backlog" | "todo" | "doing" | "review" | "done" | undefined,
      priority: args.priority as "low" | "medium" | "high" | undefined,
      dueDate: args.due_date as string | undefined,
      labels: args.labels as string[] | undefined,
      assigneeId: args.assignee_id as string | undefined,
    }),
};

const updateTask: ToolDefinition = {
  name: "abrclick_update_task",
  description: "Update a kanban task (title, status, priority, etc.)",
  inputSchema: {
    task_id: z.string(),
    title: z.string().optional(),
    description: z.string().nullable().optional(),
    status: z.enum(["backlog", "todo", "doing", "review", "done"]).optional(),
    position: z.number().optional(),
    app_id: z.string().nullable().optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    due_date: z.string().nullable().optional(),
    labels: z.array(z.string()).optional(),
    assignee_id: z.string().nullable().optional(),
  },
  handler: async (client, args) =>
    client.updateTask(args.task_id as string, {
      title: args.title as string | undefined,
      description: args.description as string | null | undefined,
      status: args.status as "backlog" | "todo" | "doing" | "review" | "done" | undefined,
      position: args.position as number | undefined,
      appId: args.app_id as string | null | undefined,
      priority: args.priority as "low" | "medium" | "high" | undefined,
      dueDate: args.due_date as string | null | undefined,
      labels: args.labels as string[] | undefined,
      assigneeId: args.assignee_id as string | null | undefined,
    }),
};

const deleteTask: ToolDefinition = {
  name: "abrclick_delete_task",
  description: "Delete a kanban task from an Abrclick project",
  inputSchema: {
    task_id: z.string(),
  },
  handler: async (client, args) => {
    await client.deleteTask(args.task_id as string);
    return { success: true };
  },
};

export const tools: ToolDefinition[] = [
  // Identity / regions
  whoami,
  listRegions,
  // Projects
  listProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  // Members / invites / activity
  listMembers,
  inviteMember,
  removeMember,
  updateMemberRole,
  listInvites,
  cancelInvite,
  getActivity,
  // Apps
  listApps,
  createApp,
  getApp,
  updateApp,
  deleteApp,
  startApp,
  stopApp,
  restartApp,
  deployApp,
  redeployApp,
  getSourceUploadUrl,
  getSourceDownloadUrl,
  // Environments / promote
  listEnvironments,
  createEnvironment,
  promoteApp,
  // Deployments
  listDeployments,
  rollbackDeployment,
  retryDeployment,
  getBuildLogs,
  getRuntimeLogs,
  // Env vars
  getEnv,
  setEnv,
  deleteEnvVar,
  // App ↔ DB links
  getAppLinks,
  linkDb,
  unlinkDb,
  // Domains
  listDomains,
  addDomain,
  verifyDomain,
  removeDomain,
  uploadCert,
  // GitHub
  getGithubInstallUrl,
  listGithubRepos,
  githubDisconnect,
  // Databases
  listDatabases,
  getDatabaseVersions,
  createDatabase,
  getDatabase,
  updateDatabase,
  getDatabaseCredentials,
  deleteDatabase,
  enableDbPublicAccess,
  disableDbPublicAccess,
  getDatabaseLogs,
  // Backups
  listBackups,
  createBackup,
  restoreBackup,
  cloneBackup,
  setBackupSchedule,
  deleteBackup,
  // DNS
  listDnsZones,
  createDnsZone,
  verifyDnsZone,
  deleteDnsZone,
  listDnsRecords,
  upsertDnsRecord,
  deleteDnsRecord,
  // Templates
  listTemplates,
  getTemplate,
  deployTemplate,
  getTemplateDeployment,
  // Metrics
  getAppMetrics,
  getDatabaseMetrics,
  // Tiers
  getTiers,
  // Billing (read-only)
  getUsage,
  getPlans,
  getInvoices,
  getAddons,
  getMyAddons,
  getWallet,
  getWalletTransactions,
  getAgentUsage,
  // Alert rules
  listAlertRules,
  createAlertRule,
  toggleAlertRule,
  deleteAlertRule,
  // Notifications
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  // Tasks
  listTasks,
  createTask,
  updateTask,
  deleteTask,
];
