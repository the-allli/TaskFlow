import { findWorkspaceById } from "../repositories/workspace.repository.js";
import ApiError from "../utils/api_error.js";

export const attachWorkspaceName = async (req, res, next) => {
  const { workspaceId } = req.params;
  const workspace = await findWorkspaceById(workspaceId);
  if (!workspace) throw new ApiError(404, "Workspace not found");

  req.workspaceName = workspace.name.trim().replace(/\s+/g, "_");
  next();
};
