// Loads app/.env and app/.env.local for the command-line scripts. Real environment variables win,
// then .env.local, then .env (the same order Next.js uses). Never prints values.
import { existsSync, readFileSync } from "node:fs";

function parse(file: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!existsSync(file)) return out;
  for (const raw of readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 1) continue;
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^['"]|['"]$/g, "");
  }
  return out;
}

export function loadEnv(): void {
  const merged = { ...parse(".env"), ...parse(".env.local") };
  for (const [name, value] of Object.entries(merged)) {
    if (process.env[name] === undefined) process.env[name] = value;
  }
}
