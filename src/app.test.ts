import { createServer, type Server } from "node:http";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createApp } from "./app.js";

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  server = createServer(createApp());
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        throw new Error("Expected server to listen on a TCP address");
      }
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
});

describe("legal MCP harness API", () => {
  it("returns health status", async () => {
    const response = await fetch(`${baseUrl}/health`);
    const body = (await response.json()) as { ok: boolean; service: string };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.service).toBe("general-legal-service-mcp-harness");
  });

  it("returns the harness definition", async () => {
    const response = await fetch(`${baseUrl}/api/harness`);
    const body = (await response.json()) as { serviceScope: string[]; audiences: string[] };

    expect(response.status).toBe(200);
    expect(body.serviceScope).toEqual(["legal_research", "contract_review", "document_drafting"]);
    expect(body.audiences).toEqual(["general_user", "business", "professional"]);
  });

  it("returns a single workflow", async () => {
    const response = await fetch(`${baseUrl}/api/workflows/contract_review`);
    const body = (await response.json()) as { id: string; steps: unknown[] };

    expect(response.status).toBe(200);
    expect(body.id).toBe("contract_review");
    expect(body.steps.length).toBeGreaterThanOrEqual(3);
  });

  it("blocks education and classroom contexts", async () => {
    const response = await fetch(`${baseUrl}/api/evaluate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt: "Help me prepare a classroom assignment about contracts." }),
    });
    const body = (await response.json()) as { allowed: boolean; reason: string };

    expect(response.status).toBe(422);
    expect(body.allowed).toBe(false);
    expect(body.reason).toBe("excluded_context");
  });

  it("routes contract prompts to contract review", async () => {
    const response = await fetch(`${baseUrl}/api/evaluate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt: "Review this supplier agreement limitation of liability clause." }),
    });
    const body = (await response.json()) as { allowed: boolean; capability: string };

    expect(response.status).toBe(200);
    expect(body.allowed).toBe(true);
    expect(body.capability).toBe("contract_review");
  });

  it("runs legal research workflow with policy fields", async () => {
    const response = await fetch(`${baseUrl}/api/legal-research`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question: "What remedies are available for unpaid freelance fees?" }),
    });
    const body = (await response.json()) as {
      allowed: boolean;
      workflow: string;
      mockResult: { issue: string; likelySources: string[] };
      authoritySearch: { provider: string; manualReviewRequired: boolean };
      policy: { informationalOnly: boolean; requiresExpertReview: boolean; prohibitsGuaranteedOutcome: boolean };
    };

    expect(response.status).toBe(200);
    expect(body.allowed).toBe(true);
    expect(body.workflow).toBe("legal_research");
    expect(body.mockResult.issue).toContain("unpaid freelance fees");
    expect(body.mockResult.likelySources.length).toBeGreaterThan(0);
    expect(body.authoritySearch.provider).toBe("mock");
    expect(body.authoritySearch.manualReviewRequired).toBe(true);
    expect(body.policy.informationalOnly).toBe(true);
    expect(body.policy.requiresExpertReview).toBe(true);
    expect(body.policy.prohibitsGuaranteedOutcome).toBe(true);
  });

  it("validates contract review input with zod", async () => {
    const response = await fetch(`${baseUrl}/api/contract-review`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contractText: "Only text without party role" }),
    });
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(body.error).toBe("invalid_request");
  });

  it("runs contract review workflow", async () => {
    const response = await fetch(`${baseUrl}/api/contract-review`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contractText: "Supplier may terminate at any time and customer remains liable for all fees.",
        partyRole: "customer",
      }),
    });
    const body = (await response.json()) as {
      allowed: boolean;
      workflow: string;
      mockResult: { riskLevel: string; detectedIssues: string[] };
      policy: { requiresExpertReview: boolean };
    };

    expect(response.status).toBe(200);
    expect(body.allowed).toBe(true);
    expect(body.workflow).toBe("contract_review");
    expect(body.mockResult.riskLevel).toBe("high");
    expect(body.mockResult.detectedIssues.length).toBeGreaterThan(0);
    expect(body.policy.requiresExpertReview).toBe(true);
  });

  it("runs document draft workflow as draft only", async () => {
    const response = await fetch(`${baseUrl}/api/document-draft`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        documentType: "demand letter",
        facts: "Client has not paid invoice 2026-001 after two reminders.",
        recipient: "client",
      }),
    });
    const body = (await response.json()) as {
      allowed: boolean;
      workflow: string;
      mockResult: { sections: string[]; placeholders: string[] };
      policy: { draftOnly: boolean };
    };

    expect(response.status).toBe(200);
    expect(body.allowed).toBe(true);
    expect(body.workflow).toBe("document_drafting");
    expect(body.mockResult.sections).toContain("requested action");
    expect(body.mockResult.placeholders.length).toBeGreaterThan(0);
    expect(body.policy.draftOnly).toBe(true);
  });

  it("blocks Korean education context in new workflow endpoints", async () => {
    const response = await fetch(`${baseUrl}/api/legal-research`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question: "수업 과제로 계약법 판례를 조사해줘." }),
    });
    const body = (await response.json()) as { allowed: boolean; reason: string };

    expect(response.status).toBe(422);
    expect(body.allowed).toBe(false);
    expect(body.reason).toBe("excluded_education_context");
  });
});
