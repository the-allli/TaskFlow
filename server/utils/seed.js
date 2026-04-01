import Role from "../db/models/Role.modal.js";
import Plan from "../db/models/Plan.modal.js";

export const seedData = async () => {
  try {
    // 1. Seed Roles
    const roleNames = ["admin", "manager", "dev"];
    const roles = await Promise.all(
      roleNames.map((name) =>
        Role.findOneAndUpdate(
          { name },
          { name },
          { upsert: true, returnDocument: "after" },
        ),
      ),
    );

    // 2. Seed Plans
    const planDefinitions = [
      {
        key: "free",
        name: "Free",
        weight: 1,
        price: 0,
        period: "/month",
        description: "For individuals getting started",
        limits: {
          maxWorkspaces: 1,
          maxMembersInAWorkspace: 3,
          maxProjectsInAWorkspace: 1,
          maxTasksInAProject: 3,
        },
      },
      {
        key: "pro",
        name: "Pro",
        weight: 2,
        price: 19,
        period: "/month",
        description: "Perfect for small teams",
        limits: {
          maxWorkspaces: 5,
          maxMembersInAWorkspace: 10,
          maxProjectsInAWorkspace: 10,
          maxTasksInAProject: 10,
        },
      },
      {
        key: "ultimate",
        name: "Ultimate",
        weight: 3,
        price: 49,
        period: "/month",
        description: "For growing teams",
        limits: {
          maxWorkspaces: -1,
          maxMembersInAWorkspace: -1,
          maxProjectsInAWorkspace: -1,
          maxTasksInAProject: -1,
        },
      },
    ];
    const plans = await Promise.all(
      planDefinitions.map((plan) =>
        Plan.findOneAndUpdate({ name: plan.name }, plan, {
          upsert: true,
          returnDocument: "after",
        }),
      ),
    );
  } catch (error) {
    console.error("Seeding error:", error.message);
  }
};
