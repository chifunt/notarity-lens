import { serve } from "@hono/node-server";
import { createApiApp } from "./index.js";

const port = Number(process.env.PORT ?? 8787);

serve(
  {
    fetch: createApiApp().fetch,
    port,
  },
  () => {
    console.log(`Notarity Lens API listening on http://localhost:${port}`);
  },
);
