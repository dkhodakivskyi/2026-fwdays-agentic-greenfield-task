import { describe, it, expect } from "vitest";
import { requiredTags, riskyDelete } from "../src/lib/rules/index.js";
import type { ResourceChange } from "../src/lib/types.js";

const base: ResourceChange = {
  address: "aws_instance.x",
  type: "aws_instance",
  name: "x",
  action: "create",
  tags: { owner: "team", environment: "prod" },
};

describe("requiredTags (FR-TAGS-01)", () => {
  it("flags a created resource missing a required tag", () => {
    const hit = requiredTags({ ...base, tags: { environment: "prod" } });
    expect(hit?.id).toBe("missing-required-tags");
    expect(hit?.weight).toBe(20);
    expect(hit?.detail).toContain("owner");
  });

  it("passes when all required tags are present", () => {
    expect(requiredTags(base)).toBeNull();
  });

  it("does not apply to deletes (the resource is going away)", () => {
    expect(requiredTags({ ...base, action: "delete", tags: {} })).toBeNull();
  });
});

describe("riskyDelete (FR-RISK-01)", () => {
  it("flags a delete of a stateful resource", () => {
    const hit = riskyDelete({ ...base, type: "aws_db_instance", action: "delete" });
    expect(hit?.id).toBe("risky-delete");
    expect(hit?.weight).toBe(50);
  });

  it("flags a replace of a stateful resource", () => {
    const hit = riskyDelete({ ...base, type: "aws_s3_bucket", action: "replace" });
    expect(hit?.id).toBe("risky-delete");
  });

  it("ignores a create of a stateful resource type", () => {
    expect(riskyDelete({ ...base, type: "aws_db_instance", action: "create" })).toBeNull();
  });

  it("ignores a delete of a stateless resource", () => {
    expect(riskyDelete({ ...base, type: "aws_iam_role", action: "delete" })).toBeNull();
  });
});
