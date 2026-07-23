#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClient } from "./config.js";
import { createServer } from "./server.js";

async function main() {
  try {
    const client = createClient();
    const server = createServer(client);
    const transport = new StdioServerTransport();

    await server.connect(transport);
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error("Unknown error occurred");
    }
    process.exit(1);
  }
}

main();
