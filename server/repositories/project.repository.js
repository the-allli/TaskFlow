import Project from "../db/models/Project.modal.js";
import ProjectMember from "../db/models/ProjectMember.modal.js";
import Workspace from "../db/models/Workspace.modal.js";
import WorkspaceMember from "../db/models/WorkspaceMember.modal.js";
import File from "../db/models/File.modal.js";

export const findWorkspaceMember = async (workspaceId, userId) => {
  return await WorkspaceMember.findOne({ workspaceId, userId })
    .populate("role", "name")
    .populate("userId", "name email dp");
};

export const createProject = async (data) => {
  return await Project.create(data);
};

export const findProjectById = async (id) => {
  return await Project.findById(id);
};

export const findProjectByIdPopulated = async (id) => {
  return await Project.findById(id)
    .populate({
      path: "members",
      populate: { path: "userId", select: "name email dp" },
    })
    .populate("team_lead", "name email dp")
    .populate({
      path: "files",
      populate: { path: "uploadedBy", select: "name email dp" },
    });
};

export const updateProjectById = async (id, data) => {
  return await Project.findByIdAndUpdate(id, data, { returnDocument: 'after' }).populate({
    path: "members",
    populate: { path: "userId", select: "name email dp" },
  });
};

export const pushProjectMember = async (projectId, memberId) => {
  return await Project.findByIdAndUpdate(projectId, {
    $push: { members: memberId },
  });
};

export const pushProjectMembers = async (projectId, memberIds) => {
  return await Project.findByIdAndUpdate(projectId, {
    $push: { members: { $each: memberIds } },
  });
};

export const deleteProjectById = async (id) => {
  return await Project.findOneAndDelete({ _id: id });
};

export const createProjectMember = async (data) => {
  return await ProjectMember.create(data);
};

export const findProjectMember = async (projectId, userId) => {
  return await ProjectMember.findOne({ projectId, userId });
};

export const findProjectMemberByIdPopulated = async (id) => {
  return await ProjectMember.findById(id).populate("userId", "name email dp");
};

export const findProjectMemberById = async (id) => {
  return await ProjectMember.findById(id).populate("userId");
};

export const deleteProjectMemberById = async (id) => {
  return await ProjectMember.findByIdAndDelete(id);
};

export const pullProjectMember = async (projectId, memberId) => {
  return await Project.findByIdAndUpdate(projectId, {
    $pull: { members: memberId },
  });
};

export const pushWorkspaceProject = async (workspaceId, projectId) => {
  return await Workspace.findByIdAndUpdate(workspaceId, {
    $push: { projects: projectId },
  });
};

export const pullWorkspaceProject = async (workspaceId, projectId) => {
  return await Workspace.findByIdAndUpdate(workspaceId, {
    $pull: { projects: projectId },
  });
};

export const createFiles = async (filesData) => {
  return await File.insertMany(filesData);
};

export const pullProjectFiles = async (projectId, fileIds) => {
  return await Project.findByIdAndUpdate(projectId, {
    $pull: { files: { $in: fileIds } },
  });
};

export const findProjectsByWorkspace = async (workspaceId) => {
  return await Project.find({ workspaceId });
};

export const deleteProjectMembersByUserInProjects = async (
  userId,
  projectIds,
) => {
  const projectMembers = await ProjectMember.find({
    userId,
    projectId: { $in: projectIds },
  });
  const projectMemberIds = projectMembers.map((pm) => pm._id);

  await ProjectMember.deleteMany({ _id: { $in: projectMemberIds } });

  return projectMemberIds;
};

export const pullProjectMembersFromMany = async (projectIds, memberIds) => {
  return await Project.updateMany(
    { _id: { $in: projectIds } },
    { $pull: { members: { $in: memberIds } } },
  );
};

export const ensureUsersAreProjectMembers = async (projectId, userIds) => {
  const newMembers = [];
  for (const userId of userIds) {
    const exists = await ProjectMember.findOne({ projectId, userId });
    if (!exists) {
      const pm = await ProjectMember.create({ projectId, userId });
      newMembers.push(pm._id);
    }
  }

  if (newMembers.length > 0) {
    await Project.findByIdAndUpdate(projectId, {
      $push: { members: { $each: newMembers } },
    });
  }
};

export const checkUserIsProjectLeadInWorkspace = async (
  workspaceId,
  userId,
) => {
  return await Project.find({ workspaceId, team_lead: userId });
};

export const pushProjectFiles = async (projectId, fileIds) => {
  return await Project.findByIdAndUpdate(projectId, {
    $push: { files: { $each: fileIds } },
  });
};
