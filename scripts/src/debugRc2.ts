import { ReplitConnectors } from "@replit/connectors-sdk";
import { createClient } from "@replit/revenuecat-sdk/client";
import { listProjects, createProject } from "@replit/revenuecat-sdk";

async function main() {
  const connectors = new ReplitConnectors();

  const proxiedFetch: typeof fetch = async (input, init) => {
    const url = typeof input === "string" ? input : (input as Request).url;
    const path = url.replace("https://api.revenuecat.com", "");
    const response = await connectors.proxy("revenuecat", path, {
      method: (init?.method ?? "GET") as string,
      body: init?.body as string | undefined,
      headers: init?.headers as Record<string, string> | undefined,
    });
    return response as Response;
  };

  const client = createClient({ baseUrl: "https://api.revenuecat.com/v2", fetch: proxiedFetch });

  // Test listProjects
  const { data, error } = await listProjects({ client, query: { limit: 5 } });
  console.log("listProjects error:", error);
  console.log("listProjects data:", JSON.stringify(data, null, 2));
}

main().catch(console.error);
