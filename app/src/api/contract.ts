// The API contract the website (Figma UI) codes against. Types only: no logic lives here.
// Money is always integer cents. Customer endpoints never contain purchase cost or margin.
export type { PublicProduct } from "../core/public";
export type { OperatorProduct } from "../core/operator";
export type { StreamMessage } from "../core/stream";
export type { RunResult } from "../core/run";
export type { Evaluation, Proposal, RunEvent, Rules } from "../core/types";
export type { DecisionResult } from "../db/execute";
export type { Summary } from "../db/summary";

export type Category = { id: string; name: string };
export type RunListItem = { id: string; request: string; status: string; mode: string; createdAt: string };
export type ApiErrorBody = { error: string; code?: string };
