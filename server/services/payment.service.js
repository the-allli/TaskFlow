import stripe from "../lib/stripe.js";
import ApiError from "../utils/api_error.js";
import ApiResponse from "../utils/api_response.js";
import * as paymentRepository from "../repositories/payment.repository.js";
import * as planRepository from "../repositories/plan.repository.js";
import User from "../db/models/User.modal.js";
import Workspace from "../db/models/Workspace.modal.js";
import PaymentHistory from "../db/models/PaymentHistory.modal.js";

const PRICE_IDS = {
  free: process.env.STRIPE_FREE_PRICE_ID,
  pro: process.env.STRIPE_PRO_PRICE_ID,
  ultimate: process.env.STRIPE_ULTIMATE_PRICE_ID,
};

const PLAN_NAMES = {
  [process.env.STRIPE_PRO_PRICE_ID]: "pro",
  [process.env.STRIPE_ULTIMATE_PRICE_ID]: "ultimate",
};

const toDate = (ts) => (ts ? new Date(ts * 1000) : null);

const resolveSubscriptionId = (invoice) =>
  invoice.subscription ||
  invoice.parent?.subscription_details?.subscription ||
  invoice.lines?.data?.find(
    (l) => l.parent?.subscription_item_details?.subscription,
  )?.parent?.subscription_item_details?.subscription ||
  null;

export const getPlans = async (req, res) => {
  const plans = await planRepository.findPlans();
  return res
    .status(200)
    .json(new ApiResponse(200, plans, "Plans fetched successfully."));
};

export const getSubscription = async (req, res) => {
  const { userId } = req.params;

  const subscription =
    await paymentRepository.findSubscriptionByAdminId(userId);
  return res
    .status(200)
    .json(
      new ApiResponse(200, subscription, "Subscription fetched successfully."),
    );
};

export const getPaymentHistory = async (req, res) => {
  const { userId } = req.params;
  const history = await paymentRepository.findPaymentHistoryByAdminId(userId);
  return res
    .status(200)
    .json(
      new ApiResponse(200, history, "Payment history fetched successfully."),
    );
};

export const createCheckoutSession = async (req, res) => {
  const { plan } = req.body;
  const adminId = req.user.id.toString();

  if (!PRICE_IDS[plan]) throw new ApiError(400, "Invalid plan.");

  const planDoc = await planRepository.findPlanByName(plan);
  if (!planDoc) throw new ApiError(400, "Plan not found.");

  let subscription = await paymentRepository.findSubscriptionByAdminId(adminId);
  let customerId = subscription?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      metadata: { adminId },
    });
    customerId = customer.id;
  }

  // If user has an active Stripe subscription, handle upgrade or downgrade
  if (subscription?.stripeSubscriptionId && subscription?.status === "active") {
    // Check if this is a downgrade (target plan is cheaper than current)
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId,
    );
    const currentPriceAmount =
      stripeSubscription.items.data[0].price.unit_amount || 0;
    const targetPriceAmount = (planDoc.price || 0) * 100;

    // If downgrading, handle credit generation
    if (targetPriceAmount < currentPriceAmount) {
      console.log(`\n[DOWNGRADE] ========== PLAN DOWNGRADE ==========`);
      console.log(`[DOWNGRADE] User ${adminId}: Downgrading to ${plan}`);
      console.log(
        `[DOWNGRADE] Current price: $${currentPriceAmount / 100} (${currentPriceAmount}c)`,
      );
      console.log(
        `[DOWNGRADE] Target price: $${targetPriceAmount / 100} (${targetPriceAmount}c)`,
      );

      const subscriptionItemId = stripeSubscription.items.data[0].id;

      // Check balance before
      const customerBefore = await stripe.customers.retrieve(customerId);
      const balanceBefore = customerBefore.balance || 0;
      console.log(`[DOWNGRADE] Balance BEFORE: ${balanceBefore}c`);

      try {
        // Update subscription to lower plan - this generates a credit
        const updatedSubscription = await stripe.subscriptions.update(
          subscription.stripeSubscriptionId,
          {
            items: [{ id: subscriptionItemId, price: PRICE_IDS[plan] }],
            proration_behavior: "always_invoice",
            payment_behavior: "error_if_incomplete",
          },
        );

        // Check balance after
        const customerAfter = await stripe.customers.retrieve(customerId);
        const balanceAfter = customerAfter.balance || 0;
        const creditAdded = balanceAfter - balanceBefore;

        console.log(`[DOWNGRADE] Balance AFTER: ${balanceAfter}c`);
        console.log(
          `[DOWNGRADE] Credit added: ${Math.abs(creditAdded)}c ($${Math.abs(creditAdded) / 100})`,
        );
        console.log(`[DOWNGRADE] =================================\n`);

        // Update local subscription
        const subItem = updatedSubscription.items?.data?.[0];
        await paymentRepository.updateSubscriptionByAdminId(adminId, {
          planId: planDoc._id,
          stripePriceId: PRICE_IDS[plan],
          status: "active",
          currentPeriodStart: toDate(
            updatedSubscription.current_period_start ??
              subItem?.current_period_start ??
              null,
          ),
          currentPeriodEnd: toDate(
            updatedSubscription.current_period_end ??
              subItem?.current_period_end ??
              null,
          ),
          cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
        });

        await User.findByIdAndUpdate(adminId, { plan: planDoc._id });

        // Create payment history for the downgrade
        await paymentRepository.createPaymentHistory({
          adminId,
          stripeInvoiceId: null,
          planId: planDoc._id,
          amount: 0,
          currency: "usd",
          status: "paid",
          invoicePdfUrl: null,
          invoiceDate: new Date(),
        });

        return res.status(200).json(
          new ApiResponse(
            200,
            {
              updated: true,
              creditAdded: Math.abs(creditAdded),
              totalCredit: Math.abs(balanceAfter),
            },
            `Downgraded to ${plan}. $${Math.abs(creditAdded) / 100} credit added to your account.`,
          ),
        );
      } catch (downgradeErr) {
        console.error(`[DOWNGRADE] Error:`, downgradeErr.message);
        // Fall through to normal flow if downgrade fails
      }
    }

    // If same price or upgrade, continue with existing flow
    console.log(`\n[UPGRADE] ========== DIRECT SUBSCRIPTION UPDATE ==========`);
    console.log(
      `[UPGRADE] User ${adminId}: Attempting direct upgrade to ${plan}`,
    );

    // stripeSubscription and currentPriceAmount already retrieved above in downgrade check
    const subscriptionItemId = stripeSubscription.items.data[0].id;
    const currentPriceId = stripeSubscription.items.data[0].price.id;

    console.log(
      `[UPGRADE] Current subscription: ${subscription.stripeSubscriptionId}`,
    );
    console.log(
      `[UPGRADE] Current price: $${currentPriceAmount / 100} (${currentPriceAmount}c)`,
    );
    console.log(`[UPGRADE] Target price: ${PRICE_IDS[plan]}`);

    try {
      // Try to update with immediate payment
      const updatedSubscription = await stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        {
          items: [{ id: subscriptionItemId, price: PRICE_IDS[plan] }],
          proration_behavior: "always_invoice",
          payment_behavior: "error_if_incomplete",
        },
      );

      console.log(`[UPGRADE] SUCCESS: Subscription updated directly`);
      console.log(
        `[UPGRADE] New subscription status: ${updatedSubscription.status}`,
      );

      // Get billing period dates from item level (newer Stripe API versions)
      const subItem = updatedSubscription.items?.data?.[0];
      const periodStart =
        updatedSubscription.current_period_start ??
        subItem?.current_period_start ??
        null;
      const periodEnd =
        updatedSubscription.current_period_end ??
        subItem?.current_period_end ??
        null;

      // Update local subscription with plan AND billing period dates
      await paymentRepository.updateSubscriptionByAdminId(adminId, {
        planId: planDoc._id,
        stripePriceId: PRICE_IDS[plan],
        currentPeriodStart: toDate(periodStart),
        currentPeriodEnd: toDate(periodEnd),
        cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
      });

      await User.findByIdAndUpdate(adminId, { plan: planDoc._id });

      // Create payment history for credit upgrade (no charge) - non-blocking
      try {
        await paymentRepository.createPaymentHistory({
          adminId,
          stripeInvoiceId: null,
          planId: planDoc._id,
          amount: 0,
          currency: "usd",
          status: "paid",
          invoicePdfUrl: null,
          invoiceDate: new Date(),
        });
      } catch (historyErr) {
        // Log but don't fail the upgrade if history creation fails
        console.log(
          `[UPGRADE] Note: Payment history creation skipped: ${historyErr.message}`,
        );
      }

      console.log(`[UPGRADE] =================================\n`);

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { updated: true },
            "Plan updated with proration.",
          ),
        );
    } catch (error) {
      console.log(`[UPGRADE] Direct update failed: ${error.message}`);
      console.log(`[UPGRADE] Using Stripe prorated invoice approach...`);

      // Use Stripe's proration to create an invoice with the exact prorated amount
      try {
        console.log(
          `\n[UPGRADE] ========== STRIPE PRORATED INVOICE ==========`,
        );
        console.log(
          `[UPGRADE] User ${adminId}: Creating prorated invoice for ${plan} upgrade`,
        );

        // Step 1: Update subscription with proration to generate an invoice
        // This creates a prorated invoice with the exact amount based on time remaining
        const updatedSubscription = await stripe.subscriptions.update(
          subscription.stripeSubscriptionId,
          {
            items: [{ id: subscriptionItemId, price: PRICE_IDS[plan] }],
            proration_behavior: "always_invoice",
            payment_behavior: "allow_incomplete", // Allow incomplete to get the invoice
            expand: ["latest_invoice"],
          },
        );

        // Step 2: Get the prorated invoice that was created
        const invoice = updatedSubscription.latest_invoice;

        if (!invoice) {
          throw new Error("No invoice generated for proration");
        }

        console.log(`[UPGRADE] Prorated invoice created: ${invoice.id}`);
        console.log(
          `[UPGRADE] Invoice amount: $${invoice.amount_due / 100} (${invoice.amount_due}c)`,
        );
        console.log(`[UPGRADE] Invoice status: ${invoice.status}`);

        // Step 3: Check if there's a payment required
        if (invoice.amount_due <= 0) {
          // No payment needed - upgrade complete
          console.log(`[UPGRADE] No payment required - upgrade complete`);

          const subItem = updatedSubscription.items?.data?.[0];
          await paymentRepository.updateSubscriptionByAdminId(adminId, {
            planId: planDoc._id,
            stripePriceId: PRICE_IDS[plan],
            status: "active",
            currentPeriodStart: toDate(
              updatedSubscription.current_period_start ??
                subItem?.current_period_start ??
                null,
            ),
            currentPeriodEnd: toDate(
              updatedSubscription.current_period_end ??
                subItem?.current_period_end ??
                null,
            ),
            cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
          });

          await User.findByIdAndUpdate(adminId, { plan: planDoc._id });

          console.log(`[UPGRADE] =================================\n`);

          return res
            .status(200)
            .json(
              new ApiResponse(
                200,
                { updated: true, proratedAmount: 0 },
                "Plan upgraded successfully. No additional payment required.",
              ),
            );
        }

        // Step 4: Payment required - create checkout session with the EXACT prorated amount
        const proratedAmount = invoice.amount_due;

        console.log(`[UPGRADE] Payment required: $${proratedAmount / 100}`);
        console.log(`[UPGRADE] Creating checkout for prorated amount...`);

        // Create a checkout session for the prorated invoice amount
        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          mode: "payment",
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: `Upgrade to ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
                  description: `Prorated upgrade (Stripe calculated: $${proratedAmount / 100})`,
                },
                unit_amount: proratedAmount,
              },
              quantity: 1,
            },
          ],
          success_url: `${process.env.CLIENT_URL}/dashboard/payment?success=true`,
          cancel_url: `${process.env.CLIENT_URL}/dashboard/payment?cancelled=true`,
          metadata: {
            adminId,
            plan,
            type: "upgrade_payment",
            subscriptionId: subscription.stripeSubscriptionId,
            subscriptionItemId: subscriptionItemId,
            proratedAmount: proratedAmount.toString(),
            stripeInvoiceId: invoice.id,
          },
        });

        console.log(`[UPGRADE] Checkout created: ${session.id}`);
        console.log(`[UPGRADE] =================================\n`);

        return res
          .status(200)
          .json(
            new ApiResponse(
              200,
              { url: session.url, proratedAmount },
              `Upgrade requires $${proratedAmount / 100} (prorated). Redirecting to checkout.`,
            ),
          );
      } catch (prorationErr) {
        console.error(
          `[UPGRADE] Proration invoice failed:`,
          prorationErr.message,
        );
        console.log(`[UPGRADE] Falling back to manual calculation...`);

        // Fallback to manual calculation if Stripe proration fails
        const currentPlanPriceCents =
          stripeSubscription.items.data[0].price.unit_amount || 0;
        const newPlanPriceCents = (planDoc.price || 0) * 100;
        const invoiceAmount = Math.max(
          0,
          newPlanPriceCents - currentPlanPriceCents,
        );

        console.log(`[UPGRADE] Manual calculation: $${invoiceAmount / 100}`);

        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          mode: "payment",
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: `Upgrade to ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
                  description: `Prorated upgrade amount`,
                },
                unit_amount: invoiceAmount,
              },
              quantity: 1,
            },
          ],
          success_url: `${process.env.CLIENT_URL}/dashboard/payment?success=true`,
          cancel_url: `${process.env.CLIENT_URL}/dashboard/payment?cancelled=true`,
          metadata: {
            adminId,
            plan,
            type: "upgrade_payment",
            subscriptionId: subscription.stripeSubscriptionId,
            subscriptionItemId: subscriptionItemId,
          },
        });

        return res
          .status(200)
          .json(
            new ApiResponse(
              200,
              { url: session.url },
              "Payment authorization required. Redirecting to checkout.",
            ),
          );
      }
    }
  }

  // No active subscription - create new checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
    success_url: `${process.env.CLIENT_URL}/dashboard/payment?success=true`,
    cancel_url: `${process.env.CLIENT_URL}/dashboard/payment?cancelled=true`,
    metadata: { adminId, plan },
    subscription_data: {
      metadata: { adminId, plan },
    },
  });

  await paymentRepository.upsertSubscription(adminId, {
    adminId,
    stripeCustomerId: customerId,
    planId: planDoc._id,
    status: "inactive",
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, { url: session.url }, "Checkout session created."),
    );
};

export const cancelSubscription = async (req, res) => {
  const { userId } = req.params;

  const subscription =
    await paymentRepository.findSubscriptionByAdminId(userId);
  if (!subscription?.stripeSubscriptionId) {
    throw new ApiError(404, "No active subscription found.");
  }

  await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  await paymentRepository.updateSubscriptionByAdminId(userId, {
    cancelAtPeriodEnd: true,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, null, "Subscription will cancel at period end."),
    );
};

export const downgradeToFree = async (req, res) => {
  const { userId } = req.params;

  const freePlan = await planRepository.findPlanByName("free");
  if (!freePlan) throw new ApiError(400, "Free plan not found.");

  const subscription =
    await paymentRepository.findSubscriptionByAdminId(userId);

  // If user has an active Stripe subscription, update to $0 free plan instead of canceling
  // This preserves the billing cycle and allows credits to accumulate properly
  if (subscription?.stripeSubscriptionId && subscription?.status === "active") {
    try {
      // Log initial state
      // console.log(`[DOWNGRADE] User ${userId}: Starting downgrade to Free`);

      const stripeSubscription = await stripe.subscriptions.retrieve(
        subscription.stripeSubscriptionId,
      );

      // Check if stripeSubscription exists and has items
      // if (!stripeSubscription || !stripeSubscription.items?.data?.length) {
      //   console.warn(`[DOWNGRADE] User ${userId}: No valid subscription items found, using legacy cancel behavior`);
      //   throw new Error("Invalid subscription data");
      // }

      const subscriptionItemId = stripeSubscription.items.data[0].id;
      const currentPriceId = stripeSubscription.items.data[0].price.id;
      const currentPriceAmount =
        stripeSubscription.items.data[0].price.unit_amount;

      console.log(
        `[DOWNGRADE] Current plan price: $${currentPriceAmount / 100} (${currentPriceAmount}c)`,
      );
      console.log(`[DOWNGRADE] Target plan price: $0 (free)`);

      // Check customer balance BEFORE downgrade
      const customerBefore = await stripe.customers.retrieve(
        stripeSubscription.customer,
      );
      const balanceBefore = customerBefore.balance || 0;
      console.log(
        `[DOWNGRADE] Customer balance BEFORE: ${balanceBefore}c (${balanceBefore < 0 ? "credit" : "owed"})`,
      );

      // Update subscription to free plan with proration to generate credits
      const updatedSubscription = await stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        {
          items: [{ id: subscriptionItemId, price: PRICE_IDS.free }],
          proration_behavior: "always_invoice",
          payment_behavior: "error_if_incomplete",
        },
      );

      // Check customer balance AFTER downgrade
      const customerAfter = await stripe.customers.retrieve(
        stripeSubscription.customer,
      );
      const balanceAfter = customerAfter.balance || 0;
      const creditAdded = balanceAfter - balanceBefore;
      console.log(
        `[DOWNGRADE] Customer balance AFTER: ${balanceAfter}c (${balanceAfter < 0 ? "credit" : "owed"})`,
      );
      console.log(
        `[DOWNGRADE] Credit added from this downgrade: ${Math.abs(creditAdded)}c ($${Math.abs(creditAdded) / 100})`,
      );
      console.log(
        `[DOWNGRADE] Total available credit: ${Math.abs(balanceAfter)}c ($${Math.abs(balanceAfter) / 100})`,
      );

      // Get billing period dates
      const subItem = updatedSubscription.items?.data?.[0];
      const periodStart =
        updatedSubscription.current_period_start ??
        subItem?.current_period_start ??
        null;
      const periodEnd =
        updatedSubscription.current_period_end ??
        subItem?.current_period_end ??
        null;

      // Update local subscription - keep it active but on free plan
      await paymentRepository.updateSubscriptionByAdminId(userId, {
        planId: freePlan._id,
        stripePriceId: PRICE_IDS.free,
        status: "active",
        currentPeriodStart: toDate(periodStart),
        currentPeriodEnd: toDate(periodEnd),
        cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
      });

      await User.findByIdAndUpdate(userId, { plan: freePlan._id });

      // Create payment history for the downgrade
      await paymentRepository.createPaymentHistory({
        adminId: userId,
        stripeInvoiceId: null,
        planId: freePlan._id,
        amount: 0,
        currency: "usd",
        status: "paid",
        invoicePdfUrl: null,
        invoiceDate: new Date(),
      });

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            updated: true,
            creditAdded: Math.abs(creditAdded),
            totalCredit: Math.abs(balanceAfter),
          },
          `Successfully downgraded to Free plan. $${Math.abs(creditAdded) / 100} credit added. Total credit: $${Math.abs(balanceAfter) / 100}`,
        ),
      );
    } catch (error) {
      // console.error("[DOWNGRADE] Error:", error.message);
      // Fall through to legacy cancel behavior if update fails
    }
  }

  // Legacy: Cancel subscription if update fails or no active subscription
  if (subscription?.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
    } catch (error) {
      console.error("Stripe Cancellation Error:", error.message);
    }
  }

  await User.findByIdAndUpdate(userId, { plan: freePlan._id });

  await paymentRepository.upsertSubscription(userId, {
    adminId: userId,
    planId: freePlan._id,
    status: "inactive",
    stripeSubscriptionId: null,
    stripePriceId: null,
    cancelAtPeriodEnd: false,
    currentPeriodStart: null,
    currentPeriodEnd: null,
  });

  await paymentRepository.createPaymentHistory({
    adminId: userId,
    stripeInvoiceId: null,
    planId: freePlan._id,
    amount: 0,
    currency: "usd",
    status: "paid",
    invoicePdfUrl: null,
    invoiceDate: new Date(),
  });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Successfully downgraded to Free plan."));
};

export const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const { adminId, plan, type, subscriptionId, subscriptionItemId } =
          session.metadata;

        if (!adminId) break;

        const planDoc = await planRepository.findPlanByName(plan);
        if (!planDoc) break;

        // Handle upgrade payment (mode: "payment")
        if (
          type === "upgrade_payment" &&
          subscriptionId &&
          subscriptionItemId
        ) {
          // Payment for upgrade succeeded, now update the subscription
          try {
            console.log(
              `[WEBHOOK] Upgrade payment succeeded for user ${adminId}`,
            );
            console.log(
              `[WEBHOOK] Updating Stripe subscription ${subscriptionId} to plan ${plan}`,
            );

            // IMPORTANT: Update the Stripe subscription price to the new plan
            // This ensures downgrade detection works correctly
            try {
              const updatedStripeSub = await stripe.subscriptions.update(
                subscriptionId,
                {
                  items: [{ id: subscriptionItemId, price: PRICE_IDS[plan] }],
                  proration_behavior: "none", // Already paid via checkout
                },
              );
              console.log(
                `[WEBHOOK] Stripe subscription updated: ${updatedStripeSub.id}`,
              );
            } catch (stripeUpdateErr) {
              console.error(
                `[WEBHOOK] Failed to update Stripe subscription:`,
                stripeUpdateErr.message,
              );
              // Continue with local DB update even if Stripe update fails
            }

            // Update local subscription
            await paymentRepository.updateSubscriptionByAdminId(adminId, {
              planId: planDoc._id,
              stripePriceId: PRICE_IDS[plan],
              status: "active",
            });

            await User.findByIdAndUpdate(adminId, { plan: planDoc._id });

            // Create payment history record with the actual amount paid
            const amountPaid = session.amount_total
              ? Math.round(session.amount_total)
              : 0;

            // Get receipt URL from the PaymentIntent
            // According to Stripe docs, we need to get the Charge from latest_charge field
            let receiptUrl = null;
            try {
              if (session.payment_intent) {
                // First get the PaymentIntent to find the latest_charge
                const paymentIntent = await stripe.paymentIntents.retrieve(
                  session.payment_intent,
                );

                console.log(
                  `PaymentIntent status: ${paymentIntent.status}, latest_charge: ${paymentIntent.latest_charge}`,
                );

                // If we have a latest_charge, retrieve the Charge to get receipt_url
                if (paymentIntent.latest_charge) {
                  const charge = await stripe.charges.retrieve(
                    paymentIntent.latest_charge,
                  );
                  receiptUrl = charge.receipt_url || null;
                  console.log(
                    `Charge retrieved: ${charge.id}, receipt: ${receiptUrl}`,
                  );
                }

                // Fallback: use payment intent ID to construct dashboard link
                if (!receiptUrl) {
                  receiptUrl = `https://dashboard.stripe.com/test/payments/${session.payment_intent}`;
                }
              }
            } catch (receiptErr) {
              console.error(
                "Failed to retrieve receipt URL:",
                receiptErr.message,
              );
            }

            await paymentRepository.createPaymentHistory({
              adminId,
              stripeInvoiceId: session.payment_intent,
              planId: planDoc._id,
              amount: amountPaid,
              currency: session.currency || "usd",
              status: "paid",
              invoicePdfUrl: receiptUrl,
              invoiceDate: new Date(),
            });

            console.log(
              `Upgrade payment recorded: ${amountPaid}c for ${plan}, receipt: ${receiptUrl}`,
            );
          } catch (err) {
            console.error(
              "Failed to update subscription after upgrade payment:",
              err.message,
            );
          }
          break;
        }

        // Handle new subscription (mode: "subscription")
        if (!session.subscription) break;

        const sub = await stripe.subscriptions.retrieve(session.subscription, {
          expand: ["items.data.price"],
        });

        await User.findByIdAndUpdate(adminId, { plan: planDoc._id });

        const checkoutSubItem = sub.items?.data?.[0];
        await paymentRepository.upsertSubscription(adminId, {
          stripeSubscriptionId: session.subscription,
          stripePriceId:
            checkoutSubItem?.price?.id || sub.items.data[0].price.id,
          planId: planDoc._id,
          status: "active",
          currentPeriodStart: toDate(
            sub.current_period_start ??
              checkoutSubItem?.current_period_start ??
              sub.billing_cycle_anchor ??
              null,
          ),
          currentPeriodEnd: toDate(
            sub.current_period_end ??
              checkoutSubItem?.current_period_end ??
              null,
          ),
          cancelAtPeriodEnd: false,
        });
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const subscriptionId = resolveSubscriptionId(invoice);

        const existingSub = subscriptionId
          ? await paymentRepository.findSubscriptionByStripeId(subscriptionId)
          : await paymentRepository.findSubscriptionByCustomerId(
              invoice.customer,
            );

        if (!existingSub) break;

        const adminId = existingSub.adminId.toString();

        let planKey =
          existingSub.planId?.key ||
          existingSub.planId?.name?.toLowerCase() ||
          "free";
        let periodStart = null;
        let periodEnd = null;

        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId, {
            expand: ["items.data.price"],
          });
          const invoiceSubItem = sub.items?.data?.[0];
          planKey =
            PLAN_NAMES[
              invoiceSubItem?.price?.id || sub.items.data[0].price.id
            ] || planKey;
          periodStart = toDate(
            sub.current_period_start ??
              invoiceSubItem?.current_period_start ??
              sub.billing_cycle_anchor ??
              null,
          );
          periodEnd = toDate(
            sub.current_period_end ??
              invoiceSubItem?.current_period_end ??
              null,
          );
        }

        const planDoc = await planRepository.findPlanByName(planKey);
        if (planDoc) {
          await User.findByIdAndUpdate(adminId, { plan: planDoc._id });
        }

        const updatedSub = await paymentRepository.updateSubscriptionByAdminId(
          adminId,
          {
            status: "active",
            ...(planDoc && { planId: planDoc._id }),
            ...(periodStart && { currentPeriodStart: periodStart }),
            ...(periodEnd && { currentPeriodEnd: periodEnd }),
          },
        );

        const subId = updatedSub?._id || existingSub._id;

        await Workspace.updateMany(
          { ownerId: adminId, subscriptionId: { $ne: subId } },
          { $set: { subscriptionId: subId } },
        );

        // Skip proration invoices from subscription updates (upgrades/downgrades)
        // These are handled by the respective API endpoints, not the webhook
        if (invoice.billing_reason === "subscription_update") {
          console.log(`[WEBHOOK] Skipping proration invoice: ${invoice.id}`);
          console.log(`[WEBHOOK] Reason: subscription_update (handled by API)`);
          break;
        }

        // Skip if a payment history record already exists for this invoice
        const existingHistory = await PaymentHistory.findOne({
          stripeInvoiceId: invoice.id,
        });
        if (!existingHistory) {
          await paymentRepository.createPaymentHistory({
            adminId,
            stripeInvoiceId: invoice.id,
            planId: planDoc?._id || existingSub.planId,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            status: "paid",
            invoicePdfUrl: invoice.invoice_pdf ?? null,
            invoiceDate: new Date(invoice.created * 1000),
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const subscriptionId = resolveSubscriptionId(invoice);

        // Skip proration invoices that are being handled via checkout
        // These invoices are created during upgrade but paid via checkout session
        if (
          invoice.billing_reason === "subscription_update" &&
          invoice.amount_due > 0
        ) {
          console.log(
            `[WEBHOOK] Skipping proration invoice failure: ${invoice.id}`,
          );
          console.log(
            `[WEBHOOK] This invoice will be paid via checkout session`,
          );
          break;
        }

        const existingSub = subscriptionId
          ? await paymentRepository.findSubscriptionByStripeId(subscriptionId)
          : await paymentRepository.findSubscriptionByCustomerId(
              invoice.customer,
            );

        if (!existingSub) break;

        const adminId = existingSub.adminId.toString();
        let planName = existingSub.planId?.name || "free";

        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId, {
            expand: ["items.data.price"],
          });
          planName = PLAN_NAMES[sub.items.data[0].price.id] || planName;
        }

        const planDoc = await planRepository.findPlanByName(planName);

        await paymentRepository.createPaymentHistory({
          adminId,
          stripeInvoiceId: invoice.id,
          planId: planDoc?._id || existingSub.planId,
          amount: invoice.amount_due,
          currency: invoice.currency,
          status: "failed",
          invoicePdfUrl: invoice.invoice_pdf ?? null,
          invoiceDate: new Date(invoice.created * 1000),
        });

        await paymentRepository.updateSubscriptionByAdminId(adminId, {
          status: "past_due",
        });
        break;
      }

      case "customer.subscription.deleted": {
        const stripeSub = event.data.object;
        const existingSub = await paymentRepository.findSubscriptionByStripeId(
          stripeSub.id,
        );

        const freePlan = await planRepository.findPlanByName("free");

        if (existingSub) {
          await User.findByIdAndUpdate(existingSub.adminId, {
            plan: freePlan?._id || null,
          });
        }

        await paymentRepository.updateSubscriptionByStripeId(stripeSub.id, {
          status: "inactive",
          planId: freePlan?._id || null,
          cancelAtPeriodEnd: false,
          stripeSubscriptionId: null,
          stripePriceId: null,
          currentPeriodStart: null,
          currentPeriodEnd: null,
        });
        break;
      }

      case "customer.subscription.updated": {
        const stripeSub = event.data.object;
        const existingSub = await paymentRepository.findSubscriptionByStripeId(
          stripeSub.id,
        );
        if (!existingSub) break;

        const sub = await stripe.subscriptions.retrieve(stripeSub.id, {
          expand: ["items.data.price"],
        });
        const newPlanName = PLAN_NAMES[sub.items.data[0].price.id];
        let planId = existingSub.planId;

        if (newPlanName) {
          const planDoc = await planRepository.findPlanByName(newPlanName);
          if (
            planDoc &&
            planDoc._id.toString() !== existingSub.planId?.toString()
          ) {
            planId = planDoc._id;
            await User.findByIdAndUpdate(existingSub.adminId, { plan: planId });
          }
        }

        const webhookSubItem = sub.items?.data?.[0];
        await paymentRepository.updateSubscriptionByStripeId(stripeSub.id, {
          planId,
          status: stripeSub.status === "active" ? "active" : stripeSub.status,
          cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
          currentPeriodStart: toDate(
            stripeSub.current_period_start ??
              webhookSubItem?.current_period_start ??
              stripeSub.start_date ??
              null,
          ),
          currentPeriodEnd: toDate(
            stripeSub.current_period_end ??
              webhookSubItem?.current_period_end ??
              null,
          ),
        });
        break;
      }

      default:
        break;
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error.message, error.stack);
    res.status(500).json({ message: error.message });
  }
};
