import { ReplitConnectors } from "@replit/connectors-sdk";
import { createClient } from "@replit/revenuecat-sdk/client";
import { createProject } from "@replit/revenuecat-sdk";

async function main() {
  const connectors = new ReplitConnectors();

  const proxiedFetch: typeof fetch = async (input, init) => {
    const url = typeof input === "string" ? input : (input as Request).url;
    const path = url.replace("https://api.revenuecat.com", "");
    // Merge headers, ensure Content-Type for POST/PATCH/PUT
    const method = (init?.method ?? "GET") as string;
    const extraHeaders: Record<string, string> =
      init?.body ? { "Content-Type": "application/json" } : {};
    const response = await connectors.proxy("revenuecat", path, {
      method,
      body: init?.body as string | undefined,
      headers: { ...extraHeaders, ...(init?.headers as Record<string, string> | undefined) },
    });
    return response as Response;
  };

  const client = createClient({ baseUrl: "https://api.revenuecat.com/v2", fetch: proxiedFetch });

  const { data, error } = await createProject({ client, body: { name: "Polish with Me Test" } });
  console.log("createProject error:", JSON.stringify(error));
  console.log("createProject data:", JSON.stringify(data, null, 2));
}

main().catch(console.error);
