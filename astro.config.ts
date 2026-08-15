import node from "@astrojs/node";
import { defineConfig } from "astro/config";

export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
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
