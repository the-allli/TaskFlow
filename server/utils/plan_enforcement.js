import * as planRepository from "../repositories/plan.repository.js";
import * as paymentRepository from "../repositories/payment.repository.js";

export const getPlanLimitsForAdmin = async (adminId) => {
  const subscription = await paymentRepository.findSubscriptionByAdminId(adminId);

  if (subscription?.status === "active" && subscription.planId) {
    return {
      plan: subscription.planId.name,
      planKey: subscription.planId.key,
      limits: subscription.planId.limits,
    };
  }

  const freePlan = await planRepository.findPlanByName("free");
  if (!freePlan) {
    return {
      plan: "Free",
      planKey: "free",
      limits: {
        maxWorkspaces: 1,
        maxMembersInAWorkspace: 3,
        maxProjectsInAWorkspace: 1,
        maxTasksInAProject: 3,
      },
    };
  }
  return {
    plan: freePlan.name,
    planKey: freePlan.key,
    limits: freePlan.limits,
  };
};

const isUnlimited = (limit) => limit === -1;

const sortByCreatedAt = (items) => {
  return [...items].sort((a, b) => {
    const dateA = new Date(a.createdAt || 0);
    const dateB = new Date(b.createdAt || 0);
    return dateA - dateB;
  });
};

export const createPlanMetadata = (visible, total, limit) => ({
  visible,
  total,
  limit,
  capped: !isUnlimited(limit) && total > limit,
});

export const filterWorkspacesByPlan = (workspaces, limits) => {
  const maxWorkspaces = limits.maxWorkspaces;

  if (isUnlimited(maxWorkspaces)) {
    return {
      filteredItems: workspaces,
      metadata: createPlanMetadata(workspaces.length, workspaces.length, maxWorkspaces),
    };
  }

  const sorted = sortByCreatedAt(workspaces);
  const filtered = sorted.slice(0, maxWorkspaces);

  return {
    filteredItems: filtered,
    metadata: createPlanMetadata(filtered.length, workspaces.length, maxWorkspaces),
  };
};

export const filterMembersByPlan = (members, limits, ownerId) => {
  const maxMembers = limits.maxMembersInAWorkspace;

  if (isUnlimited(maxMembers)) {
    return {
      filteredItems: members,
      metadata: createPlanMetadata(members.length, members.length, maxMembers),
    };
  }

  const ownerMember = members.find((m) => {
    const memberUserId = m.userId?._id?.toString() || m.userId?.toString() || m.userId;
    return memberUserId === ownerId?.toString();
  });

  const otherMembers = members.filter((m) => {
    const memberUserId = m.userId?._id?.toString() || m.userId?.toString() || m.userId;
    return memberUserId !== ownerId?.toString();
  });

  const sortedOthers = sortByCreatedAt(otherMembers);

  const ownerCount = ownerMember ? 1 : 0;
  const remainingSlots = Math.max(0, maxMembers - ownerCount);
  const selectedOthers = sortedOthers.slice(0, remainingSlots);

  const filtered = ownerMember
    ? [ownerMember, ...selectedOthers]
    : selectedOthers;

  return {
    filteredItems: filtered,
    metadata: createPlanMetadata(filtered.length, members.length, maxMembers),
  };
};

export const filterProjectsByPlan = (projects, limits) => {
  const maxProjects = limits.maxProjectsInAWorkspace;

  if (isUnlimited(maxProjects)) {
    return {
      filteredItems: projects,
      metadata: createPlanMetadata(projects.length, projects.length, maxProjects),
    };
  }

  const sorted = sortByCreatedAt(projects);
  const filtered = sorted.slice(0, maxProjects);

  return {
    filteredItems: filtered,
    metadata: createPlanMetadata(filtered.length, projects.length, maxProjects),
  };
};

export const filterTasksByPlan = (tasks, limits) => {
  const maxTasks = limits.maxTasksInAProject;

  if (isUnlimited(maxTasks)) {
    return {
      filteredItems: tasks,
      metadata: createPlanMetadata(tasks.length, tasks.length, maxTasks),
    };
  }

  const sorted = sortByCreatedAt(tasks);
  const filtered = sorted.slice(0, maxTasks);

  return {
    filteredItems: filtered,
    metadata: createPlanMetadata(filtered.length, tasks.length, maxTasks),
  };
};

export const createPlanLimitsResponse = (plan, planKey, limits, metadataMap = {}) => ({
  plan,
  planKey,
  limits,
  workspaces: metadataMap.workspaces || null,
  members: metadataMap.members || null,
  projects: metadataMap.projects || null,
  tasks: metadataMap.tasks || null,
});

export const applyPlanLimitsToWorkspace = (workspace, limits) => {
  const ownerId = workspace.ownerId?._id?.toString() || workspace.ownerId?.toString();

  const membersResult = filterMembersByPlan(workspace.members || [], limits, ownerId);

  const projectsResult = filterProjectsByPlan(workspace.projects || [], limits);

  const filteredProjectsWithTasks = projectsResult.filteredItems.map((project) => {
    const tasksResult = filterTasksByPlan(project.tasks || [], limits);
    return {
      ...project,
      tasks: tasksResult.filteredItems,
      _taskMetadata: tasksResult.metadata,
    };
  });

  const filteredWorkspace = {
    ...workspace,
    members: membersResult.filteredItems,
    projects: filteredProjectsWithTasks,
  };

  const metadata = createPlanLimitsResponse(
    null,
    null,
    limits,
    {
      members: membersResult.metadata,
      projects: projectsResult.metadata,
    }
  );

  return { workspace: filteredWorkspace, metadata };
};
