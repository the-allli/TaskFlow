import User from "../db/models/User.modal.js";
import Workspace from "../db/models/Workspace.modal.js";
import WorkspaceMember from "../db/models/WorkspaceMember.modal.js";
import WorkspaceInvite from "../db/models/WorkspaceInvite.modal.js";
import Subscription from "../db/models/Subscription.modal.js";

export const countOwnedWorkspaces = async (ownerId) => {
  return await Workspace.countDocuments({ ownerId });
};

export const countWorkspaceMembers = async (workspaceId) => {
  return await WorkspaceMember.countDocuments({ workspaceId });
};

export const getOwnerSubscription = async (ownerId) => {
  return await Subscription.findOne({ adminId: ownerId, status: "active" });
};

export const updateSubscriptionByOwner = async (ownerId, data) => {
  return await Subscription.findOneAndUpdate(
    { adminId: ownerId },
    { $set: data },
    { returnDocument: "after", upsert: true },
  );
};

export const findWorkspaceBySlug = async (slug) => {
  return await Workspace.findOne({ slug });
};

export const findWorkspaceById = async (id) => {
  return await Workspace.findById(id);
};

export const findWorkspaceByInviteCode = async (invite_code) => {
  return await Workspace.findOne({ invite_code });
};

export const createWorkspace = async (data) => {
  return await Workspace.create(data);
};

export const updateWorkspaceById = async (id, data) => {
  return await Workspace.findByIdAndUpdate(id, data, { returnDocument: 'after' });
};

export const pushWorkspaceMember = async (workspaceId, memberId) => {
  return await Workspace.findByIdAndUpdate(workspaceId, {
    $push: { members: memberId },
  });
};

export const pullWorkspaceMember = async (workspaceId, memberId) => {
  return await Workspace.findByIdAndUpdate(workspaceId, {
    $pull: { members: memberId },
  });
};

export const deleteWorkspaceById = async (id) => {
  return await Workspace.findOneAndDelete({ _id: id });
};

export const findWorkspacesByIds = async (ids) => {
  return await Workspace.find({ _id: { $in: ids } })
    .populate({
      path: "members",
      populate: [
        { path: "userId", select: "name email dp" },
        { path: "role", select: "name" },
      ],
    })
    .populate({
      path: "subscriptionId",
      populate: { path: "planId" },
    })
    .populate({
      path: "projects",
      populate: [
        {
          path: "members",
          populate: { path: "userId", select: "name email dp" },
        },
        {
          path: "tasks",
          populate: { path: "assignees", select: "name email dp" },
        },
        {
          path: "files",
          populate: { path: "uploadedBy", select: "name email dp" },
        },
      ],
    });
};
export const findMemberById = async (id) => {
  return await WorkspaceMember.findById(id).populate("role", "name");
};

export const findMember = async (workspaceId, userId) => {
  return await WorkspaceMember.findOne({ workspaceId, userId }).populate(
    "role",
    "name",
  );
};

export const findMembersByWorkspace = async (workspaceId) => {
  return await WorkspaceMember.find({ workspaceId })
    .populate("userId", "name email dp")
    .populate("role", "name");
};

export const createMember = async (data) => {
  return await WorkspaceMember.create(data);
};

export const deleteMemberById = async (id) => {
  return await WorkspaceMember.findByIdAndDelete(id);
};

export const findMembershipsByUser = async (userId) => {
  return await WorkspaceMember.find({ userId });
};

export const findUserById = async (id) => {
  return await User.findById(id);
};

export const findUserByEmail = async (email) => {
  return await User.findOne({ email });
};

// Workspace Invite Repository Functions
export const findInviteByWorkspaceAndEmail = async (workspaceId, email) => {
  return await WorkspaceInvite.findOne({ workspaceId, email })
    .populate("role", "name")
    .populate("invitedBy", "name email");
};

export const findInviteById = async (id) => {
  return await WorkspaceInvite.findById(id)
    .populate("role", "name")
    .populate("invitedBy", "name email");
};

export const findPendingInvitesByWorkspace = async (workspaceId) => {
  return await WorkspaceInvite.find({ workspaceId, status: "pending" })
    .populate("role", "name")
    .populate("invitedBy", "name email")
    .sort({ sentAt: -1 });
};

export const createInvite = async (data) => {
  return await WorkspaceInvite.create(data);
};

export const updateInvite = async (id, data) => {
  return await WorkspaceInvite.findByIdAndUpdate(id, data, { 
    new: true,
    runValidators: true 
  })
    .populate("role", "name")
    .populate("invitedBy", "name email");
};

export const markInviteAsAccepted = async (workspaceId, email) => {
  return await WorkspaceInvite.findOneAndUpdate(
    { workspaceId, email },
    { 
      status: "accepted",
      acceptedAt: new Date() 
    },
    { new: true }
  );
};

export const deleteInvite = async (id) => {
  return await WorkspaceInvite.findByIdAndDelete(id);
};
