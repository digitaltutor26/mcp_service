import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const harnessRoot = resolve(scriptDir, "..");
const projectRoot = resolve(harnessRoot, "..");

const [, , workflowName, ...taskParts] = process.argv;
const userTask = taskParts.join(" ");

if (!workflowName || !userTask) {
  console.error("Usage:");
  console.error('  node codex_harness/scripts/agent-runner.mjs <workflow> "<task>"');
  console.error("");
  console.error("Workflows:");
  console.error("  implement-feature");
  console.error("  fix-bug");
  console.error("  review-and-refactor");
  process.exit(1);
}

const roles = {
  architect: join(harnessRoot, ".agents/roles/architect.md"),
  implementer: join(harnessRoot, ".agents/roles/implementer.md"),
  tester: join(harnessRoot, ".agents/roles/tester.md"),
  reviewer: join(harnessRoot, ".agents/roles/reviewer.md"),
  debugger: join(harnessRoot, ".agents/roles/debugger.md"),
};

const workflows = {
  "implement-feature": ["architect", "implementer", "tester", "reviewer"],
  "fix-bug": ["tester", "debugger", "tester", "reviewer"],
  "review-and-refactor": ["reviewer", "implementer", "tester", "reviewer"],
};

const selectedRoles = workflows[workflowName];

if (!selectedRoles) {
  console.error(`Unknown workflow: ${workflowName}`);
  process.exit(1);
}

if (!existsSync(join(projectRoot, "package.json"))) {
  console.error(`Project root not found: ${projectRoot}`);
  console.error("Expected package.json one directory above codex_harness.");
  process.exit(1);
}

const reportsDir = join(harnessRoot, "reports");
mkdirSync(reportsDir, { recursive: true });

let context = `
# User Task

${userTask}

# Previous Agent Outputs

None yet.
`;

for (const roleName of selectedRoles) {
  const rolePrompt = readFileSync(roles[roleName], "utf8");

  const sandbox =
    roleName === "architect" || roleName === "reviewer"
      ? "read-only"
      : "workspace-write";

  const fullPrompt = `
${rolePrompt}

# Current Workflow

${workflowName}

# Task Context

${context}

# Role Instruction

Work as the ${roleName} agent.
Follow AGENTS.md and your role definition.

# Important

- If you are architect or reviewer, do not edit files.
- If you are implementer, tester, or debugger, edit only necessary files.
- Report exact files changed and commands run.
`;

  console.log("\n==============================");
  console.log(`Running role: ${roleName}`);
  console.log(`Sandbox: ${sandbox}`);
  console.log("==============================\n");

  const result = spawnSync(
    "codex",
    [
      "exec",
      "--sandbox",
      sandbox,
      "--color",
      "never",
      fullPrompt,
    ],
    {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      cwd: projectRoot,
    }
  );

  const stdout = result.stdout || "";
  const stderr = result.stderr || "";

  if (stderr.trim()) {
    console.error(stderr);
  }

  console.log(stdout);

  const reportPath = join(reportsDir, `${Date.now()}-${roleName}.md`);
  writeFileSync(reportPath, stdout);

  context += `

---

# Output from ${roleName}

${stdout}
`;

  if (result.status !== 0) {
    console.error(`Role ${roleName} failed with exit code ${result.status}`);
    process.exit(result.status ?? 1);
  }

  if (roleName === "reviewer" && stdout.includes("NEEDS_CHANGES")) {
    console.log("\nReviewer requested changes.");
    console.log("Recommended next command:");
    console.log(`node codex_harness/scripts/agent-runner.mjs fix-bug "${userTask}"`);
  }
}

console.log("\nWorkflow complete.");
