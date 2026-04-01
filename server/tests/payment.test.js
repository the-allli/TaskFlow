import request from "supertest";
import { jest } from "@jest/globals";
import app from "../app.js";
import User from "../db/models/User.modal.js";
import Role from "../db/models/Role.modal.js";
import Plan from "../db/models/Plan.modal.js";
import Subscription from "../db/models/Subscription.modal.js";
import PaymentHistory from "../db/models/PaymentHistory.modal.js";
import stripe from "../lib/stripe.js";

stripe.customers.create = jest.fn();
stripe.checkout.sessions.create = jest.fn();
stripe.subscriptions.update = jest.fn();
stripe.subscriptions.cancel = jest.fn();
stripe.subscriptions.retrieve = jest.fn();
stripe.webhooks.constructEvent = jest.fn();

describe("Payment API", () => {
  let adminUser, adminToken, adminRole, freePlan, proPlan;

  beforeEach(async () => {
    adminRole = await Role.findOne({ name: "admin" });
    adminUser = new User({
      name: "Admin User",
      email: "admin.payment@example.com",
      password: "password123",
      role: adminRole._id,
      is_varified: true,
    });
    await adminUser.save();
    adminToken = adminUser.generateAccessToken();

    freePlan = await Plan.findOne({ key: "free" });
    proPlan = await Plan.findOne({ key: "pro" });

    jest.clearAllMocks();
  });

  it("should get all plans", async () => {
    const response = await request(app)
      .get("/api/payment/plans")
      .set("Cookie", [`jwt_access_token=${adminToken}`]);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it("should get subscription for a user", async () => {
    const subscription = new Subscription({
      adminId: adminUser._id,
      planId: freePlan._id,
      status: "active",
    });
    await subscription.save();

    const response = await request(app)
      .get(`/api/payment/${adminUser._id}/subscription`)
      .set("Cookie", [`jwt_access_token=${adminToken}`]);

    expect(response.status).toBe(200);
    expect(response.body.data.adminId.toString()).toBe(
      adminUser._id.toString(),
    );
  });

  it("should get payment history for a user", async () => {
    const history = new PaymentHistory({
      adminId: adminUser._id,
      planId: proPlan._id,
      amount: 2000,
      status: "paid",
      invoiceDate: new Date(),
    });
    await history.save();

    const response = await request(app)
      .get(`/api/payment/${adminUser._id}/history`)
      .set("Cookie", [`jwt_access_token=${adminToken}`]);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0].amount).toBe(2000);
  });

  it("should create a checkout session", async () => {
    stripe.customers.create.mockResolvedValue({ id: "cus_123" });
    stripe.checkout.sessions.create.mockResolvedValue({
      url: "https://stripe.com/checkout/123",
    });

    const response = await request(app)
      .post("/api/payment/checkout")
      .set("Cookie", [`jwt_access_token=${adminToken}`])
      .send({ plan: "pro" });

    expect(response.status).toBe(200);
    expect(response.body.data.url).toBe("https://stripe.com/checkout/123");

    const subscription = await Subscription.findOne({ adminId: adminUser._id });
    expect(subscription.stripeCustomerId).toBe("cus_123");
    expect(subscription.status).toBe("inactive");
  });

  it("should cancel a subscription", async () => {
    const subscription = new Subscription({
      adminId: adminUser._id,
      planId: proPlan._id,
      status: "active",
      stripeSubscriptionId: "sub_123",
    });
    await subscription.save();

    stripe.subscriptions.update.mockResolvedValue({});

    const response = await request(app)
      .delete(`/api/payment/${adminUser._id}/subscription`)
      .set("Cookie", [`jwt_access_token=${adminToken}`]);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe(
      "Subscription will cancel at period end.",
    );

    const updatedSub = await Subscription.findById(subscription._id);
    expect(updatedSub.cancelAtPeriodEnd).toBe(true);
  });

  it("should downgrade to free plan", async () => {
    const subscription = new Subscription({
      adminId: adminUser._id,
      planId: proPlan._id,
      status: "active",
      stripeSubscriptionId: "sub_123",
    });
    await subscription.save();

    stripe.subscriptions.cancel.mockResolvedValue({});

    const response = await request(app)
      .delete(`/api/payment/${adminUser._id}/downgrade`)
      .set("Cookie", [`jwt_access_token=${adminToken}`]);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Successfully downgraded to Free plan.");

    const updatedSub = await Subscription.findOne({ adminId: adminUser._id });
    expect(updatedSub.planId.toString()).toBe(freePlan._id.toString());
    expect(updatedSub.stripeSubscriptionId).toBeNull();
  });

  it("should handle stripe webhook checkout.session.completed", async () => {
    const event = {
      type: "checkout.session.completed",
      data: {
        object: {
          subscription: "sub_123",
          metadata: { adminId: adminUser._id.toString(), plan: "pro" },
        },
      },
    };

    stripe.webhooks.constructEvent.mockReturnValue(event);
    stripe.subscriptions.retrieve.mockResolvedValue({
      current_period_start: 1600000000,
      current_period_end: 1600003600,
      items: { data: [{ price: { id: "price_pro" } }] },
    });

    const response = await request(app)
      .post("/api/payment/webhook")
      .set("stripe-signature", "fake_sig")
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.received).toBe(true);

    const updatedSub = await Subscription.findOne({ adminId: adminUser._id });
    expect(updatedSub.status).toBe("active");
    expect(updatedSub.stripeSubscriptionId).toBe("sub_123");
    expect(updatedSub.planId.toString()).toBe(proPlan._id.toString());
  });
});
