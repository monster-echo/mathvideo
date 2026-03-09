import { beforeEach, describe, expect, it } from "vitest";

import { apiErrorSchema } from "@/contracts/common";
import { resetRateLimitStoreForTests } from "@/lib/server/rate-limit";

import { POST as checkoutPost } from "./route";

function buildCheckoutRequest(ip = "10.0.0.3") {
  return new Request("http://localhost/api/billing/checkout", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify({
      planId: "teacher_pro",
      billingCycle: "monthly",
      source: "test",
    }),
  });
}

describe("POST /api/billing/checkout", () => {
  beforeEach(() => {
    resetRateLimitStoreForTests();
  });

  it("requires authenticated session", async () => {
    const response = await checkoutPost(buildCheckoutRequest());
    const data = apiErrorSchema.safeParse(await response.json());

    expect(response.status).toBe(401);
    expect(data.success).toBe(true);
    expect(data.success && data.data.error).toContain("登录");
  });
});
