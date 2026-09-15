// Thin fetch wrappers around the three Packr backend services. Every call
// funnels through `request()` so a down service (connection refused, DNS
// failure, timeout) and a service-returned error (4xx/5xx JSON body) both
// surface as a typed ApiError with a message a page can render directly,
// instead of an unhandled rejection.

const CATALOG_URL = process.env.NEXT_PUBLIC_CATALOG_URL || "http://localhost:4001";
const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:4002";
const PRICING_URL = process.env.NEXT_PUBLIC_PRICING_URL || "http://localhost:4003";

export class ApiError extends Error {
  constructor(message, { status, details, serviceDown = false } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.serviceDown = serviceDown;
  }
}

async function request(baseUrl, path, { method = "GET", body, token, serviceName } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    // fetch throws (not a rejected HTTP response) when the service is
    // unreachable - connection refused, DNS failure, etc.
    throw new ApiError(`Could not reach ${serviceName}. Is it running?`, { serviceDown: true });
  }

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      // Non-JSON body (e.g. an HTML error page from a proxy) - leave data null.
    }
  }

  if (!res.ok) {
    const message = (data && data.error) || `${serviceName} returned an error (${res.status})`;
    throw new ApiError(message, { status: res.status, details: data && data.details });
  }

  return data;
}

export const catalogApi = {
  listCards({ set, rarity } = {}) {
    const params = new URLSearchParams();
    if (set) params.set("set", set);
    if (rarity) params.set("rarity", rarity);
    const qs = params.toString();
    return request(CATALOG_URL, `/cards${qs ? `?${qs}` : ""}`, { serviceName: "catalog-service" });
  },
  getCard(id) {
    return request(CATALOG_URL, `/cards/${encodeURIComponent(id)}`, { serviceName: "catalog-service" });
  },
  createCard(card) {
    return request(CATALOG_URL, "/cards", { method: "POST", body: card, serviceName: "catalog-service" });
  },
};

export const authApi = {
  signup({ email, password }) {
    return request(AUTH_URL, "/signup", {
      method: "POST",
      body: { email, password },
      serviceName: "auth-service",
    });
  },
  login({ email, password }) {
    return request(AUTH_URL, "/login", {
      method: "POST",
      body: { email, password },
      serviceName: "auth-service",
    });
  },
  me(token) {
    return request(AUTH_URL, "/me", { token, serviceName: "auth-service" });
  },
};

export const pricingApi = {
  estimate(card) {
    return request(PRICING_URL, "/estimate", {
      method: "POST",
      body: card,
      serviceName: "pricing-service",
    });
  },
};
