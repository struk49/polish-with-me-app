// RevenueCat integration via Replit Connectors proxy
import { ReplitConnectors } from "@replit/connectors-sdk";
import { createClient } from "@replit/revenuecat-sdk/client";

export async function getUncachableRevenueCatClient() {
  const connectors = new ReplitConnectors();

  const proxiedFetch: typeof fetch = async (input, init) => {
    let url: string;
    let method: string;
    let body: string | undefined;
    let headers: Record<string, string> = {};

    if (input instanceof Request) {
      // openapi-fetch passes a Request object — extract all fields from it
      url = input.url;
      method = input.method;
      const bodyText = await input.text();
      body = bodyText || undefined;
      input.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else {
      url = typeof input === "string" ? input : input.toString();
      method = init?.method ?? "GET";
      body = init?.body as string | undefined;
      if (init?.headers) {
        if (init.headers instanceof Headers) {
          init.headers.forEach((v, k) => { headers[k] = v; });
        } else {
          headers = init.headers as Record<string, string>;
        }
      }
    }

    // Ensure Content-Type for requests with a body
    if (body && !headers["content-type"] && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const path = url.replace("https://api.revenuecat.com", "");

    const response = await connectors.proxy("revenuecat", path, {
      method,
      body,
      headers,
    });

    return response as Response;
  };

  return createClient({
    baseUrl: "https://api.revenuecat.com/v2",
    fetch: proxiedFetch,
  });
}
