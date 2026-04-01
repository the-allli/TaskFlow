import ApiError from "../utils/api_error.js";
import ApiResponse from "../utils/api_response.js";
import * as projectRepository from "../repositories/project.repository.js";
import * as taskRepository from "../repositories/task.repository.js";
import uploadToCloudinary from "../lib/cloudinary.js";
import {
  sendProjectMemberAddedEmail,
  sendProjectMemberRemovedEmail,
} from "../lib/nodemailer/emails.js";
import {
  getPlanLimitsForAdmin,
  filterTasksByPlan,
  createPlanLimitsResponse,
} from "../utils/plan_enforcement.js";
import * as workspaceRepository from "../repositories/workspace.repository.js";

export const createProject = async (req, res) => {
  const {
    name,
    description,
    status,
    priority,
    start_date,
    end_date,
    team_lead,
    project_members,
    progress,
  } = req.body;

  const { workspaceId } = req.params;
  const requesterId = req.user.id;

  const project = await projectRepository.createProject({
    name,
    description,
    status,
    priority,
    start_date: start_date || null,
    end_date: end_date || null,
    team_lead: team_lead || requesterId,
    workspaceId,
    progress: progress || 0,
  });

  if (req.files && req.files.length > 0) {
    const uploadPromises = req.files.map(async (file) => {
      const result = await uploadToCloudinary(file.buffer);

      return {
        originalName: file.originalname,
        url: result.secure_url,
        cloudinary_id: result.public_id,
        mimetype: file.mimetype,
        size: file.size,
        uploadedBy: requesterId,
        projectId: project._id,
      };
    });

    const fileDataArray = await Promise.all(uploadPromises);

    const fileDocs = await projectRepository.createFiles(fileDataArray);
    const fileIds = fileDocs.map((f) => f._id);

    await projectRepository.pushProjectFiles(project._id, fileIds);
  }

  const membersArray = Array.isArray(project_members)
    ? project_members
    : project_members
      ? [project_members]
      : [];

  const memberIds = [...new Set([team_lead || requesterId, ...membersArray])];

  const projectMembers = await Promise.all(
    memberIds.map((userId) =>
      projectRepository.createProjectMember({ userId, projectId: project._id }),
    ),
  );

  await projectRepository.pushProjectMembers(
    project._id,
    projectMembers.map((m) => m._id),
  );

  await projectRepository.pushWorkspaceProject(workspaceId, project._id);

  const populated = await projectRepository.findProjectByIdPopulated(
    project._id,
  );

  const workspace = await workspaceRepository.findWorkspaceById(workspaceId);
  const ownerId = workspace?.ownerId?.toString();
  const planInfo = await getPlanLimitsForAdmin(ownerId);

  const tasksResult = filterTasksByPlan(populated.tasks || [], planInfo.limits);

  const projectWithLimitedTasks = {
    ...populated.toObject(),
    tasks: tasksResult.filteredItems,
  };

  const planLimitsMetadata = createPlanLimitsResponse(
    planInfo.plan,
    planInfo.planKey,
    planInfo.limits,
    {
      tasks: tasksResult.metadata,
    },
  );

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { ...projectWithLimitedTasks, _planLimits: planLimitsMetadata },
        "Project created successfully.",
      ),
    );
};

export const addProjectMember = async (req, res) => {
  const { workspaceId, projectId } = req.params;
  const { userId } = req.body;
  const requesterId = req.user.id;

  const isWorkspaceMember = await projectRepository.findWorkspaceMember(
    workspaceId,
    userId,
  );
  if (!isWorkspaceMember) {
    throw new ApiError(400, "User is not a workspace member.");
  }

  const existing = await projectRepository.findProjectMember(projectId, userId);
  if (existing) {
    throw new ApiError(400, "User is already in this project.");
  }

  const member = await projectRepository.createProjectMember({
    userId,
    projectId,
  });
  await projectRepository.pushProjectMember(projectId, member._id);

  const populated = await projectRepository.findProjectMemberByIdPopulated(
    member._id,
  );

  try {
    const project = await projectRepository.findProjectById(projectId);
    const memberUser = populated.userId;

    if (memberUser && memberUser.email) {
      await sendProjectMemberAddedEmail({
        email: memberUser.email,
        name: memberUser.name,
        projectName: project.name,
        workspaceName: req.workspace?.name || "your workspace",
        description: project.description,
        dashboardUrl: `${process.env.CLIENT_URL || "http://localhost:5173"}/dashboard/projects`,
      });
    }
  } catch (emailError) {
    console.error("Failed to send project member added email:", emailError);
  }

  return res
    .status(201)
    .json(new ApiResponse(201, populated, "Member added successfully."));
};

export const removeProjectMember = async (req, res) => {
  const { workspaceId, projectId, memberId } = req.params;
  const requesterId = req.user.id;

  const project = await projectRepository.findProjectById(projectId);
  if (!project) {
    throw new ApiError(404, "Project not found.");
  }

  const memberToRemove =
    await projectRepository.findProjectMemberById(memberId);
  if (!memberToRemove) {
    throw new ApiError(404, "Project member not found.");
  }

  const requesterWorkspaceMember = await projectRepository.findWorkspaceMember(
    workspaceId,
    requesterId,
  );
  const requesterRole = requesterWorkspaceMember?.role?.name;
  const isWorkspaceAdmin = requesterRole === "admin";

  const memberUserId = memberToRemove.userId?._id || memberToRemove.userId;

  if (project.team_lead?.toString() === memberUserId.toString()) {
    throw new ApiError(403, "Cannot remove the project team lead.");
  }

  if (requesterId.toString() === memberUserId.toString()) {
    throw new ApiError(403, "You cannot remove yourself from the project.");
  }

  if (!isWorkspaceAdmin) {
    if (requesterRole === "manager") {
      const memberWorkspaceMember = await projectRepository.findWorkspaceMember(
        workspaceId,
        memberUserId,
      );
      const memberRole = memberWorkspaceMember?.role?.name;

      if (memberRole !== "dev") {
        throw new ApiError(
          403,
          "Managers can only remove developers from projects.",
        );
      }
    } else {
      throw new ApiError(
        403,
        "You don't have permission to remove members from this project.",
      );
    }
  }

  await projectRepository.deleteProjectMemberById(memberId);
  await projectRepository.pullProjectMember(projectId, memberId);

  await taskRepository.clearAssigneeForUserInProjects(memberUserId, [
    projectId,
  ]);

  try {
    const memberUser = memberToRemove.userId;

    if (memberUser && memberUser.email) {
      await sendProjectMemberRemovedEmail({
        email: memberUser.email,
        name: memberUser.name,
        projectName: project.name,
        workspaceName: req.workspace?.name || "your workspace",
        removedBy:
          requesterWorkspaceMember?.userId?.name || "A workspace member",
        dashboardUrl: `${process.env.CLIENT_URL || "http://localhost:5173"}/dashboard/projects`,
      });
    }
  } catch (emailError) {
    console.error("Failed to send project member removed email:", emailError);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Member removed successfully."));
};

export const updateProject = async (req, res) => {
  const { projectId, workspaceId } = req.params;
  const {
    name,
    description,
    status,
    priority,
    start_date,
    end_date,
    progress,
  } = req.body;
  const requesterId = req.user.id;

  const project = await projectRepository.updateProjectById(projectId, {
    name,
    description,
    status,
    priority,
    start_date,
    end_date,
    progress,
  });
  if (!project) throw new ApiError(404, "Project not found.");

  return res
    .status(200)
    .json(new ApiResponse(200, project, "Project updated successfully."));
};

export const deleteProject = async (req, res) => {
  const { workspaceId, projectId } = req.params;

  const project = await projectRepository.findProjectById(projectId);
  if (!project) throw new ApiError(404, "Project not found.");

  await projectRepository.deleteProjectById(projectId);
  await projectRepository.pullWorkspaceProject(workspaceId, project._id);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Project deleted successfully."));
};
