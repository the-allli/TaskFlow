import { create } from "zustand";
import {
  fetchWorkspacesApi,
  fetchMembersApi,
  removeMemberApi,
  updateMemberRoleApi,
  createWorkspaceApi,
  updateWorkspaceApi,
  deleteWorkspaceApi,
  createProjectApi,
  addProjectMemberApi,
  removeProjectMemberApi,
  updateProjectApi,
  deleteProjectApi,
  createTaskApi,
  fetchTasksApi,
  updateTaskApi,
  updateTaskStatusApi,
  updateTaskAssigneesApi,
  deleteTasksApi,
  fetchCommentsApi,
  addCommentApi,
} from "../api/workspace.api";

const useWorkspaceStore = create((set) => ({
  workspaces: [],
  currentWorkspace: null,
  loading: false,

  fetchWorkspaces: async () => {
    set({ loading: true });
    try {
      const { data } = await fetchWorkspacesApi();
      const workspaces = data.data.map((w) => ({ ...w, id: w._id }));
      const savedId = localStorage.getItem("currentWorkspaceId");
      const currentWorkspace =
        workspaces.find((w) => w.id == savedId) || workspaces[0] || null;
      if (currentWorkspace)
        localStorage.setItem("currentWorkspaceId", currentWorkspace.id);
      set({ workspaces, currentWorkspace });
    } catch (error) {
      console.error(error.response?.data?.message || error.message);
    } finally {
      set({ loading: false });
    }
  },

  fetchMembers: async (workspaceId) => {
    try {
      const { data } = await fetchMembersApi(workspaceId);
      const members = data.data.members || data.data;
      const membersPlanLimits = data.data._planLimits;
      set((state) => ({
        currentWorkspace: {
          ...state.currentWorkspace,
          members,
          _planLimits: {
            ...state.currentWorkspace?._planLimits,
            ...membersPlanLimits,
          },
        },
      }));
    } catch (error) {
      console.error(error.response?.data?.message || error.message);
    }
  },

  removeMember: async (workspaceId, memberId) => {
    try {
      await removeMemberApi(workspaceId, memberId);
      set((state) => ({
        currentWorkspace: {
          ...state.currentWorkspace,
          members: state.currentWorkspace.members.filter(
            (m) => m._id !== memberId,
          ),
        },
      }));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },

  updateMemberRole: async (workspaceId, memberId, role) => {
    try {
      const { data } = await updateMemberRoleApi(workspaceId, memberId, role);
      const updatedMember = data.data;
      set((state) => ({
        currentWorkspace: {
          ...state.currentWorkspace,
          members: state.currentWorkspace.members.map((m) =>
            m._id === memberId ? updatedMember : m,
          ),
        },
      }));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },

  setCurrentWorkspace: (workspaceId) => {
    localStorage.setItem("currentWorkspaceId", workspaceId);
    set((state) => ({
      currentWorkspace: state.workspaces.find((w) => w.id === workspaceId),
    }));
  },

  addWorkspace: async (formData) => {
    set({ loading: true });
    try {
      const { data } = await createWorkspaceApi(formData);
      const newWorkspace = { ...data.data, id: data.data._id };
      localStorage.setItem("currentWorkspaceId", newWorkspace.id);
      set((state) => ({
        workspaces: [...state.workspaces, newWorkspace],
        currentWorkspace: newWorkspace,
      }));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    } finally {
      set({ loading: false });
    }
  },

  updateWorkspace: async (workspaceId, formData) => {
    try {
      const { data } = await updateWorkspaceApi(workspaceId, formData);
      set((state) => {
        const updated = {
          ...state.currentWorkspace,
          ...data.data,
          id: data.data._id,
          members: state.currentWorkspace.members,
        };
        return {
          currentWorkspace: updated,
          workspaces: state.workspaces.map((w) =>
            w.id === workspaceId ? updated : w,
          ),
        };
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },

  deleteWorkspace: async (workspaceId) => {
    try {
      await deleteWorkspaceApi(workspaceId);
      set((state) => {
        const remaining = state.workspaces.filter((w) => w.id !== workspaceId);
        const next = remaining[0] || null;
        if (next) localStorage.setItem("currentWorkspaceId", next.id);
        else localStorage.removeItem("currentWorkspaceId");
        return { workspaces: remaining, currentWorkspace: next };
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },

  addProject: async (workspaceId, formData) => {
    try {
      const { data } = await createProjectApi(workspaceId, formData);
      const projectData = data.data._planLimits ? data.data : { ...data.data, _planLimits: undefined };
      const newProject = { ...projectData, id: projectData._id };
      const projectPlanLimits = data.data._planLimits;
      set((state) => ({
        currentWorkspace: {
          ...state.currentWorkspace,
          projects: [...(state.currentWorkspace.projects || []), newProject],
          _planLimits: {
            ...state.currentWorkspace?._planLimits,
            ...projectPlanLimits,
          },
        },
      }));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },

  addProjectMember: async (workspaceId, projectId, userId) => {
    try {
      const { data } = await addProjectMemberApi(
        workspaceId,
        projectId,
        userId,
      );
      const newMember = data.data;
      set((state) => ({
        currentWorkspace: {
          ...state.currentWorkspace,
          projects: state.currentWorkspace.projects.map((p) =>
            p._id === projectId || p.id === projectId
              ? { ...p, members: [...(p.members || []), newMember] }
              : p,
          ),
        },
      }));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },

  removeProjectMember: async (workspaceId, projectId, memberId) => {
    try {
      await removeProjectMemberApi(workspaceId, projectId, memberId);
      set((state) => ({
        currentWorkspace: {
          ...state.currentWorkspace,
          projects: state.currentWorkspace.projects.map((p) =>
            p._id === projectId || p.id === projectId
              ? {
                  ...p,
                  members: p.members.filter(
                    (m) => m._id !== memberId && m.id !== memberId,
                  ),
                }
              : p,
          ),
        },
      }));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },

  updateProject: async (workspaceId, projectId, formData) => {
    try {
      const { data } = await updateProjectApi(workspaceId, projectId, formData);
      const updated = { ...data.data, id: data.data._id };
      set((state) => ({
        currentWorkspace: {
          ...state.currentWorkspace,
          projects: state.currentWorkspace.projects.map((p) =>
            p._id === projectId || p.id === projectId ? updated : p,
          ),
        },
      }));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },

  deleteProject: async (workspaceId, projectId) => {
    try {
      await deleteProjectApi(workspaceId, projectId);
      set((state) => ({
        currentWorkspace: {
          ...state.currentWorkspace,
          projects: state.currentWorkspace.projects.filter(
            (p) => p._id !== projectId && p.id !== projectId,
          ),
        },
      }));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },

  addTask: async (workspaceId, projectId, formData) => {
    try {
      const { data } = await createTaskApi(workspaceId, projectId, formData);
      const newTask = data.data.tasks ? data.data.tasks : data.data;
      set((state) => ({
        currentWorkspace: {
          ...state.currentWorkspace,
          projects: state.currentWorkspace.projects.map((p) =>
            p._id === projectId || p.id === projectId
              ? { ...p, tasks: [...(p.tasks || []), newTask] }
              : p,
          ),
        },
      }));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },

  fetchTasks: async (workspaceId, projectId) => {
    try {
      const { data } = await fetchTasksApi(workspaceId, projectId);
      const tasks = data.data.tasks || data.data;
      const tasksPlanLimits = data.data._planLimits;
      set((state) => ({
        currentWorkspace: {
          ...state.currentWorkspace,
          projects: state.currentWorkspace.projects.map((p) =>
            p._id === projectId || p.id === projectId ? { ...p, tasks } : p,
          ),
          _planLimits: {
            ...state.currentWorkspace?._planLimits,
            ...tasksPlanLimits,
          },
        },
      }));
      return { success: true, tasks };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },

  updateTask: async (workspaceId, projectId, taskId, formData) => {
    try {
      const { data } = await updateTaskApi(
        workspaceId,
        projectId,
        taskId,
        formData,
      );
      set((state) => ({
        currentWorkspace: {
          ...state.currentWorkspace,
          projects: state.currentWorkspace.projects.map((p) =>
            p._id === projectId || p.id === projectId
              ? {
                  ...p,
                  tasks: p.tasks.map((t) =>
                    t._id === taskId || t.id === taskId
                      ? { ...t, ...data.data }
                      : t,
                  ),
                }
              : p,
          ),
        },
      }));
      return { success: true, data: data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },

  updateTaskStatus: async (workspaceId, projectId, taskId, status) => {
    try {
      const { data } = await updateTaskStatusApi(
        workspaceId,
        projectId,
        taskId,
        status,
      );
      set((state) => ({
        currentWorkspace: {
          ...state.currentWorkspace,
          projects: state.currentWorkspace.projects.map((p) =>
            p._id === projectId || p.id === projectId
              ? {
                  ...p,
                  tasks: p.tasks.map((t) =>
                    t._id === taskId || t.id === taskId
                      ? { ...t, status: data.data.status }
                      : t,
                  ),
                }
              : p,
          ),
        },
      }));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },

  updateTaskAssignees: async (workspaceId, projectId, taskId, assignees) => {
    try {
      const { data } = await updateTaskAssigneesApi(
        workspaceId,
        projectId,
        taskId,
        assignees,
      );
      return { success: true, data: data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },

  deleteTasks: async (workspaceId, projectId, taskIds) => {
    try {
      await deleteTasksApi(workspaceId, projectId, taskIds);
      set((state) => ({
        currentWorkspace: {
          ...state.currentWorkspace,
          projects: state.currentWorkspace.projects.map((p) =>
            p._id === projectId || p.id === projectId
              ? {
                  ...p,
                  tasks: p.tasks.filter(
                    (t) => !taskIds.includes(t._id) && !taskIds.includes(t.id),
                  ),
                }
              : p,
          ),
        },
      }));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },

  fetchComments: async (taskId) => {
    try {
      const { data } = await fetchCommentsApi(taskId);
      return { success: true, comments: data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },

  addComment: async (taskId, content) => {
    try {
      const { data } = await addCommentApi(taskId, content);
      return { success: true, comment: data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },
}));

export default useWorkspaceStore;
