import express from "express";
import auth from "../middlewares/auth.middleware.js";
import {
  createWorkspace,
  getWorkspaces,
  getMembers,
  inviteMember,
  joinWorkspace,
  removeMember,
  updateWorkspace,
  deleteWorkspace,
  updateMemberRole,
} from "../controllers/workspace.controller.js";
import {
  createProject,
  addProjectMember,
  removeProjectMember,
  updateProject,
  deleteProject,
} from "../controllers/project.controller.js";
import {
  createTask,
  getProjectTasks,
  updateTask,
  updateTaskStatus,
  updateTaskAssignees,
  deleteTasks,
  getComments,
  addComment,
} from "../controllers/task.controller.js";
import { generalLimiter } from "../middlewares/rate_limiter.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { attachWorkspaceName } from "../middlewares/workspace.middleware.js";
import { requireAdmin } from "../middlewares/require_admin.middleware.js";
import { checkWorkspaceRole } from "../middlewares/workspace_roles.middleware.js";
import { checkPlanLimit } from "../middlewares/check_plan_limit.middleware.js";

const router = express.Router();

router.use(generalLimiter);

router.get("/", auth, getWorkspaces);

router.post(
  "/create",
  auth,
  requireAdmin,
  checkPlanLimit("workspace"),
  upload.single("image"),
  createWorkspace,
);

router.post(
  "/join/:invite_code",
  auth,
  checkPlanLimit("member"),
  joinWorkspace,
);

router.get(
  "/:workspaceId/members",
  auth,
  checkWorkspaceRole(["admin", "manager", "dev"]),
  getMembers,
);

router.post(
  "/:workspaceId/invite",
  auth,
  checkWorkspaceRole(["admin", "manager"]),
  checkPlanLimit("member"),
  inviteMember,
);

router.post(
  "/:workspaceId/projects/:projectId/members",
  auth,
  checkWorkspaceRole(["admin", "manager"]),
  addProjectMember,
);

router.delete(
  "/:workspaceId/projects/:projectId/members/:memberId",
  auth,
  checkWorkspaceRole(["admin", "manager"]),
  removeProjectMember,
);

router.patch(
  "/:workspaceId/members/:memberId/role",
  auth,
  checkWorkspaceRole(["admin"]),
  updateMemberRole,
);

router.delete(
  "/:workspaceId/members/:memberId",
  auth,
  checkWorkspaceRole(["admin"]),
  removeMember,
);

router.put(
  "/:workspaceId/settings",
  auth,
  checkWorkspaceRole(["admin"]),
  upload.single("image"),
  updateWorkspace,
);

router.delete(
  "/:workspaceId",
  auth,
  checkWorkspaceRole(["admin"]),
  deleteWorkspace,
);

router.post(
  "/:workspaceId/projects",
  auth,
  checkWorkspaceRole(["admin", "manager"]),
  checkPlanLimit("project"),
  attachWorkspaceName,
  upload.array("files", 10),
  createProject,
);

router.put(
  "/:workspaceId/projects/:projectId",
  auth,
  checkWorkspaceRole(["admin", "manager"]),
  updateProject,
);
router.delete(
  "/:workspaceId/projects/:projectId",
  auth,
  checkWorkspaceRole(["admin"]),
  deleteProject,
);

router.post(
  "/:workspaceId/projects/:projectId/tasks",
  auth,
  checkWorkspaceRole(["admin", "manager"]),
  checkPlanLimit("task"),
  createTask,
);

router.get(
  "/:workspaceId/projects/:projectId/tasks",
  auth,
  checkWorkspaceRole(["admin", "manager", "dev"]),
  getProjectTasks,
);

router.patch(
  "/:workspaceId/projects/:projectId/tasks/:taskId",
  auth,
  checkWorkspaceRole(["admin", "manager"]),
  updateTask,
);

router.patch(
  "/:workspaceId/projects/:projectId/tasks/:taskId/status",
  auth,
  checkWorkspaceRole(["admin", "manager", "dev"]),
  updateTaskStatus,
);

router.patch(
  "/:workspaceId/projects/:projectId/tasks/:taskId/assignees",
  auth,
  checkWorkspaceRole(["admin", "manager"]),
  updateTaskAssignees,
);

router.delete(
  "/:workspaceId/projects/:projectId/tasks",
  auth,
  checkWorkspaceRole(["admin", "manager"]),
  deleteTasks,
);
router.get("/tasks/:taskId/comments", auth, getComments);
router.post("/tasks/:taskId/comments", auth, addComment);

export default router;
