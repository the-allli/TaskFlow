import asyncHandler from "../utils/async_handler.js";
import * as projectService from "../services/project.service.js";

export const createProject = asyncHandler(projectService.createProject);
export const addProjectMember = asyncHandler(projectService.addProjectMember);
export const removeProjectMember = asyncHandler(
  projectService.removeProjectMember,
);
export const updateProject = asyncHandler(projectService.updateProject);
export const deleteProject = asyncHandler(projectService.deleteProject);
