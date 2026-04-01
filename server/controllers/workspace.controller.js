import asyncHandler from "../utils/async_handler.js";
import * as workspaceService from "../services/workspace.service.js";

export const createWorkspace = asyncHandler(workspaceService.createWorkspace);
export const getWorkspaces = asyncHandler(workspaceService.getWorkspaces);
export const getMembers = asyncHandler(workspaceService.getMembers);
export const inviteMember = asyncHandler(workspaceService.inviteMember);
export const joinWorkspace = asyncHandler(workspaceService.join_workspace);
export const removeMember = asyncHandler(workspaceService.removeMember);
export const updateWorkspace = asyncHandler(workspaceService.updateWorkspace);
export const deleteWorkspace = asyncHandler(workspaceService.deleteWorkspace);

export const updateMemberRole = asyncHandler(workspaceService.updateMemberRole);

