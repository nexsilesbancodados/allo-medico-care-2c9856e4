import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["favicon.ico", "pwa-192x192.png", "pwa-512x512.png"],
      devOptions: { enabled: false },
      workbox: {
        navigateFallback: null,
        globPatterns: ["**/*.{ico,png,svg,woff2}"],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-stylesheets",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/oaixgmuocuwhsabidpei\.supabase\.co\/rest\/v1\/(medical_records|prescriptions|profiles|appointments).*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "supabase-medical-data",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/oaixgmuocuwhsabidpei\.supabase\.co\/rest\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 5 },
              networkTimeoutSeconds: 5,
            },
          },
          {
            urlPattern: /^https:\/\/oaixgmuocuwhsabidpei\.supabase\.co\/storage\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "supabase-storage",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: "AloClinica - Telemedicina",
        short_name: "AloClinica",
        description: "Plataforma completa de telemedicina com videochamadas, agendamento e receitas digitais",
        theme_color: "#1a6fc4",
        background_color: "#f8fafc",
        display: "standalone",
        display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
        orientation: "portrait-primary",
        start_url: "/?source=pwa",
        scope: "/",
        id: "/?source=pwa",
        categories: ["medical", "health"],
        lang: "pt-BR",
        dir: "ltr",
        shortcuts: [
          {
            name: "Agendar Consulta",
            short_name: "Agendar",
            url: "/paciente?source=pwa-shortcut",
            icons: [{ src: "pwa-192x192.png", sizes: "192x192" }],
          },
          {
            name: "Meu Painel",
            short_name: "Painel",
            url: "/dashboard?source=pwa-shortcut",
            icons: [{ src: "pwa-192x192.png", sizes: "192x192" }],
          },
          {
            name: "Plantão 24h",
            short_name: "Urgência",
            url: "/dashboard/schedule?urgency=true&source=pwa-shortcut",
            icons: [{ src: "pwa-192x192.png", sizes: "192x192" }],
          },
        ],
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  build: {
    target: "es2020",
    cssTarget: "safari14",
    chunkSizeWarningLimit: 600,
    minify: "esbuild",
    sourcemap: false,
    cssCodeSplit: true,
    // Only modulepreload critical-path chunks; let others load on demand
    modulePreload: {
      resolveDependencies: (_filename, deps, { hostId: _hostId, hostType }) => {
        // Only keep modulepreload for the entry HTML, not for lazy chunks
        if (hostType !== "html") return [];
        const CRITICAL_CHUNKS = ["vendor-react", "vendor-router", "vendor-query"];
        return deps.filter((dep) =>
          CRITICAL_CHUNKS.some((c) => dep.includes(c)) || !dep.includes("vendor-")
        );
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          "vendor-react": ["react", "react-dom", "react/jsx-runtime"],
          // Router
          "vendor-router": ["react-router-dom"],
          // Supabase
          "vendor-supabase": ["@supabase/supabase-js"],
          // TanStack Query
          "vendor-query": ["@tanstack/react-query"],
          // UI primitives (Radix)
          "vendor-radix": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-popover",
            "@radix-ui/react-accordion",
            "@radix-ui/react-avatar",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-label",
            "@radix-ui/react-progress",
            "@radix-ui/react-radio-group",
            "@radix-ui/react-scroll-area",
            "@radix-ui/react-separator",
            "@radix-ui/react-slider",
            "@radix-ui/react-switch",
            "@radix-ui/react-toggle",
          ],
          // Charts
          "vendor-charts": ["recharts"],
          // Animations
          "vendor-motion": ["framer-motion"],
          // GSAP (heavy)
          "vendor-gsap": ["gsap", "@gsap/react"],
          // Rich text editor (heavy)
          "vendor-tiptap": [
            "@tiptap/react",
            "@tiptap/starter-kit",
            "@tiptap/extension-highlight",
            "@tiptap/extension-placeholder",
            "@tiptap/extension-table",
            "@tiptap/extension-table-cell",
            "@tiptap/extension-table-header",
            "@tiptap/extension-table-row",
            "@tiptap/extension-text-align",
            "@tiptap/extension-typography",
            "@tiptap/extension-underline",
            "@tiptap/extension-character-count",
          ],
          // Forms
          "vendor-forms": ["react-hook-form", "@hookform/resolvers", "zod"],
          // Date utilities
          "vendor-dates": ["date-fns", "react-day-picker"],
          // PDF generation
          "vendor-pdf": ["jspdf"],
          // Medical imaging (very heavy)
          "vendor-medical": ["dwv"],
        },
      },
    },
  },
}));
