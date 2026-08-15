import vercel from "@astrojs/vercel";
import { defineConfig } from "astro/config";

export default defineConfig({
  output: "server",
  adapter: vercel(),
  build: {
    // The site stylesheet is small and contains the complete initial layout.
    // Keeping it in the HTML prevents a separate CSS request from racing the
    // eagerly discovered profile image.
    inlineStylesheets: "always",
  },
  vite: {
    ssr: {
      // v0.4.0 contains an extensionless internal ESM import that Node cannot
      // resolve when Vercel loads the package externally. Bundling it lets
      // Vite resolve that import during the build instead.
      noExternal: ["@material/material-color-utilities"],
    },
  },
  markdown: { syntaxHighlight: false },
  security: {
    checkOrigin: true,
    csp: {
      directives: [
        "default-src 'none'",
        "connect-src 'self' wss://api.lanyard.rest",
        "font-src https://fonts.gstatic.com",
        "img-src 'self' data: https://api.lanyard.rest https://cdn.discordapp.com https://i.scdn.co",
        "base-uri 'none'",
        "form-action 'none'",
        "object-src 'none'",
      ],
      styleDirective: {
        resources: ["'self'", "https://fonts.googleapis.com"],
      },
    },
  },
});
