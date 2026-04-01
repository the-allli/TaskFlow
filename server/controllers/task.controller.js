import asyncHandler from "../utils/async_handler.js";
import * as taskService from "../services/task.service.js";

export const createTask = asyncHandler(taskService.createTask);
export const getProjectTasks = asyncHandler(taskService.getProjectTasks);
export const updateTask = asyncHandler(taskService.updateTask);
export const updateTaskStatus = asyncHandler(taskService.updateTaskStatus);
export const updateTaskAssignees = asyncHandler(taskService.updateTaskAssignees);
export const deleteTasks = asyncHandler(taskService.deleteTasks);
export const getComments = asyncHandler(taskService.getComments);
export const addComment = asyncHandler(taskService.addComment);
