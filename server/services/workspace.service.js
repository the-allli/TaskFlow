import cloudinary from "../config/cloudinary.config.js";
import uploadToCloudinary from "../lib/cloudinary.js";
import { sendInviteEmail } from "../lib/nodemailer/emails.js";
import ApiError from "../utils/api_error.js";
import ApiResponse from "../utils/api_response.js";
import * as workspaceRepository from "../repositories/workspace.repository.js";
import * as projectRepository from "../repositories/project.repository.js";
import * as taskRepository from "../repositories/task.repository.js";
import { findRoleByName } from "../repositories/auth.repository.js";
import { WorkspaceDto, WorkspaceMemberDto } from "../db/dtos/workspace.DTO.js";
import {
  getPlanLimitsForAdmin,
  filterWorkspacesByPlan,
  filterMembersByPlan,
  filterProjectsByPlan,
  filterTasksByPlan,
  createPlanLimitsResponse,
} from "../utils/plan_enforcement.js";

export const getWorkspaces = async (req, res) => {
  const memberships = await workspaceRepository.findMembershipsByUser(
    req.user.id,
  );
  const workspaceIds = memberships.map((m) => m.workspaceId);
  const workspaces =
    await workspaceRepository.findWorkspacesByIds(workspaceIds);

  const processedWorkspaces = [];
  const workspaceMetadataMap = new Map();

  for (const workspace of workspaces) {
    const ownerId = workspace.ownerId?._id?.toString() || workspace.ownerId?.toString();
    const planInfo = await getPlanLimitsForAdmin(ownerId);

    const ownerIdStr = ownerId?.toString();

    const membersResult = filterMembersByPlan(
      workspace.members || [],
      planInfo.limits,
      ownerIdStr
    );

    const projectsResult = filterProjectsByPlan(
      workspace.projects || [],
      planInfo.limits
    );

    const filteredProjectsWithTasks = projectsResult.filteredItems.map((project) => {
      const tasksResult = filterTasksByPlan(
        project.tasks || [],
        planInfo.limits
      );
      return {
        ...project.toObject(),
        tasks: tasksResult.filteredItems,
      };
    });

    const filteredWorkspace = {
      ...workspace.toObject(),
      members: membersResult.filteredItems,
      projects: filteredProjectsWithTasks,
    };

    workspaceMetadataMap.set(workspace._id.toString(), {
      members: membersResult.metadata,
      projects: projectsResult.metadata,
      planInfo,
    });

    processedWorkspaces.push(filteredWorkspace);
  }

  const workspacesByOwner = new Map();
  for (const workspace of processedWorkspaces) {
    const ownerId = workspace.ownerId?._id?.toString() || workspace.ownerId?.toString();
    if (!workspacesByOwner.has(ownerId)) {
      workspacesByOwner.set(ownerId, []);
    }
    workspacesByOwner.get(ownerId).push(workspace);
  }

  const finalWorkspaces = [];
  for (const [ownerId, ownerWorkspaces] of workspacesByOwner) {
    const planInfo = await getPlanLimitsForAdmin(ownerId);
    const workspacesResult = filterWorkspacesByPlan(
      ownerWorkspaces,
      planInfo.limits
    );

    for (const workspace of workspacesResult.filteredItems) {
      const wsMetadata = workspaceMetadataMap.get(workspace._id.toString());
      const planLimitsMetadata = createPlanLimitsResponse(
        wsMetadata?.planInfo?.plan || planInfo.plan,
        wsMetadata?.planInfo?.planKey || planInfo.planKey,
        planInfo.limits,
        {
          workspaces: workspacesResult.metadata,
          members: wsMetadata?.members,
          projects: wsMetadata?.projects,
        }
      );

      finalWorkspaces.push(new WorkspaceDto(workspace, planLimitsMetadata));
    }
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      finalWorkspaces,
      "Workspaces fetched successfully.",
    ),
  );
};

export const createWorkspace = async (req, res) => {
  const { name, slug, description } = req.body;
  const ownerId = req.user.id;

  const existing = await workspaceRepository.findWorkspaceBySlug(slug);
  if (existing) throw new ApiError(400, "Slug already taken.");

  let uploadedImageUrl = "";
  let cloudinary_id = "";

  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer);
    uploadedImageUrl = result.secure_url;
    cloudinary_id = result.public_id;
  }
  const invite_code = Math.floor(100000 + Math.random() * 900000);

  const subscription = await workspaceRepository.getOwnerSubscription(ownerId);

  const workspace = await workspaceRepository.createWorkspace({
    name,
    slug,
    description,
    image_url: uploadedImageUrl,
    cloudinary_id,
    invite_code,
    ownerId,
    subscriptionId: subscription?._id || null,
  });

  const role = await findRoleByName("admin");
  if (!role) throw new ApiError(400, "Invalid role");

  const member = await workspaceRepository.createMember({
    role: role._id,
    userId: ownerId,
    workspaceId: workspace._id,
  });

  await workspaceRepository.pushWorkspaceMember(workspace._id, member._id);

  const planInfo = await getPlanLimitsForAdmin(ownerId);

  const populatedWorkspaces = await workspaceRepository.findWorkspacesByIds([workspace._id]);
  const populatedWorkspace = populatedWorkspaces[0];

  const membersResult = filterMembersByPlan(
    populatedWorkspace?.members || [],
    planInfo.limits,
    ownerId
  );

  const workspaceWithFilteredMembers = {
    ...populatedWorkspace.toObject(),
    members: membersResult.filteredItems,
  };

  const planLimitsMetadata = createPlanLimitsResponse(
    planInfo.plan,
    planInfo.planKey,
    planInfo.limits,
    {
      members: membersResult.metadata,
    }
  );

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        new WorkspaceDto(workspaceWithFilteredMembers, planLimitsMetadata),
        "Workspace created successfully.",
      ),
    );
};

export const getMembers = async (req, res) => {
  const { workspaceId } = req.params;

  const workspace = await workspaceRepository.findWorkspaceById(workspaceId);
  if (!workspace) throw new ApiError(404, "Workspace not found.");

  const members = await workspaceRepository.findMembersByWorkspace(workspaceId);

  const ownerId = workspace.ownerId?.toString();
  const planInfo = await getPlanLimitsForAdmin(ownerId);

  const membersResult = filterMembersByPlan(members, planInfo.limits, ownerId);

  const planLimitsMetadata = createPlanLimitsResponse(
    planInfo.plan,
    planInfo.planKey,
    planInfo.limits,
    {
      members: membersResult.metadata,
    }
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        members: membersResult.filteredItems.map((m) => new WorkspaceMemberDto(m)),
        _planLimits: planLimitsMetadata,
      },
      "Members fetched successfully.",
    ),
  );
};

export const inviteMember = async (req, res) => {
  const { workspaceId } = req.params;
  const { email, role } = req.body;
  const requesterId = req.user.id;

  const workspace = await workspaceRepository.findWorkspaceById(workspaceId);
  if (!workspace) throw new ApiError(404, "Workspace not found.");

  const existingUser = await workspaceRepository.findUserByEmail(email);
  if (existingUser) {
    const alreadyMember = await workspaceRepository.findMember(
      workspaceId,
      existingUser._id,
    );
    if (alreadyMember) throw new ApiError(400, "User is already a member.");
  }

  const inviter = await workspaceRepository.findUserById(requesterId);
  const inviteLink = `${process.env.CLIENT_URL}/dashboard/team/join/${workspace.invite_code}`;

  await sendInviteEmail({
    to: email,
    workspaceName: workspace.name,
    inviteLink,
    invitedByName: inviter.name,
    role,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Invitation sent successfully."));
};

export const join_workspace = async (req, res) => {
  const { invite_code } = req.params;
  const userId = req.user.id;

  const workspace =
    await workspaceRepository.findWorkspaceByInviteCode(invite_code);
  if (!workspace) throw new ApiError(404, "Invalid invite link.");

  const alreadyMember = await workspaceRepository.findMember(
    workspace._id,
    userId,
  );
  if (alreadyMember)
    throw new ApiError(400, "You are already a member of this workspace.");

  const role = req.query.role || "dev";
  const urole = await findRoleByName(role);
  if (!urole) throw new ApiError(400, "Invalid role");

  const member = await workspaceRepository.createMember({
    role: urole._id,
    userId,
    workspaceId: workspace._id,
  });

  await workspaceRepository.pushWorkspaceMember(workspace._id, member._id);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { workspaceId: workspace._id },
        "Joined workspace successfully.",
      ),
    );
};

export const removeMember = async (req, res) => {
  const { workspaceId, memberId } = req.params;
  const requesterId = req.user.id;

  const memberToRemove = await workspaceRepository.findMemberById(memberId);
  if (!memberToRemove) throw new ApiError(404, "Member not found.");

  const userId = memberToRemove.userId._id || memberToRemove.userId;

  if (userId.toString() === requesterId) {
    throw new ApiError(400, "You cannot remove yourself.");
  }

  if (memberToRemove.role.name === "admin") {
    throw new ApiError(400, "Cannot remove another admin.");
  }

  const projectsLedByUser =
    await projectRepository.checkUserIsProjectLeadInWorkspace(
      workspaceId,
      userId,
    );
  if (projectsLedByUser.length > 0) {
    throw new ApiError(
      400,
      `Cannot remove member as they are the lead of ${projectsLedByUser.length} project(s). Reassign project leads first.`,
    );
  }

  const workspaceProjects =
    await projectRepository.findProjectsByWorkspace(workspaceId);
  const projectIds = workspaceProjects.map((p) => p._id);

  if (projectIds.length > 0) {
    const removedProjectMemberIds =
      await projectRepository.deleteProjectMembersByUserInProjects(
        userId,
        projectIds,
      );

    if (removedProjectMemberIds.length > 0) {
      await projectRepository.pullProjectMembersFromMany(
        projectIds,
        removedProjectMemberIds,
      );
    }

    await taskRepository.clearAssigneeForUserInProjects(userId, projectIds);
  }

  await workspaceRepository.deleteMemberById(memberId);
  await workspaceRepository.pullWorkspaceMember(workspaceId, memberId);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Member removed successfully."));
};

export const updateWorkspace = async (req, res) => {
  const { workspaceId } = req.params;
  const { name, description } = req.body;

  const workspace = await workspaceRepository.findWorkspaceById(workspaceId);
  if (!workspace) throw new ApiError(404, "Workspace not found.");

  if (req.file) {
    if (workspace.cloudinary_id) {
      await cloudinary.uploader.destroy(workspace.cloudinary_id);
    }

    const result = await uploadToCloudinary(req.file.buffer);
    workspace.image_url = result.secure_url;
    workspace.cloudinary_id = result.public_id;
  }

  if (name) workspace.name = name;
  if (description !== undefined) workspace.description = description;

  await workspace.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        new WorkspaceDto(workspace),
        "Workspace updated successfully.",
      ),
    );
};

export const deleteWorkspace = async (req, res) => {
  const { workspaceId } = req.params;

  const workspace = await workspaceRepository.findWorkspaceById(workspaceId);
  if (!workspace) throw new ApiError(404, "Workspace not found.");

  await workspaceRepository.deleteWorkspaceById(workspaceId);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Workspace deleted successfully."));
};

export const updateMemberRole = async (req, res) => {
  const { workspaceId, memberId } = req.params;
  const { role } = req.body;

  if (!role) throw new ApiError(400, "Role is required.");

  const member = await workspaceRepository.findMemberById(memberId);
  if (!member) throw new ApiError(404, "Member not found.");

  const roleDoc = await findRoleByName(role);
  if (!roleDoc) throw new ApiError(400, "Invalid role.");

  member.role = roleDoc._id;
  await member.save();

  await member.populate("role");
  await member.populate("userId");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        new WorkspaceMemberDto(member),
        "Member role updated successfully.",
      ),
    );
};
