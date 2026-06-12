# Workflow: fix-bug

Order:
1. tester reproduces or identifies the failure.
2. debugger finds the root cause.
3. debugger applies the smallest fix.
4. tester re-runs tests.
5. reviewer checks the patch.

Rules:
- Prefer regression tests.
- Do not introduce broad refactoring during bug fixes.
