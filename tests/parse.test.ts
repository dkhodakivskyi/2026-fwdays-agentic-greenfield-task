import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parsePlan } from "../src/lib/parse.js";

const fixture = JSON.parse(
  readFileSync(fileURLToPath(new URL("./fixtures/plan-mixed.json", import.meta.url)), "utf8"),
);

describe("parsePlan (FR-PARSE-01)", () => {
  const changes = parsePlan(fixture);

  it("extracts every resource change", () => {
    expect(changes).toHaveLength(5);
    expect(changes.map((c) => c.address)).toContain("aws_db_instance.main");
  });

  it("normalizes ['delete','create'] into a replace action", () => {
    const bucket = changes.find((c) => c.address === "aws_s3_bucket.assets");
    expect(bucket?.action).toBe("replace");
  });

  it("reads tags from `before` for deletes and `after` otherwise", () => {
    const del = changes.find((c) => c.address === "aws_db_instance.main");
    expect(del?.tags).toEqual({ owner: "team-data", environment: "prod" });
    const create = changes.find((c) => c.address === "aws_instance.worker");
    expect(create?.tags).toEqual({ environment: "staging" });
  });

  it("treats a missing resource_changes as an empty plan", () => {
    expect(parsePlan({})).toEqual([]);
  });
});

describe("parsePlan (FR-PARSE-02)", () => {
  it("throws a clear error on malformed input", () => {
    expect(() => parsePlan({ resource_changes: [{ address: "a" }] })).toThrow(/plan/i);
    expect(() => parsePlan("nope")).toThrow(/plan/i);
  });
});
