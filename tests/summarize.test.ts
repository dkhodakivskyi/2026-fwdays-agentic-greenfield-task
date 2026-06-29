import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parsePlan } from "../src/lib/parse.js";
import { scoreChanges } from "../src/lib/score.js";
import { summarize, summarizeFinding } from "../src/lib/summarize.js";
import type { Finding } from "../src/lib/types.js";

const fixture = JSON.parse(
  readFileSync(fileURLToPath(new URL("./fixtures/plan-mixed.json", import.meta.url)), "utf8"),
);
const findings = scoreChanges(parsePlan(fixture));

describe("summarizeFinding (FR-OUT-02)", () => {
  const high = findings.find((f) => f.risk === "high") as Finding;

  it("never describes a high-risk finding as safe", () => {
    const line = summarizeFinding(high).toLowerCase();
    expect(line).not.toMatch(/\b(safe|ok|fine)\b/);
  });

  it("keeps every line within 100 characters", () => {
    for (const f of findings) {
      expect(summarizeFinding(f).length).toBeLessThanOrEqual(100);
    }
  });

  it("includes the risk level and the resource address", () => {
    const line = summarizeFinding(high);
    expect(line).toContain("HIGH");
    expect(line).toContain(high.address);
  });
});

describe("summarize report", () => {
  const report = summarize(findings);

  it("counts high-risk findings and only lists actionable ones", () => {
    expect(report.json.highRiskCount).toBe(2);
    // 3 actionable (2 stateful destroys + 1 missing tag); 2 with no policy hits.
    expect(report.json.findings).toHaveLength(3);
    expect(report.text).toContain("2 high");
  });
});
