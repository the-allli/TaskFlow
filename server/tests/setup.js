import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { seedData } from "../utils/seed.js";

process.env.JWT_ACCESS_TOKEN_SECRET = "test_secret";
process.env.JWT_ACCESS_TOKEN_EXPIRY = "1h";
process.env.CLIENT_URL = "http://localhost:5173";
process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
process.env.STRIPE_PRO_PRICE_ID = "price_pro";
process.env.STRIPE_ULTIMATE_PRICE_ID = "price_ultimate";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
process.env.CLOUDINARY_CLOUD_NAME = "dummy";
process.env.CLOUDINARY_API_KEY = "dummy";
process.env.CLOUDINARY_API_SECRET = "dummy";
process.env.RESEND_API_KEY = "dummy";
process.env.EMAIL_FROM = "test@example.com";

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  await seedData();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    // Keep Roles and Plans after seeding, clear others
    if (key !== "roles" && key !== "plans") {
      await collection.deleteMany({});
    }
  }
});
