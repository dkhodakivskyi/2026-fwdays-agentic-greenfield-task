import { describe, it, expect } from "vitest";
import { parsePlan } from "../src/lib/parse.js";
import { scoreChanges } from "../src/lib/score.js";
import { summarize } from "../src/lib/summarize.js";

function plan(changes: unknown[]) {
  return { resource_changes: changes };
}

describe("unknown actions fail safe (not silently zero)", () => {
  const changes = parsePlan(
    plan([
      {
        address: "aws_db_instance.novel",
        type: "aws_db_instance",
        name: "novel",
        change: { actions: ["forget"], before: { tags: {} }, after: null },
      },
    ]),
  );

  it("normalizes an unrecognized action to 'unknown'", () => {
    expect(changes[0]?.action).toBe("unknown");
  });

  it("scores it as risky (weight 40), never 0", () => {
    const f = scoreChanges(changes)[0];
    expect(f?.score).toBe(40);
    expect(f?.risk).not.toBe("low");
  });
});

describe("['no-op'] still normalizes to no-op", () => {
  it("does not get swept into 'unknown'", () => {
    const changes = parsePlan(
      plan([
        {
          address: "aws_x.y",
          type: "aws_x",
          name: "y",
          change: { actions: ["no-op"], before: null, after: { tags: {} } },
        },
      ]),
    );
    expect(changes[0]?.action).toBe("no-op");
  });
});

describe("elevated risk without a policy rule is still reported (no header/body contradiction)", () => {
  const findings = scoreChanges(
    parsePlan(
      plan([
        {
          address: "aws_iam_role.api",
          type: "aws_iam_role",
          name: "api",
          change: {
            actions: ["delete", "create"],
            before: { tags: { owner: "o", environment: "prod" } },
            after: { tags: { owner: "o", environment: "prod" } },
          },
        },
      ]),
    ),
  );

  it("surfaces a medium stateless replace that matches no rule", () => {
    const report = summarize(findings);
    expect(report.json.counts.medium).toBe(1);
    expect(report.json.findings).toHaveLength(1); // shown, not hidden in the quiet bucket
    expect(report.text).toContain("[MED ]");
  });
});
