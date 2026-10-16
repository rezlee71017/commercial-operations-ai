// Checks that the Gemini key works. It never prints the key itself.
import { existsSync, readFileSync } from "node:fs";

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

const key = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite";

if (!key) {
  console.log("RESULT: GEMINI_API_KEY is not set (not in the environment and not in app/.env.local).");
  process.exit(1);
}

console.log(`Key found: length ${key.length}, starts with "${key.slice(0, 3)}", contains whitespace: ${/\s/.test(key)}`);
console.log(`Model: ${model}`);

try {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({ contents: [{ parts: [{ text: "Say hello in one short sentence" }] }] }),
  });
  const body = await res.json().catch(() => null);
  if (res.ok) {
    const parts = body?.candidates?.[0]?.content?.parts ?? [];
    const text = parts.find((p) => typeof p.text === "string")?.text;
    console.log(`RESULT: OK (HTTP ${res.status}). Model said: ${text ?? "(no text)"}`);
  } else {
    const err = body?.error;
    console.log(`RESULT: FAILED (HTTP ${res.status}) status=${err?.status ?? "?"} reason=${err?.details?.[0]?.reason ?? "?"}`);
    console.log(`Message: ${String(err?.message ?? "").replaceAll(key, "<key>").slice(0, 300)}`);
    process.exit(1);
  }
} catch (e) {
  console.log("RESULT: network error:", e instanceof Error ? e.message : String(e));
  process.exit(1);
}
