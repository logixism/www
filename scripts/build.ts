import { mkdir } from "node:fs/promises";

const output = "dist/assets";
await mkdir(output, { recursive: true });
const result = await Bun.build({
  entrypoints: ["src/client.ts"],
  outdir: output,
  target: "browser",
  format: "esm",
  minify: true,
  sourcemap: "external",
  naming: "client.[ext]",
});
if (!result.success) throw new AggregateError(result.logs, "Client build failed");
await Bun.write(`${output}/styles.css`, Bun.file("src/styles.css"));
