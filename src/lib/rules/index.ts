import type { ResourceChange, RuleHit } from "../types.js";

/** Tag keys every managed resource must carry. */
export const REQUIRED_TAGS = ["owner", "environment"] as const;

/** Substrings that mark a resource type as stateful (data loss on destroy). */
export const STATEFUL_PATTERNS = [
  "_db",
  "database",
  "_bucket",
  "_disk",
  "_volume",
  "_instance",
  "_table",
  "_filesystem",
  "_cluster",
] as const;

/** FR-TAGS-01: created/updated/replaced resources must carry the required tags. */
export function requiredTags(
  change: ResourceChange,
  required: readonly string[] = REQUIRED_TAGS,
): RuleHit | null {
  if (change.action !== "create" && change.action !== "update" && change.action !== "replace") {
    return null;
  }
  const missing = required.filter((key) => !Object.hasOwn(change.tags, key));
  if (missing.length === 0) return null;
  return {
    id: "missing-required-tags",
    weight: 20,
    detail: `missing tags: ${missing.join(", ")}`,
  };
}

/** FR-RISK-01: deleting or replacing a stateful resource is dangerous. */
export function riskyDelete(
  change: ResourceChange,
  patterns: readonly string[] = STATEFUL_PATTERNS,
): RuleHit | null {
  if (change.action !== "delete" && change.action !== "replace") return null;
  if (!patterns.some((p) => change.type.includes(p))) return null;
  return {
    id: "risky-delete",
    weight: 50,
    detail: `${change.action} of stateful resource`,
  };
}

/** All rules applied in order. */
export const RULES = [requiredTags, riskyDelete] as const;
