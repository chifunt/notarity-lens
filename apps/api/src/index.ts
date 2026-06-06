import { Hono } from "hono";
import { cors } from "hono/cors";
import { createLensRoutes } from "./routes/lens-routes.js";

export function createApiApp() {
  const app = new Hono();

  app.use(
    "*",
    cors({
      origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
      allowMethods: ["GET", "POST", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
    }),
  );

  app.get("/health", (c) => c.json({ ok: true }));
  app.route("/api", createLensRoutes());

  return app;
}

export type ApiApp = ReturnType<typeof createApiApp>;
