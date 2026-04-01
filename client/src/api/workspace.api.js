import { axiosInstance } from "../lib/axios";

// Workspaces
export const fetchWorkspacesApi = () => axiosInstance.get("/workspace");

export const fetchMembersApi = (workspaceId) =>
  axiosInstance.get(`/workspace/${workspaceId}/members`);

export const removeMemberApi = (workspaceId, memberId) =>
  axiosInstance.delete(`/workspace/${workspaceId}/members/${memberId}`);

export const updateMemberRoleApi = (workspaceId, memberId, role) =>
  axiosInstance.patch(`/workspace/${workspaceId}/members/${memberId}/role`, {
    role,
  });

export const createWorkspaceApi = (formData) =>
  axiosInstance.post("/workspace/create", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updateWorkspaceApi = (workspaceId, formData) =>
  axiosInstance.put(`/workspace/${workspaceId}/settings`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

export const deleteWorkspaceApi = (workspaceId) =>
  axiosInstance.delete(`/workspace/${workspaceId}`);

export const createProjectApi = (workspaceId, formData) =>
  axiosInstance.post(`/workspace/${workspaceId}/projects`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const addProjectMemberApi = (workspaceId, projectId, userId) =>
  axiosInstance.post(
    `/workspace/${workspaceId}/projects/${projectId}/members`,
    { userId },
  );

export const removeProjectMemberApi = (workspaceId, projectId, memberId) =>
  axiosInstance.delete(
    `/workspace/${workspaceId}/projects/${projectId}/members/${memberId}`,
  );

export const updateProjectApi = (workspaceId, projectId, formData) =>
  axiosInstance.put(
    `/workspace/${workspaceId}/projects/${projectId}`,
    formData,
  );

export const deleteProjectApi = (workspaceId, projectId) =>
  axiosInstance.delete(`/workspace/${workspaceId}/projects/${projectId}`);

// Tasks
export const createTaskApi = (workspaceId, projectId, formData) =>
  axiosInstance.post(
    `/workspace/${workspaceId}/projects/${projectId}/tasks`,
    formData,
  );

export const fetchTasksApi = (workspaceId, projectId) =>
  axiosInstance.get(`/workspace/${workspaceId}/projects/${projectId}/tasks`);

export const updateTaskApi = (workspaceId, projectId, taskId, formData) =>
  axiosInstance.patch(
    `/workspace/${workspaceId}/projects/${projectId}/tasks/${taskId}`,
    formData,
  );

export const updateTaskStatusApi = (workspaceId, projectId, taskId, status) =>
  axiosInstance.patch(
    `/workspace/${workspaceId}/projects/${projectId}/tasks/${taskId}/status`,
    { status },
  );

export const updateTaskAssigneesApi = (
  workspaceId,
  projectId,
  taskId,
  assignees,
) =>
  axiosInstance.patch(
    `/workspace/${workspaceId}/projects/${projectId}/tasks/${taskId}/assignees`,
    { assignees },
  );

export const deleteTasksApi = (workspaceId, projectId, taskIds) =>
  axiosInstance.delete(
    `/workspace/${workspaceId}/projects/${projectId}/tasks`,
    { data: { taskIds } },
  );

// Comments
export const fetchCommentsApi = (taskId) =>
  axiosInstance.get(`/workspace/tasks/${taskId}/comments`);

export const addCommentApi = (taskId, content) =>
  axiosInstance.post(`/workspace/tasks/${taskId}/comments`, { content });
