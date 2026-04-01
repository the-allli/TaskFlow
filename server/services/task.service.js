import ApiError from "../utils/api_error.js";
import ApiResponse from "../utils/api_response.js";
import * as taskRepository from "../repositories/task.repository.js";
import * as projectRepository from "../repositories/project.repository.js";
import * as workspaceRepository from "../repositories/workspace.repository.js";
import { sendTaskAssignedEmail } from "../lib/nodemailer/emails.js";
import {
  getPlanLimitsForAdmin,
  filterTasksByPlan,
  createPlanLimitsResponse,
} from "../utils/plan_enforcement.js";

export const createTask = async (req, res) => {
  const { projectId, workspaceId } = req.params;
  const { title, description, type, status, priority, assignees, due_date } =
    req.body;
  const requesterId = req.user.id;

  const project = await taskRepository.findProjectById(projectId);
  if (!project) throw new ApiError(404, "Project not found.");
  if (project.workspaceId.toString() !== workspaceId.toString()) {
    throw new ApiError(403, "Project does not belong to this workspace.");
  }

  let finalAssignees = [];
  if (Array.isArray(assignees)) {
    finalAssignees = assignees;
  } else if (req.body.assigneeId) {
    finalAssignees = [req.body.assigneeId];
  }

  if (finalAssignees.length > 0) {
    await projectRepository.ensureUsersAreProjectMembers(
      projectId,
      finalAssignees,
    );
  }

  const task = await taskRepository.createTask({
    projectId,
    title,
    description,
    type: type || "TASK",
    status: status || "TODO",
    priority: priority || "MEDIUM",
    assignees: finalAssignees,
    due_date,
  });

  await taskRepository.pushTaskToProject(projectId, task._id);

  const populated = await taskRepository.findTaskByIdPopulated(task._id);

  for (const assignee of populated.assignees) {
    if (assignee._id.toString() !== requesterId.toString()) {
      try {
        if (assignee && assignee.email) {
          await sendTaskAssignedEmail({
            email: assignee.email,
            assigneeName: assignee.name,
            taskTitle: title,
            taskDescription: description,
            projectName: project.name,
            taskType: type || "TASK",
            priority: priority || "MEDIUM",
            dueDate: due_date,
            taskUrl: `${process.env.CLIENT_URL || "http://localhost:5173"}/dashboard/tasks`,
          });
        }
      } catch (emailError) {
        console.error("Failed to send task assigned email:", emailError);
      }
    }
  }

  return res
    .status(201)
    .json(new ApiResponse(201, populated, "Task created successfully."));
};

export const getProjectTasks = async (req, res) => {
  const { projectId, workspaceId } = req.params;

  const project = await taskRepository.findProjectById(projectId);
  if (!project) throw new ApiError(404, "Project not found.");
  if (project.workspaceId.toString() !== workspaceId.toString()) {
    throw new ApiError(403, "Project does not belong to this workspace.");
  }

  const tasks = await taskRepository.findTasksByProject(projectId);

  const workspace = await workspaceRepository.findWorkspaceById(workspaceId);
  const ownerId = workspace?.ownerId?.toString();
  const planInfo = await getPlanLimitsForAdmin(ownerId);

  const tasksResult = filterTasksByPlan(tasks, planInfo.limits);

  const planLimitsMetadata = createPlanLimitsResponse(
    planInfo.plan,
    planInfo.planKey,
    planInfo.limits,
    {
      tasks: tasksResult.metadata,
    },
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        tasks: tasksResult.filteredItems,
        _planLimits: planLimitsMetadata,
      },
      "Tasks fetched successfully.",
    ),
  );
};

export const updateTaskStatus = async (req, res) => {
  const { taskId, projectId, workspaceId } = req.params;
  const { status } = req.body;

  const existing = await taskRepository.findTaskById(taskId);
  if (!existing) throw new ApiError(404, "Task not found.");
  if (existing.projectId.toString() !== projectId.toString()) {
    throw new ApiError(400, "Task does not belong to this project.");
  }

  const project = await taskRepository.findProjectById(projectId);
  if (!project || project.workspaceId.toString() !== workspaceId.toString()) {
    throw new ApiError(403, "Project does not belong to this workspace.");
  }

  const task = await taskRepository.updateTaskStatusById(taskId, status);
  if (!task) throw new ApiError(404, "Task not found.");

  return res
    .status(200)
    .json(new ApiResponse(200, task, "Task status updated successfully."));
};

export const updateTask = async (req, res) => {
  const { taskId, projectId, workspaceId } = req.params;
  const { title, description, type, priority, due_date } = req.body;

  const existing = await taskRepository.findTaskById(taskId);
  if (!existing) throw new ApiError(404, "Task not found.");
  if (existing.projectId.toString() !== projectId.toString()) {
    throw new ApiError(400, "Task does not belong to this project.");
  }

  const project = await taskRepository.findProjectById(projectId);
  if (!project || project.workspaceId.toString() !== workspaceId.toString()) {
    throw new ApiError(403, "Project does not belong to this workspace.");
  }

  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (type !== undefined) updateData.type = type;
  if (priority !== undefined) updateData.priority = priority;
  if (due_date !== undefined) updateData.due_date = due_date;

  const task = await taskRepository.updateTaskById(taskId, updateData);
  if (!task) throw new ApiError(404, "Task not found.");

  return res
    .status(200)
    .json(new ApiResponse(200, task, "Task updated successfully."));
};

export const updateTaskAssignees = async (req, res) => {
  const { taskId, projectId, workspaceId } = req.params;
  const { assignees } = req.body;
  const requesterId = req.user.id;

  if (!Array.isArray(assignees)) {
    throw new ApiError(400, "Assignees must be an array.");
  }

  const existing = await taskRepository.findTaskById(taskId);
  if (!existing) throw new ApiError(404, "Task not found.");
  if (existing.projectId.toString() !== projectId.toString()) {
    throw new ApiError(400, "Task does not belong to this project.");
  }

  const project = await taskRepository.findProjectById(projectId);
  if (!project || project.workspaceId.toString() !== workspaceId.toString()) {
    throw new ApiError(403, "Project does not belong to this workspace.");
  }

  const oldAssigneeIds = existing.assignees.map((id) => id.toString());
  const newAssigneeIds = assignees.filter((id) => !oldAssigneeIds.includes(id));

  await projectRepository.ensureUsersAreProjectMembers(projectId, assignees);

  const task = await taskRepository.updateTaskAssigneesById(taskId, assignees);
  if (!task) throw new ApiError(404, "Task not found.");

  if (newAssigneeIds.length > 0) {
    for (const assignee of task.assignees) {
      if (
        newAssigneeIds.includes(assignee._id.toString()) &&
        assignee._id.toString() !== requesterId.toString()
      ) {
        try {
          if (assignee && assignee.email) {
            await sendTaskAssignedEmail({
              email: assignee.email,
              assigneeName: assignee.name,
              taskTitle: task.title,
              taskDescription: task.description,
              projectName: project.name,
              taskType: task.type || "TASK",
              priority: task.priority || "MEDIUM",
              dueDate: task.due_date,
              taskUrl: `${process.env.CLIENT_URL || "http://localhost:5173"}/dashboard/tasks`,
            });
          }
        } catch (emailError) {
          console.error("Failed to send task assigned email:", emailError);
        }
      }
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, task, "Task assignees updated successfully."));
};

export const deleteTasks = async (req, res) => {
  const { projectId, workspaceId } = req.params;
  const { taskIds } = req.body;
  if (!taskIds?.length) throw new ApiError(400, "No task IDs provided.");

  const project = await taskRepository.findProjectById(projectId);
  if (!project) throw new ApiError(404, "Project not found.");
  if (project.workspaceId.toString() !== workspaceId.toString()) {
    throw new ApiError(403, "Project does not belong to this workspace.");
  }

  const count = await taskRepository.countTasksByIdsInProject(
    taskIds,
    projectId,
  );
  if (count !== taskIds.length) {
    throw new ApiError(400, "One or more tasks are invalid for this project.");
  }

  await taskRepository.deleteManyTasks(taskIds);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Tasks deleted successfully."));
};

export const getComments = async (req, res) => {
  const { taskId } = req.params;

  const comments = await taskRepository.findCommentsByTask(taskId);

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully."));
};

export const addComment = async (req, res) => {
  const { content } = req.body;
  const { taskId } = req.params;

  const comment = await taskRepository.createComment({
    taskId,
    userId: req.user.id,
    content,
  });

  const populated = await taskRepository.findCommentByIdPopulated(comment._id);

  return res
    .status(201)
    .json(new ApiResponse(201, populated, "Comment added successfully."));
};
