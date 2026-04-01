import Project from "../db/models/Project.modal.js";
import WorkspaceMember from "../db/models/WorkspaceMember.modal.js";
import Task from "../db/models/Task.modal.js";
import Comment from "../db/models/Comment.modal.js";

export const findWorkspaceMember = async (workspaceId, userId) => {
  return await WorkspaceMember.findOne({ workspaceId, userId });
};

export const findProjectById = async (id) => {
  return await Project.findById(id);
};

export const pushTaskToProject = async (projectId, taskId) => {
  return await Project.findByIdAndUpdate(projectId, {
    $push: { tasks: taskId },
  });
};

export const createTask = async (data) => {
  return await Task.create(data);
};

export const findTaskById = async (id) => {
  return await Task.findById(id);
};

export const findTaskByIdPopulated = async (id) => {
  return await Task.findById(id).populate("assignees", "name email dp");
};

export const findTasksByProject = async (projectId) => {
  return await Task.find({ projectId }).populate("assignees", "name email dp");
};

export const updateTaskStatusById = async (id, status) => {
  return await Task.findByIdAndUpdate(id, { status }, { returnDocument: 'after' }).populate(
    "assignees",
    "name email dp",
  );
};

export const updateTaskAssigneesById = async (id, assignees) => {
  return await Task.findByIdAndUpdate(
    id,
    { assignees },
    { returnDocument: 'after' },
  ).populate("assignees", "name email dp");
};

export const updateTaskById = async (id, updateData) => {
  return await Task.findByIdAndUpdate(
    id,
    updateData,
    { returnDocument: 'after' },
  ).populate("assignees", "name email dp");
};

export const deleteManyTasks = async (taskIds) => {
  return await Task.deleteMany({ _id: { $in: taskIds } });
};

export const countTasksByIdsInProject = async (taskIds, projectId) => {
  return await Task.countDocuments({ _id: { $in: taskIds }, projectId });
};

export const findCommentsByTask = async (taskId) => {
  return await Comment.find({ taskId })
    .populate("userId", "name email dp")
    .sort({ createdAt: 1 });
};

export const createComment = async (data) => {
  return await Comment.create(data);
};

export const clearAssigneeForUserInProjects = async (userId, projectIds) => {
  return await Task.updateMany(
    { projectId: { $in: projectIds }, assignees: userId },
    { $pull: { assignees: userId } },
  );
};

export const findCommentByIdPopulated = async (id) => {
  return await Comment.findById(id).populate("userId", "name email dp");
};
