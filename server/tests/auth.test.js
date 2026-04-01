import request from "supertest";
import app from "../app.js";
import User from "../db/models/User.modal.js";
import Role from "../db/models/Role.modal.js";

describe("Auth API", () => {
  it("should register a new user", async () => {
    const response = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "Password123!",
      userRole: "admin",
    });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("User registered Successfully");

    const user = await User.findOne({ email: "test@example.com" });
    expect(user).toBeTruthy();
    expect(user.name).toBe("Test User");
  });

  it("should log in an existing user", async () => {
    const adminRole = await Role.findOne({ name: "admin" });
    const user = new User({
      name: "Login Test",
      email: "login@example.com",
      password: "Password123!",
      role: adminRole._id,
      is_varified: true,
    });
    await user.save();

    const response = await request(app).post("/api/auth/log-in").send({
      email: "login@example.com",
      password: "Password123!",
    });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("User logged In Successfully");
    expect(response.body.data.email).toBe("login@example.com");
    expect(response.header["set-cookie"]).toBeDefined();
  });

  it("should fail login with wrong credentials", async () => {
    const response = await request(app).post("/api/auth/log-in").send({
      email: "wrong@example.com",
      password: "WrongPassword123!",
    });

    expect(response.status).toBe(401);
  });

  it("should verify email with a valid code", async () => {
    const adminRole = await Role.findOne({ name: "admin" });
    const user = new User({
      name: "Verify Test",
      email: "verify@example.com",
      password: "Password123!",
      role: adminRole._id,
      email_varification_token: 123456,
    });
    await user.save();

    const response = await request(app).post("/api/auth/varify-email").send({
      code: "123456",
    });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Email verified successfully");

    const updatedUser = await User.findOne({ email: "verify@example.com" });
    expect(updatedUser.is_varified).toBe(true);
    expect(updatedUser.email_varification_token).toBeNull();
  });

  it("should send a forgot password link", async () => {
    const adminRole = await Role.findOne({ name: "admin" });
    const user = new User({
      name: "Forgot Test",
      email: "forgot@example.com",
      password: "Password123!",
      role: adminRole._id,
    });
    await user.save();

    const response = await request(app).post("/api/auth/forgot-password").send({
      email: "forgot@example.com",
    });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe(
      "Password reset link sent to your email",
    );

    const updatedUser = await User.findOne({ email: "forgot@example.com" });
    expect(updatedUser.password_reset_token).toBeDefined();
  });

  it("should reset password with a valid token", async () => {
    const adminRole = await Role.findOne({ name: "admin" });
    const validToken = "a".repeat(40);
    const user = new User({
      name: "Reset Test",
      email: "reset@example.com",
      password: "OldPassword123!",
      role: adminRole._id,
      password_reset_token: validToken,
    });
    await user.save();

    const response = await request(app)
      .post(`/api/auth/reset-password/${validToken}`)
      .send({
        password: "NewPassword123!",
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Password reset successful");

    const updatedUser = await User.findOne({ email: "reset@example.com" });
    expect(updatedUser.password_reset_token).toBeNull();
    const isMatch = await updatedUser.comparePassword("NewPassword123!");
    expect(isMatch).toBe(true);
  });

  describe("Authenticated Auth Routes", () => {
    let authCookie;
    let currentUser;

    beforeEach(async () => {
      const adminRole = await Role.findOne({ name: "admin" });
      currentUser = new User({
        name: "Auth User",
        email: "auth@example.com",
        password: "Password123!",
        role: adminRole._id,
        is_varified: true,
      });
      await currentUser.save();

      const response = await request(app).post("/api/auth/log-in").send({
        email: "auth@example.com",
        password: "Password123!",
      });

      authCookie = response.header["set-cookie"];
      if (!authCookie) {
        throw new Error(
          `Login failed in beforeEach: ${JSON.stringify(response.body)}`,
        );
      }
    });

    it("should get user profile", async () => {
      const response = await request(app)
        .get("/api/auth/profile")
        .set("Cookie", authCookie);

      expect(response.status).toBe(200);
      expect(response.body.email).toBe("auth@example.com");
    });

    it("should check auth status", async () => {
      const response = await request(app)
        .get("/api/auth/check-auth")
        .set("Cookie", authCookie);

      expect(response.status).toBe(200);
      expect(response.body.auth).toBe(true);
      expect(response.body.user.email).toBe("auth@example.com");
    });

    it("should update user profile", async () => {
      const response = await request(app)
        .put("/api/auth/update-profile")
        .set("Cookie", authCookie)
        .send({
          name: "Updated Name",
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Profile updated successfully");
      expect(response.body.data.name).toBe("Updated Name");
    });

    it("should change user password", async () => {
      const response = await request(app)
        .put("/api/auth/change-password")
        .set("Cookie", authCookie)
        .send({
          currentPassword: "Password123!",
          newPassword: "NewPassword456!",
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Password changed successfully");

      const updatedUser = await User.findOne({ email: "auth@example.com" });
      const isMatch = await updatedUser.comparePassword("NewPassword456!");
      expect(isMatch).toBe(true);
    });

    it("should log out the user", async () => {
      const response = await request(app)
        .post("/api/auth/log-out")
        .set("Cookie", authCookie);

      expect(response.status).toBe(200);
      expect(response.body.user).toBeNull();
      expect(response.header["set-cookie"][0]).toContain("jwt_access_token=;");
    });
  });
});
