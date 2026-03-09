import Stripe from "stripe";

export type BillingCycle = "monthly" | "yearly";
export type PaidPlanId = "teacher_pro" | "creator_pro" | "school_team";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe | null {
  if (!stripeSecretKey) return null;
  if (stripeClient) return stripeClient;

  stripeClient = new Stripe(stripeSecretKey, {
    apiVersion: "2026-02-25.clover",
  });

  return stripeClient;
}

export function hasStripeConfig() {
  return Boolean(stripeSecretKey);
}

export function getStripeWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET ?? "";
}

type PriceMap = Record<PaidPlanId, Record<BillingCycle, string | undefined>>;

function getPriceMap(): PriceMap {
  return {
    teacher_pro: {
      monthly: process.env.STRIPE_PRICE_TEACHER_PRO_MONTHLY,
      yearly: process.env.STRIPE_PRICE_TEACHER_PRO_YEARLY,
    },
    creator_pro: {
      monthly: process.env.STRIPE_PRICE_CREATOR_PRO_MONTHLY,
      yearly: process.env.STRIPE_PRICE_CREATOR_PRO_YEARLY,
    },
    school_team: {
      monthly: process.env.STRIPE_PRICE_SCHOOL_TEAM_MONTHLY,
      yearly: process.env.STRIPE_PRICE_SCHOOL_TEAM_YEARLY,
    },
  };
}

export function getStripePriceId(planId: PaidPlanId, cycle: BillingCycle): string | null {
  return getPriceMap()[planId][cycle] ?? null;
}

export function mapPriceToPlan(priceId: string | null | undefined): {
  planId: PaidPlanId | null;
  cycle: BillingCycle | null;
} {
  if (!priceId) return { planId: null, cycle: null };

  const priceMap = getPriceMap();
  for (const [planId, cycles] of Object.entries(priceMap) as Array<[PaidPlanId, Record<BillingCycle, string | undefined>]>) {
    for (const [cycle, candidatePriceId] of Object.entries(cycles) as Array<[BillingCycle, string | undefined]>) {
      if (candidatePriceId === priceId) {
        return { planId, cycle };
      }
    }
  }

  return { planId: null, cycle: null };
}

export function getAppBaseUrl(requestUrl?: string): string {
  const fromEnv = process.env.APP_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (fromEnv) return fromEnv;

  if (requestUrl) {
    const url = new URL(requestUrl);
    return `${url.protocol}//${url.host}`;
  }

  return "http://localhost:3000";
}
