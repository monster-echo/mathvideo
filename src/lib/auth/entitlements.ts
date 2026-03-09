import { getSubscriptionByUid, isSubscriptionActive } from "@/lib/billing/subscription";

import { getSessionUser, type SessionUser } from "@/lib/auth/session";

export type RequestEntitlement = {
  user: SessionUser | null;
  subscription: Awaited<ReturnType<typeof getSubscriptionByUid>>;
  paidActive: boolean;
};

export async function getRequestEntitlement(request: Request): Promise<RequestEntitlement> {
  const user = await getSessionUser(request);
  if (!user) {
    return {
      user: null,
      subscription: null,
      paidActive: false,
    };
  }

  const subscription = await getSubscriptionByUid(user.uid);
  return {
    user,
    subscription,
    paidActive: isSubscriptionActive(subscription?.status),
  };
}

