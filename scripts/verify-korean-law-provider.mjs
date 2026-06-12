import { spawnSync } from "node:child_process";

const lawOc = process.env.LAW_OC;

if (!lawOc) {
  console.error("LAW_OC 환경변수가 필요합니다.");
  console.error("예: LAW_OC=<법제처_API_KEY> node scripts/verify-korean-law-provider.mjs");
  process.exit(1);
}

const checks = [
  {
    operation: "searchLaw",
    command: "search_law",
    args: ["search_law", "--query", "민법 채무불이행"],
  },
  {
    operation: "searchPrecedents",
    command: "search_precedents",
    args: ["search_precedents", "--query", "계약상 채무불이행 손해배상"],
  },
  {
    operation: "getLawArticle",
    command: "query",
    args: ["query", "민법 제390조", "--json"],
  },
];

for (const check of checks) {
  const result = spawnSync(
    "korean-law",
    check.args,
    {
      encoding: "utf8",
      env: {
        ...process.env,
        LAW_OC: lawOc,
      },
      timeout: 15_000,
      maxBuffer: 1024 * 1024,
    },
  );

  console.log(`\n== ${check.operation} ==`);

  if (result.error) {
    console.error(`실행 실패: ${result.error.message}`);
    process.exitCode = 1;
    continue;
  }

  if (result.status !== 0) {
    console.error(`종료 코드: ${result.status}`);
    console.error(result.stderr.trim());
    process.exitCode = 1;
    continue;
  }

  const stdout = result.stdout.trim();
  if (!stdout) {
    console.error("빈 응답입니다.");
    process.exitCode = 1;
    continue;
  }

  try {
    const parsed = JSON.parse(stdout);
    console.log("JSON 파싱 성공");
    if (parsed && typeof parsed === "object" && parsed.isError === true) {
      console.error("CLI가 오류 응답을 반환했습니다.");
      process.exitCode = 1;
    }
  } catch {
    console.log("JSON이 아닌 원문 응답입니다. 서비스 파서는 raw로 보관합니다.");
  }

  console.log(stdout.slice(0, 1000));
}
