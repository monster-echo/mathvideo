import { NextResponse } from "next/server";

import type { AuthMeResponse } from "@/contracts/auth";
import { getSessionUser } from "@/lib/auth/session";
import { getSubscriptionByUid, isSubscriptionActive } from "@/lib/billing/subscription";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getSessionUser(request);
  if (!user) {
    const payload: AuthMeResponse = { authenticated: false, user: null, subscription: null };
    return NextResponse.json(payload);
  }

  const subscription = await getSubscriptionByUid(user.uid);
  const payload: AuthMeResponse = {
    authenticated: true,
    user,
    subscription: subscription
      ? {
          status: subscription.status,
          planId: subscription.planId,
          cycle: subscription.cycle,
          active: isSubscriptionActive(subscription.status),
        }
      : null,
  };

  return NextResponse.json(payload);
}
