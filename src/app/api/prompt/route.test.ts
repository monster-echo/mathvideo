import { beforeEach, describe, expect, it } from "vitest";

import { apiErrorSchema } from "@/contracts/common";
import { promptSuccessResponseSchema } from "@/contracts/prompt";
import { resetRateLimitStoreForTests } from "@/lib/server/rate-limit";

import { POST as promptPost } from "./route";

function buildJsonRequest(body: unknown, ip = "10.0.0.1") {
  return new Request("http://localhost/api/prompt", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/prompt", () => {
  beforeEach(() => {
    resetRateLimitStoreForTests();
  });

  it("returns 400 when prompt is missing", async () => {
    const response = await promptPost(buildJsonRequest({ persona: "teacher" }));
    const data = apiErrorSchema.safeParse(await response.json());

    expect(response.status).toBe(400);
    expect(data.success).toBe(true);
  });

  it("returns success payload for valid request", async () => {
    const response = await promptPost(buildJsonRequest({ prompt: "生成一个勾股定理动画", persona: "teacher" }));
    const data = promptSuccessResponseSchema.safeParse(await response.json());

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.success && data.data.sceneSpec.title).toBeTruthy();
  });

  it("enforces rate limits", async () => {
    let lastResponse: Response | null = null;

    for (let index = 0; index < 21; index += 1) {
      lastResponse = await promptPost(
        buildJsonRequest(
          {
            prompt: `生成动画 ${index}`,
            persona: "teacher",
          },
          "10.0.0.9",
        ),
      );
    }

    expect(lastResponse).not.toBeNull();
    expect(lastResponse?.status).toBe(429);
  });
});
