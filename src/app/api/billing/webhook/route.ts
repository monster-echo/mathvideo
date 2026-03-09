import { NextResponse } from "next/server";
import Stripe from "stripe";

import { mapPriceToPlan, getStripeClient, getStripeWebhookSecret } from "@/lib/billing/stripe";
import { findSubscriptionByCustomerId, upsertSubscription } from "@/lib/billing/subscription";
import { logServerEvent } from "@/lib/server/logger";

export const runtime = "nodejs";

function toIsoDate(unixSeconds: number | null | undefined): string | null {
  if (!unixSeconds) return null;
  return new Date(unixSeconds * 1000).toISOString();
}

async function resolveUidFromSubscription(
  subscription: Stripe.Subscription,
  stripe: Stripe,
): Promise<string | null> {
  const fromMetadata = subscription.metadata?.uid;
  if (fromMetadata) return fromMetadata;

  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;

  if (!customerId) return null;

  const customer = await stripe.customers.retrieve(customerId);
  if (!("deleted" in customer) && customer.metadata?.uid) {
    return customer.metadata.uid;
  }

  const existing = await findSubscriptionByCustomerId(customerId);
  return existing?.uid ?? null;
}

async function persistStripeSubscription(uid: string, subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id ?? null;
  const priceId = subscription.items.data[0]?.price?.id ?? null;
  const { planId, cycle } = mapPriceToPlan(priceId);

  const currentPeriodEnd = subscription.items.data[0]?.current_period_end ?? null;

  await upsertSubscription(uid, {
    status: subscription.status,
    planId,
    cycle,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId,
    currentPeriodEnd: toIsoDate(currentPeriodEnd),
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
  });
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  stripe: Stripe,
): Promise<void> {
  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
  if (!subscriptionId) return;

  let uid = session.client_reference_id ?? session.metadata?.uid ?? null;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price"],
  });

  if (!uid) {
    uid = await resolveUidFromSubscription(subscription, stripe);
  }

  if (!uid) {
    logServerEvent("warn", "billing_webhook_missing_uid", {
      event: "checkout.session.completed",
      sessionId: session.id,
      subscriptionId,
    });
    return;
  }

  if (!subscription.metadata?.uid) {
    try {
      await stripe.subscriptions.update(subscription.id, {
        metadata: {
          ...subscription.metadata,
          uid,
        },
      });
    } catch (error) {
      logServerEvent("warn", "billing_subscription_metadata_update_failed", {
        uid,
        subscriptionId,
        error: error instanceof Error ? error.message : "unknown_error",
      });
    }
  }

  await persistStripeSubscription(uid, subscription);
}

async function handleSubscriptionUpdatedOrDeleted(
  subscription: Stripe.Subscription,
  stripe: Stripe,
): Promise<void> {
  const uid = await resolveUidFromSubscription(subscription, stripe);

  if (!uid) {
    logServerEvent("warn", "billing_subscription_uid_not_found", {
      subscriptionId: subscription.id,
      customerId:
        typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id,
    });
    return;
  }

  await persistStripeSubscription(uid, subscription);
}

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const webhookSecret = getStripeWebhookSecret();

  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Stripe Webhook 未配置" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "缺少 Stripe 签名" }, { status: 400 });
  }

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Webhook 验签失败",
      },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, stripe);
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await handleSubscriptionUpdatedOrDeleted(event.data.object as Stripe.Subscription, stripe);
        break;
      }
      default: {
        break;
      }
    }
  } catch (error) {
    logServerEvent("error", "billing_webhook_handler_failed", {
      eventType: event.type,
      error: error instanceof Error ? error.message : "unknown_error",
    });
    return NextResponse.json({ error: "Webhook 处理失败" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
