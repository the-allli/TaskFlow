export class WorkspaceDto {
  constructor(workspace, planLimitsMetadata = null) {
    this._id = workspace._id;
    this.name = workspace.name;
    this.slug = workspace.slug;
    this.description = workspace.description || null;
    this.image_url = workspace.image_url || "";
    this.invite_code = workspace.invite_code || "";
    this.cloudinary_id = workspace.cloudinary_id || "";
    this.ownerId = workspace.ownerId;
    this.subscriptionId = workspace.subscriptionId || null;
    this.members = workspace.members
      ? workspace.members.map((m) =>
          m._id && typeof m === "object" && m.role
            ? new WorkspaceMemberDto(m)
            : m,
        )
      : [];
    this.projects = workspace.projects || [];
    this.createdAt = workspace.createdAt;
    this.updatedAt = workspace.updatedAt;
    this._planLimits = planLimitsMetadata;
  }
}

export class WorkspaceMemberDto {
  constructor(member) {
    this._id = member._id;
    this.role = member.role;
    this.workspaceId = member.workspaceId;
    this.userId =
      member.userId && typeof member.userId === "object"
        ? {
            _id: member.userId._id,
            name: member.userId.name,
            email: member.userId.email,
            dp: member.userId.dp || "",
          }
        : member.userId;
    this.createdAt = member.createdAt;
    this.updatedAt = member.updatedAt;
  }
}
