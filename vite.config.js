import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In local development, /api/* is answered by the same function Netlify runs.
// Data is kept in .netlify/local-store (set VC_LOCAL_STORE to change it).
function localApi() {
  return {
    name: "alfarooj-local-api",
    configureServer(server) {
      process.env.VC_LOCAL_STORE ||= ".netlify/local-store";
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith("/api/")) return next();
        try {
          const { default: handler } = await server.ssrLoadModule("/netlify/functions/api.mjs");
          const chunks = [];
          for await (const chunk of req) chunks.push(chunk);
          const request = new Request(`http://${req.headers.host}${req.url}`, {
            method: req.method,
            headers: req.headers,
            body: ["GET", "HEAD"].includes(req.method) ? undefined : Buffer.concat(chunks),
          });
          const response = await handler(request, { deploy: { context: "dev" } });
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (error) {
          next(error);
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), localApi()],
  server: { port: 5173, strictPort: true },
});
