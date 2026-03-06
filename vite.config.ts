import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => {
  // Load .env files so VITE_API_URL can override the proxy target in CI/staging.
  const env = loadEnv(mode, process.cwd(), "");
  const backendTarget = env.VITE_API_URL ?? "http://localhost:8080";

  return {
    server: {
      host: "::",
      port: 5173,
      strictPort: true,
      hmr: {
        overlay: false,
      },
      proxy: {
        // All /api/* calls are forwarded to the Spring Boot backend.
        // Because axiosInstance.baseURL is now "", axios sends relative
        // paths (e.g. /api/products) which this proxy intercepts.
        "/api": {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
          ws: true, // forward WebSocket upgrades if ever needed
          rewrite: (p) => p, // path already starts with /api — no rewrite needed
        },
      },
    },
    // Expose the backend origin to components that need it (e.g. image src).
    define: {
      __API_TARGET__: JSON.stringify(backendTarget),
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
