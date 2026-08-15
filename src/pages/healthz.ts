import type { APIRoute } from "astro";

export const GET: APIRoute = () =>
  new Response('{"ok":true}', {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
