import * as workspaceRepository from "../repositories/workspace.repository.js";
import ApiError from "../utils/api_error.js";

export const checkWorkspaceRole = (allowedRoles) => async (req, res, next) => {
  try {
    const workspaceId = req.params.workspaceId;
    if (!workspaceId) {
      throw new ApiError(400, "workspaceId is required.");
    }

    const member = await workspaceRepository.findMember(
      workspaceId,
      req.user.id,
    );
    if (!member) {
      throw new ApiError(403, "You are not a member of this workspace.");
    }

    const roleName = member.role?.name;
    if (!roleName || !allowedRoles.includes(roleName)) {
      throw new ApiError(403, "You do not have permission to perform this action.");
    }

    req.workspaceMember = member;
    next();
  } catch (error) {
    next(error);
  }
};
