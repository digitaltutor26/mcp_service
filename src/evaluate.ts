import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { LEGAL_SERVICE_HARNESS, getWorkflow, isExcludedContext } from "./harness.js";
import type { EvalScenario } from "./types.js";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const EVAL_DIR = join(ROOT, "harness", "evals");

function readScenarios(): EvalScenario[] {
  const files = readdirSync(EVAL_DIR).filter((file) => file.endsWith(".json"));
  return files.flatMap((file) => {
    const parsed = JSON.parse(readFileSync(join(EVAL_DIR, file), "utf8")) as { scenarios: EvalScenario[] };
    return parsed.scenarios;
  });
}

function assertHarnessShape(): void {
  assert.deepEqual(LEGAL_SERVICE_HARNESS.serviceScope, [
    "legal_research",
    "contract_review",
    "document_drafting",
  ]);
  assert.deepEqual(LEGAL_SERVICE_HARNESS.audiences, ["general_user", "business", "professional"]);
  assert.equal(LEGAL_SERVICE_HARNESS.workflows.length, 3);
  assert.ok(LEGAL_SERVICE_HARNESS.policy.excludedContexts.includes("학교"));
  assert.ok(LEGAL_SERVICE_HARNESS.policy.excludedContexts.includes("교육기관"));

  for (const workflow of LEGAL_SERVICE_HARNESS.workflows) {
    assert.equal(workflow.audience.includes("general_user"), true);
    assert.equal(workflow.audience.includes("business"), true);
    assert.equal(workflow.audience.includes("professional"), true);
    assert.equal(workflow.steps.length >= 3, true, `${workflow.id} should have intake, lookup, output steps`);
  }
}

function assertToolCoverage(): void {
  const toolsByCapability = new Map<string, Set<string>>();
  for (const tool of LEGAL_SERVICE_HARNESS.tools) {
    for (const capability of tool.requiredFor ?? []) {
      const tools = toolsByCapability.get(capability) ?? new Set<string>();
      tools.add(tool.tool);
      toolsByCapability.set(capability, tools);
    }
  }

  assert.ok(toolsByCapability.get("legal_research")?.has("chain_full_research"));
  assert.ok(toolsByCapability.get("contract_review")?.has("chain_document_review"));
  assert.ok(toolsByCapability.get("document_drafting")?.has("chain_procedure_detail"));
}

function assertScenarios(): void {
  const scenarios = readScenarios();
  assert.equal(scenarios.length >= 6, true, "expected at least six evaluation scenarios");

  for (const scenario of scenarios) {
    const workflow = getWorkflow(scenario.expectedWorkflow);
    if (!workflow) {
      throw new Error(`${scenario.id} should resolve to a workflow`);
    }

    assert.equal(workflow.audience.includes(scenario.audience), true);
    const haystack: string = [
      workflow.title,
      ...workflow.steps.map((step) => step.instruction),
      ...workflow.steps.map((step) => step.output),
      ...workflow.completionCriteria,
    ].join(" ");

    for (const term of scenario.mustInclude) {
      assert.equal(
        haystack.toLowerCase().includes(term.toLowerCase()),
        true,
        `${scenario.id} expected workflow text to include ${term}`,
      );
    }

    for (const term of scenario.mustNotInclude) {
      assert.equal(
        scenario.prompt.toLowerCase().includes(term.toLowerCase()),
        false,
        `${scenario.id} prompt should not be an excluded education/classroom prompt`,
      );
    }
  }
}

function assertExcludedContextGuard(): void {
  assert.equal(isExcludedContext("수업 과제 평가 기준을 만들어 주세요."), true);
  assert.equal(isExcludedContext("Review this supplier agreement for indemnity risk."), false);
}

assertHarnessShape();
assertToolCoverage();
assertScenarios();
assertExcludedContextGuard();

console.log("legal MCP harness eval passed");
