import { AbrclickClient } from "@abrclick/sdk";

export function createClient(): AbrclickClient {
  const apiKey = process.env.ABRCLICK_API_KEY;

  if (!apiKey) {
    throw new Error(
      "ABRCLICK_API_KEY environment variable is required.\n" +
      "Create an API key with `abrclick keys create` or from the Abrclick dashboard."
    );
  }

  const client = new AbrclickClient({
    apiUrl: process.env.ABRCLICK_API_URL,
    accountUrl: process.env.ABRCLICK_ACCOUNT_URL,
    token: apiKey,
  });

  const region = process.env.ABRCLICK_REGION;
  if (region) {
    client.useRegion(region);
  }

  return client;
}
