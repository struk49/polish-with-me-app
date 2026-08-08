import { ReplitConnectors } from "@replit/connectors-sdk";

async function main() {
  const connectors = new ReplitConnectors();
  const response = await connectors.proxy("revenuecat", "/v2/projects?limit=5", { method: "GET" });
  console.log("Status:", response.status);
  const text = await response.text();
  console.log("Body:", text.slice(0, 800));
}

main().catch(console.error);
