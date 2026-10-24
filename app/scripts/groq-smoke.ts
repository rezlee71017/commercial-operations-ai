import { createGroqAgentModel } from "../src/core/groq-agent";

async function main() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");
  const model = createGroqAgentModel({
    apiKey,
    model: process.env.GROQ_MODEL,
    system: "You are a sales assistant for an electronics store. Use the tools to search products.",
  });
  const t0 = Date.now();
  const turn = await model.step({ kind: "user", text: "I need a case for my Phone Aria 128GB" });
  console.log(`${Date.now() - t0}ms`, JSON.stringify(turn, null, 1));
}
main().catch((e) => { console.error("FAILED:", e instanceof Error ? e.message : e); process.exit(1); });
