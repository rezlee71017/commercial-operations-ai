// Checks the LLM provider connections with small real requests. Never prints keys.
//   npm run check:llm                 both providers that have a key
//   npm run check:llm -- gemini       only Google AI Studio
//   npm run check:llm -- openrouter   only OpenRouter
import { existsSync, readFileSync } from "node:fs";
import { checkGemini, checkOpenRouter, formatReport } from "../src/core/provider-check";

if (existsSync(".env.local")) {
  for (const raw of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 1) continue;
    const name = line.slice(0, i).trim();
    const value = line.slice(i + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[name]) process.env[name] = value;
  }
}

const only = process.argv[2];
const reports = [];
if (only !== "openrouter") reports.push(await checkGemini(process.env));
if (only !== "gemini" && (only === "openrouter" || process.env.OPENROUTER_API_KEY)) reports.push(await checkOpenRouter(process.env));
for (const r of reports) console.log(formatReport(r) + "\n");
if (reports.some((r) => !r.ok)) process.exit(1);
