import { Hono } from "hono";
import { cors } from "hono/cors";
import { createLensRoutes } from "./routes/lens-routes.js";

const fixedLocalOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5175",
]);

function isPrivateIpv4(hostname: string) {
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  return /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname);
}

function allowDemoOrigin(origin: string) {
  if (fixedLocalOrigins.has(origin)) return origin;

  try {
    const url = new URL(origin);
    const isVitePort = ["5173", "5174", "5175"].includes(url.port);
    if (url.protocol === "http:" && isVitePort && isPrivateIpv4(url.hostname)) {
      return origin;
    }
  } catch {
    // Invalid Origin headers are rejected by returning null below.
  }

  return null;
}

export function createApiApp() {
  const app = new Hono();

  app.use(
    "*",
    cors({
      origin: allowDemoOrigin,
      allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
    }),
  );

  app.get("/health", (c) => c.json({ ok: true }));
  app.route("/api", createLensRoutes());

  return app;
}

export type ApiApp = ReturnType<typeof createApiApp>;
