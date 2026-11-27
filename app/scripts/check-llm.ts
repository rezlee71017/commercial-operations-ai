// Checks the LLM provider connections with small real requests. Never prints keys.
//   npm run check:llm                 both providers that have a key
//   npm run check:llm -- gemini       only Google AI Studio
//   npm run check:llm -- openrouter   only OpenRouter
import { loadEnv } from "./load-env";
import { checkGemini, checkOpenRouter, formatReport, type CheckReport } from "../src/core/provider-check";

async function main(): Promise<void> {
  loadEnv();
  const only = process.argv[2];
  const reports: CheckReport[] = [];
  if (only !== "openrouter") reports.push(await checkGemini(process.env));
  if (only !== "gemini" && (only === "openrouter" || process.env.OPENROUTER_API_KEY)) reports.push(await checkOpenRouter(process.env));
  for (const r of reports) console.log(formatReport(r) + "\n");
  if (reports.some((r) => !r.ok)) process.exitCode = 1;
}

main().catch((e) => {
  console.error("check failed:", e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
