import { adminDb } from "@/lib/firebase/admin";
import type { BillingCycle, PaidPlanId } from "@/lib/billing/stripe";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "unpaid"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "paused"
  | "unknown";

export type SubscriptionRecord = {
  uid: string;
  status: SubscriptionStatus;
  planId: PaidPlanId | null;
  cycle: BillingCycle | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  updatedAt: string;
};

const COLLECTION_NAME = "subscriptions";

export function isSubscriptionActive(status?: string | null): boolean {
  return status === "active" || status === "trialing";
}

export async function getSubscriptionByUid(uid: string): Promise<SubscriptionRecord | null> {
  if (!adminDb) return null;

  const snapshot = await adminDb.collection(COLLECTION_NAME).doc(uid).get();
  if (!snapshot.exists) return null;

  const data = snapshot.data();
  if (!data) return null;

  return {
    uid,
    status: String(data.status ?? "unknown") as SubscriptionStatus,
    planId: (data.planId as PaidPlanId | null) ?? null,
    cycle: (data.cycle as BillingCycle | null) ?? null,
    stripeCustomerId: String(data.stripeCustomerId ?? "") || null,
    stripeSubscriptionId: String(data.stripeSubscriptionId ?? "") || null,
    stripePriceId: String(data.stripePriceId ?? "") || null,
    currentPeriodEnd: String(data.currentPeriodEnd ?? "") || null,
    cancelAtPeriodEnd: Boolean(data.cancelAtPeriodEnd),
    updatedAt: String(data.updatedAt ?? ""),
  };
}

export async function upsertSubscription(uid: string, patch: Partial<SubscriptionRecord>) {
  if (!adminDb) return;

  await adminDb
    .collection(COLLECTION_NAME)
    .doc(uid)
    .set(
      {
        uid,
        ...patch,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
}

export async function findSubscriptionByCustomerId(stripeCustomerId: string): Promise<SubscriptionRecord | null> {
  if (!adminDb) return null;

  const snapshot = await adminDb.collection(COLLECTION_NAME).where("stripeCustomerId", "==", stripeCustomerId).limit(1).get();
  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  const data = doc.data();

  return {
    uid: doc.id,
    status: String(data.status ?? "unknown") as SubscriptionStatus,
    planId: (data.planId as PaidPlanId | null) ?? null,
    cycle: (data.cycle as BillingCycle | null) ?? null,
    stripeCustomerId: String(data.stripeCustomerId ?? "") || null,
    stripeSubscriptionId: String(data.stripeSubscriptionId ?? "") || null,
    stripePriceId: String(data.stripePriceId ?? "") || null,
    currentPeriodEnd: String(data.currentPeriodEnd ?? "") || null,
    cancelAtPeriodEnd: Boolean(data.cancelAtPeriodEnd),
    updatedAt: String(data.updatedAt ?? ""),
  };
}

