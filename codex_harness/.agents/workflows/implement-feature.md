# Workflow: implement-feature

Order:
1. architect analyzes the request.
2. implementer applies the plan.
3. tester adds or runs tests.
4. reviewer checks the diff.
5. debugger fixes failures if needed.
6. reviewer gives final approval.

Rules:
- Keep changes focused.
- Do not bypass tests unless no test setup exists.
- Stop and report if the repository is unsafe.
