// Lets plain Node run the app's TypeScript: extensionless imports and the "@/" alias resolve to src/.
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
const SRC = fileURLToPath(new URL("../../src/", import.meta.url));
export async function resolve(spec, ctx, next) {
  if (spec.startsWith("@/")) return resolve(pathToFileURL(SRC + spec.slice(2)).href, ctx, next);
  const rel = spec.startsWith(".") || spec.startsWith("/") || spec.startsWith("file:");
  if (rel && !/\.[cm]?[jt]sx?$/.test(spec) && ctx.parentURL?.startsWith("file:")) {
    for (const ext of [".ts", ".tsx", "/index.ts"]) {
      const u = new URL(spec + ext, ctx.parentURL);
      if (existsSync(fileURLToPath(u))) return next(u.href, ctx);
    }
  }
  return next(spec, ctx);
}
