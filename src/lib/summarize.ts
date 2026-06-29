import type { Finding, Risk } from "./types.js";

const LABEL: Record<Risk, string> = { high: "HIGH", medium: "MED ", low: "LOW " };
const MAX_LINE = 100;

export interface ReportJson {
  total: number;
  highRiskCount: number;
  counts: Record<Risk, number>;
  findings: Array<{
    address: string;
    type: string;
    action: Finding["action"];
    score: number;
    risk: Risk;
    rules: Array<{ id: string; detail: string }>;
  }>;
}

export interface Report {
  text: string;
  json: ReportJson;
}

/** One concise line per finding. Never calls a high-risk change "safe" (FR-OUT-02). */
export function summarizeFinding(f: Finding): string {
  const detail =
    f.rules.length > 0
      ? f.rules.map((r) => r.detail).join("; ")
      : `${f.action} (no policy rule matched)`;
  const line = `[${LABEL[f.risk]}] ${f.score} ${f.address} — ${detail}`;
  return line.length > MAX_LINE ? `${line.slice(0, MAX_LINE - 1)}…` : line;
}

/** A change worth reporting: a policy hit, or any non-low risk (e.g. unknown action). */
const isActionable = (f: Finding): boolean => f.rules.length > 0 || f.risk !== "low";

/** Build the full report. `findings` are expected pre-ranked (see scoreChanges). */
export function summarize(findings: Finding[]): Report {
  const counts: Record<Risk, number> = { high: 0, medium: 0, low: 0 };
  for (const f of findings) counts[f.risk]++;

  const actionable = findings.filter(isActionable);
  const quiet = findings.length - actionable.length;

  const header = `tf-guard — ${counts.high} high, ${counts.medium} medium, ${counts.low} low · ${findings.length} changes`;
  const lines = [header, ...actionable.map(summarizeFinding)];
  if (quiet > 0) lines.push(`${quiet} change${quiet === 1 ? "" : "s"} with no policy findings.`);

  return {
    text: lines.join("\n"),
    json: {
      total: findings.length,
      highRiskCount: counts.high,
      counts,
      findings: actionable.map((f) => ({
        address: f.address,
        type: f.type,
        action: f.action,
        score: f.score,
        risk: f.risk,
        rules: f.rules.map((r) => ({ id: r.id, detail: r.detail })),
      })),
    },
  };
}
