import { beforeEach, describe, expect, it } from "vitest";

import { apiErrorSchema } from "@/contracts/common";
import { createRenderSuccessResponseSchema, listRendersSuccessResponseSchema } from "@/contracts/renders";
import { resetRateLimitStoreForTests } from "@/lib/server/rate-limit";

import { GET as getRenders, POST as postRender } from "./route";

function buildJsonRequest(body: unknown, ip = "10.0.0.2") {
  return new Request("http://localhost/api/renders", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

function buildGetRequest(search = "", ip = "10.0.0.2") {
  return new Request(`http://localhost/api/renders${search}`, {
    method: "GET",
    headers: {
      "x-forwarded-for": ip,
    },
  });
}

describe("api/renders", () => {
  beforeEach(() => {
    resetRateLimitStoreForTests();
  });

  it("blocks 1080p for unauthenticated users", async () => {
    const response = await postRender(
      buildJsonRequest({
        title: "test.py",
        code: "from manim import *\nclass Demo(Scene):\n    def construct(self):\n        self.wait()",
        quality: "1080p",
      }),
    );

    const data = apiErrorSchema.safeParse(await response.json());

    expect(response.status).toBe(402);
    expect(data.success).toBe(true);
  });

  it("creates preview jobs and lists history", async () => {
    const createResponse = await postRender(
      buildJsonRequest({
        title: "test.py",
        code: "from manim import *\nclass Demo(Scene):\n    def construct(self):\n        self.wait()",
        quality: "preview",
      }),
    );
    const created = createRenderSuccessResponseSchema.safeParse(await createResponse.json());

    expect(createResponse.status).toBe(200);
    expect(created.success).toBe(true);
    const createdJobId = created.success ? created.data.job.id : "";
    expect(createdJobId).toBeTruthy();

    const historyResponse = await getRenders(buildGetRequest("?limit=5"));
    const historyData = listRendersSuccessResponseSchema.safeParse(await historyResponse.json());

    expect(historyResponse.status).toBe(200);
    expect(historyData.success).toBe(true);
    expect(historyData.success && historyData.data.items.some((item) => item.id === createdJobId)).toBe(true);
  });
});
