import { ReplitConnectors } from "@replit/connectors-sdk";

async function main() {
  const connectors = new ReplitConnectors();
  
  console.log("Testing POST /v2/projects directly...");
  const response = await connectors.proxy("revenuecat", "/v2/projects", {
    method: "POST",
    body: JSON.stringify({ name: "Polish with Me" }),
    headers: { "Content-Type": "application/json" },
  });
  console.log("Status:", response.status);
  const text = await response.text();
  console.log("Body:", text.slice(0, 500));
}

main().catch(console.error);
