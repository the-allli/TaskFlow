import * as paymentRepository from "../repositories/payment.repository.js";
import * as planRepository from "../repositories/plan.repository.js";
import * as workspaceRepository from "../repositories/workspace.repository.js";
import ApiError from "../utils/api_error.js";
import WorkspaceMember from "../db/models/WorkspaceMember.modal.js";
import Project from "../db/models/Project.modal.js";
import Task from "../db/models/Task.modal.js";

export const checkPlanLimit = (resource) => async (req, res, next) => {
  try {
    let adminId = req.user?.adminId || req.user?.id;
    let workspaceId = req.params?.workspaceId || req.body?.workspaceId;

    if (!workspaceId && req.params?.invite_code) {
      const workspace = await workspaceRepository.findWorkspaceByInviteCode(
        req.params.invite_code,
      );
      workspaceId = workspace?._id;
    }

    if (resource !== "workspace") {
      if (!workspaceId) {
        throw new ApiError(
          400,
          "workspaceId is required to check plan limits.",
        );
      }
      const workspace =
        await workspaceRepository.findWorkspaceById(workspaceId);
      if (!workspace) {
        throw new ApiError(404, "Workspace not found.");
      }
      adminId = workspace.ownerId?.toString();
    }

    const subscription =
      await paymentRepository.findSubscriptionByAdminId(adminId);

    let limits;
    let planName;

    if (subscription?.status === "active" && subscription.planId) {
      limits = subscription.planId.limits;
      planName = subscription.planId.name;
    } else {
      const freePlan = await planRepository.findPlanByName("free");
      limits = freePlan.limits;
      planName = "free";
    }

    const isOverLimit = (count, max) => max !== -1 && count >= max;

    switch (resource) {
      case "workspace": {
        const count = await workspaceRepository.countOwnedWorkspaces(adminId);
        if (isOverLimit(count, limits.maxWorkspaces))
          throw new ApiError(
            403,
            `Your ${planName} plan allows max ${limits.maxWorkspaces} workspace(s).`,
          );
        break;
      }
      case "member": {
        if (!workspaceId) {
          throw new ApiError(
            400,
            "workspaceId is required to check member limit.",
          );
        }

        const count = await WorkspaceMember.countDocuments({ workspaceId });
        if (isOverLimit(count, limits.maxMembersInAWorkspace))
          throw new ApiError(
            403,
            `Your ${planName} plan allows max ${limits.maxMembersInAWorkspace} member(s) per workspace.`,
          );
        break;
      }
      case "project": {
        if (!workspaceId) {
          throw new ApiError(
            400,
            "workspaceId is required to check project limit.",
          );
        }

        const count = await Project.countDocuments({ workspaceId });
        if (isOverLimit(count, limits.maxProjectsInAWorkspace))
          throw new ApiError(
            403,
            `Your ${planName} plan allows max ${limits.maxProjectsInAWorkspace} project(s).`,
          );
        break;
      }
      case "task": {
        const projectId = req.params?.projectId || req.body?.projectId;
        if (!projectId) {
          throw new ApiError(400, "projectId is required to check task limit.");
        }

        const count = await Task.countDocuments({ projectId });
        if (isOverLimit(count, limits.maxTasksInAProject))
          throw new ApiError(
            403,
            `Your ${planName} plan allows max ${limits.maxTasksInAProject} task(s).`,
          );
        break;
      }
      default:
        throw new ApiError(400, "Invalid plan limit check resource.");
    }

    req.plan = planName;
    req.limits = limits;
    next();
  } catch (error) {
    next(error);
  }
};
