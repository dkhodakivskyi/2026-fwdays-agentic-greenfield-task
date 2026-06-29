#!/usr/bin/env bash
# Narrated demo for the 1–2 min course video. Record with:
#   asciinema rec docs/demo.cast --overwrite --command "bash scripts/demo.sh"
cd "$(dirname "$0")/.."

banner() { printf "\n\033[1;32m== %s ==\033[0m\n" "$1"; sleep 1.2; }
note()   { printf "\033[0;36m%s\033[0m\n" "$1"; sleep 0.8; }

banner "tf-guard — agentic-engineering greenfield demo"
note "Keyless, offline CLI that risk-ranks a 'terraform plan -json'."
note "Built spec -> failing tests -> green -> eval -> independent review."
sleep 1

banner "1. Deterministic core, verified by TESTS (one input -> one output)"
npx vitest run 2>&1 | tail -7
sleep 1.2

banner "2. Summary surface, verified by EVALS (rubric + ratchet, no exact equality)"
npx tsx evals/run.ts
sleep 1.2

banner "3. Run it on a sample plan"
npx tsx src/cli.ts tests/fixtures/plan-mixed.json && rc=0 || rc=$?
printf "\n\033[1;33mexit code: %s\033[0m  (1 = high risk found -> gates CI, BC-EXIT-01)\n" "$rc"
sleep 1.2

banner "4. Machine-readable report (--json)"
npx tsx src/cli.ts tests/fixtures/plan-mixed.json --json | head -18
sleep 1.2

banner "Context lives in the repo, not the chat"
note "AGENTS.md - rules | docs/ - requirements+ADR | openspec/ - specs | .agents/skills - SKILL.md"
ls -1 AGENTS.md DESIGN.md docs/requirements.md \
      openspec/changes/add-risk-scoring/proposal.md \
      .agents/skills/tf-risk-rank/SKILL.md
sleep 1

banner "the agent forgets; the repo doesn't"
