import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AbrclickClient } from "@abrclick/sdk";
import { tools } from "./tools.js";

interface AxiosError extends Error {
  response?: {
    data?: {
      error?: string;
      message?: string;
      message_fa?: string;
      status?: number;
    };
  };
  isAxiosError?: boolean;
}

export function createServer(client: AbrclickClient): McpServer {
  const server = new McpServer(
    {
      name: "abrclick-ai",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  for (const tool of tools) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.inputSchema,
      },
      async (args) => {
        try {
          const result = await tool.handler(client, args);

          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        } catch (err) {
          const error = err as AxiosError;

          let errorText: string;

          if (error.isAxiosError && error.response?.data) {
            const apiError = error.response.data;
            const parts: string[] = [];

            if (apiError.error) {
              parts.push(`Error: ${apiError.error}`);
            }
            if (apiError.message) {
              parts.push(`Message: ${apiError.message}`);
            }
            if (apiError.message_fa) {
              parts.push(`Message (Farsi): ${apiError.message_fa}`);
            }
            if (apiError.status) {
              parts.push(`Status: ${apiError.status}`);
            }

            errorText = parts.length > 0 ? parts.join("\n") : error.message;
          } else {
            errorText = error.message ?? "Unknown error";
          }

          return {
            content: [
              {
                type: "text" as const,
                text: errorText,
              },
            ],
            isError: true,
          };
        }
      }
    );
  }

  return server;
}
