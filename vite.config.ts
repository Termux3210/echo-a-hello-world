
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8000,
    // Add allowedHosts to permit ngrok connections
    hmr: {
      // This is needed for ngrok
      clientPort: 443,
    },
    // Allow all hosts including ngrok tunnels
    proxy: {
      // You can add specific proxy rules here if needed
    },
  },
  // Allow all hosts (including ngrok)
  preview: {
    host: "::",
    port: 8000,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
