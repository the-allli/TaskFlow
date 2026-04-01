import request from "supertest";
import app from "../app.js";
import User from "../db/models/User.modal.js";
import Role from "../db/models/Role.modal.js";
import Workspace from "../db/models/Workspace.modal.js";
import WorkspaceMember from "../db/models/WorkspaceMember.modal.js";
import Project from "../db/models/Project.modal.js";
import ProjectMember from "../db/models/ProjectMember.modal.js";
import Task from "../db/models/Task.modal.js";
import Comment from "../db/models/Comment.modal.js";

describe("Workspace API", () => {
  let adminUser;
  let adminToken;
  let adminRole;

  beforeEach(async () => {
    adminRole = await Role.findOne({ name: "admin" });
    adminUser = new User({
      name: "Admin User",
      email: "admin@example.com",
      password: "password123",
      role: adminRole._id,
      is_varified: true,
    });
    await adminUser.save();
    adminToken = adminUser.generateAccessToken();
  });

  it("should create a new workspace", async () => {
    const response = await request(app)
      .post("/api/workspace/create")
      .set("Cookie", [`jwt_access_token=${adminToken}`])
      .send({
        name: "Test Workspace",
        slug: "test-workspace",
        description: "A workspace for testing",
      });

    expect(response.status).toBe(201);
    expect(response.body.data.name).toBe("Test Workspace");

    const workspace = await Workspace.findOne({ slug: "test-workspace" });
    expect(workspace).toBeTruthy();
    expect(workspace.ownerId.toString()).toBe(adminUser._id.toString());
  });

  it("should get workspaces for the logged in user", async () => {
    const workspace = new Workspace({
      name: "My Workspace",
      slug: "my-workspace",
      ownerId: adminUser._id,
      description: "Description",
      invite_code: "ABCDEF",
    });
    await workspace.save();

    const member = new WorkspaceMember({
      userId: adminUser._id,
      workspaceId: workspace._id,
      role: adminRole._id,
    });
    await member.save();

    const response = await request(app)
      .get("/api/workspace")
      .set("Cookie", [`jwt_access_token=${adminToken}`]);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data[0].name).toBe("My Workspace");
  });

  it("should fail to create workspace if not admin", async () => {
    const devRole = await Role.findOne({ name: "dev" });
    const devUser = new User({
      name: "Dev User",
      email: "dev@example.com",
      password: "password123",
      role: devRole._id,
      is_varified: true,
    });
    await devUser.save();
    const devToken = devUser.generateAccessToken();

    const response = await request(app)
      .post("/api/workspace/create")
      .set("Cookie", [`jwt_access_token=${devToken}`])
      .send({
        name: "Dev Workspace",
        description: "Should fail",
      });

    expect(response.status).toBe(403);
  });

  it("should update workspace settings", async () => {
    const workspace = new Workspace({
      name: "Update Test",
      slug: "update-test",
      ownerId: adminUser._id,
      description: "Description",
      invite_code: "GHIJKL",
    });
    await workspace.save();

    const member = new WorkspaceMember({
      userId: adminUser._id,
      workspaceId: workspace._id,
      role: adminRole._id,
    });
    await member.save();

    const response = await request(app)
      .put(`/api/workspace/${workspace._id}/settings`)
      .set("Cookie", [`jwt_access_token=${adminToken}`])
      .send({
        name: "Updated Workspace Name",
        description: "Updated description",
      });

    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe("Updated Workspace Name");

    const updatedWorkspace = await Workspace.findById(workspace._id);
    expect(updatedWorkspace.name).toBe("Updated Workspace Name");
  });

  it("should delete a workspace", async () => {
    const workspace = new Workspace({
      name: "Delete Test",
      slug: "delete-test",
      ownerId: adminUser._id,
      description: "Description",
      invite_code: "MNOPQR",
    });
    await workspace.save();

    const member = new WorkspaceMember({
      userId: adminUser._id,
      workspaceId: workspace._id,
      role: adminRole._id,
    });
    await member.save();

    const response = await request(app)
      .delete(`/api/workspace/${workspace._id}`)
      .set("Cookie", [`jwt_access_token=${adminToken}`]);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Workspace deleted successfully.");

    const deletedWorkspace = await Workspace.findById(workspace._id);
    expect(deletedWorkspace).toBeNull();
  });

  it("should invite a member to a workspace", async () => {
    const workspace = new Workspace({
      name: "Invite Test",
      slug: "invite-test",
      ownerId: adminUser._id,
      description: "Description",
      invite_code: "STUVWX",
    });
    await workspace.save();

    const member = new WorkspaceMember({
      userId: adminUser._id,
      workspaceId: workspace._id,
      role: adminRole._id,
    });
    await member.save();

    const response = await request(app)
      .post(`/api/workspace/${workspace._id}/invite`)
      .set("Cookie", [`jwt_access_token=${adminToken}`])
      .send({
        email: "new.member@example.com",
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Invitation sent successfully.");
  });

  it("should allow a user to join a workspace", async () => {
    const workspace = new Workspace({
      name: "Join Test",
      slug: "join-test",
      ownerId: adminUser._id,
      description: "Description",
      invite_code: "YZABCD",
    });
    await workspace.save();

    const devRole = await Role.findOne({ name: "dev" });
    const newUser = new User({
      name: "New User",
      email: "new.user@example.com",
      password: "password123",
      role: devRole._id,
      is_varified: true,
    });
    await newUser.save();
    const newUserToken = newUser.generateAccessToken();

    const response = await request(app)
      .post(`/api/workspace/join/${workspace.invite_code}`)
      .set("Cookie", [`jwt_access_token=${newUserToken}`]);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Joined workspace successfully.");

    const member = await WorkspaceMember.findOne({
      userId: newUser._id,
      workspaceId: workspace._id,
    });
    expect(member).toBeTruthy();
  });

  it("should get members of a workspace", async () => {
    const workspace = new Workspace({
      name: "Members Test",
      slug: "members-test",
      ownerId: adminUser._id,
      description: "Description",
      invite_code: "EFGHIJ",
    });
    await workspace.save();

    const member = new WorkspaceMember({
      userId: adminUser._id,
      workspaceId: workspace._id,
      role: adminRole._id,
    });
    await member.save();

    const response = await request(app)
      .get(`/api/workspace/${workspace._id}/members`)
      .set("Cookie", [`jwt_access_token=${adminToken}`]);

    expect(response.status).toBe(200);
    expect(response.body.data.members.length).toBe(1);
    expect(response.body.data.members[0].userId.name).toBe("Admin User");
  });

  it("should remove a member from a workspace", async () => {
    const workspace = new Workspace({
      name: "Remove Member Test",
      slug: "remove-member-test",
      ownerId: adminUser._id,
      description: "Description",
      invite_code: "KLMNO",
    });
    await workspace.save();

    const devRole = await Role.findOne({ name: "dev" });
    const newUser = new User({
      name: "New User",
      email: "new.user.to.remove@example.com",
      password: "password123",
      role: devRole._id,
      is_varified: true,
    });
    await newUser.save();

    const member = new WorkspaceMember({
      userId: newUser._id,
      workspaceId: workspace._id,
      role: devRole._id,
    });
    await member.save();

    const adminMember = new WorkspaceMember({
      userId: adminUser._id,
      workspaceId: workspace._id,
      role: adminRole._id,
    });
    await adminMember.save();

    const response = await request(app)
      .delete(`/api/workspace/${workspace._id}/members/${member._id}`)
      .set("Cookie", [`jwt_access_token=${adminToken}`]);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Member removed successfully.");

    const deletedMember = await WorkspaceMember.findById(member._id);
    expect(deletedMember).toBeNull();
  });

  it("should update a member's role in a workspace", async () => {
    const workspace = new Workspace({
      name: "Update Role Test",
      slug: "update-role-test",
      ownerId: adminUser._id,
      description: "Description",
      invite_code: "PQRST",
    });
    await workspace.save();

    const devRole = await Role.findOne({ name: "dev" });
    const newUser = new User({
      name: "New User",
      email: "new.user.role.update@example.com",
      password: "password123",
      role: devRole._id,
      is_varified: true,
    });
    await newUser.save();

    const member = new WorkspaceMember({
      userId: newUser._id,
      workspaceId: workspace._id,
      role: devRole._id,
    });
    await member.save();

    const adminMember = new WorkspaceMember({
      userId: adminUser._id,
      workspaceId: workspace._id,
      role: adminRole._id,
    });
    await adminMember.save();

    const managerRole = await Role.findOne({ name: "manager" });

    const response = await request(app)
      .patch(`/api/workspace/${workspace._id}/members/${member._id}/role`)
      .set("Cookie", [`jwt_access_token=${adminToken}`])
      .send({ role: "manager" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Member role updated successfully.");

    const updatedMember = await WorkspaceMember.findById(member._id);
    expect(updatedMember.role.toString()).toBe(managerRole._id.toString());
  });

  it("should create a new project in a workspace", async () => {
    const workspace = new Workspace({
      name: "Project Test",
      slug: "project-test",
      ownerId: adminUser._id,
      description: "Description",
      invite_code: "UVWXYZ",
    });
    await workspace.save();

    const member = new WorkspaceMember({
      userId: adminUser._id,
      workspaceId: workspace._id,
      role: adminRole._id,
    });
    await member.save();

    const response = await request(app)
      .post(`/api/workspace/${workspace._id}/projects`)
      .set("Cookie", [`jwt_access_token=${adminToken}`])
      .send({
        name: "Test Project",
        description: "A project for testing",
        team_lead: adminUser._id,
      });

    expect(response.status).toBe(201);
    expect(response.body.data.name).toBe("Test Project");

    const project = await Project.findOne({ name: "Test Project" });
    expect(project).toBeTruthy();
    expect(project.workspaceId.toString()).toBe(workspace._id.toString());
  });

  it("should update a project in a workspace", async () => {
    const workspace = new Workspace({
      name: "Update Project Test",
      slug: "update-project-test",
      ownerId: adminUser._id,
      description: "Description",
      invite_code: "123456",
    });
    await workspace.save();

    const member = new WorkspaceMember({
      userId: adminUser._id,
      workspaceId: workspace._id,
      role: adminRole._id,
    });
    await member.save();

    const project = new Project({
      name: "Test Project",
      description: "A project for testing",
      workspaceId: workspace._id,
      ownerId: adminUser._id,
      team_lead: adminUser._id,
    });
    await project.save();

    const response = await request(app)
      .put(`/api/workspace/${workspace._id}/projects/${project._id}`)
      .set("Cookie", [`jwt_access_token=${adminToken}`])
      .send({
        name: "Updated Project Name",
        description: "Updated project description",
      });

    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe("Updated Project Name");

    const updatedProject = await Project.findById(project._id);
    expect(updatedProject.name).toBe("Updated Project Name");
  });

  it("should delete a project in a workspace", async () => {
    const workspace = new Workspace({
      name: "Delete Project Test",
      slug: "delete-project-test",
      ownerId: adminUser._id,
      description: "Description",
      invite_code: "789012",
    });
    await workspace.save();

    const member = new WorkspaceMember({
      userId: adminUser._id,
      workspaceId: workspace._id,
      role: adminRole._id,
    });
    await member.save();

    const project = new Project({
      name: "Test Project",
      description: "A project for testing",
      workspaceId: workspace._id,
      ownerId: adminUser._id,
      team_lead: adminUser._id,
    });
    await project.save();

    const response = await request(app)
      .delete(`/api/workspace/${workspace._id}/projects/${project._id}`)
      .set("Cookie", [`jwt_access_token=${adminToken}`]);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Project deleted successfully.");

    const deletedProject = await Project.findById(project._id);
    expect(deletedProject).toBeNull();
  });

  it("should add a member to a project", async () => {
    const workspace = new Workspace({
      name: "Add Project Member Test",
      slug: "add-project-member-test",
      ownerId: adminUser._id,
      description: "Description",
      invite_code: "345678",
    });
    await workspace.save();

    const member = new WorkspaceMember({
      userId: adminUser._id,
      workspaceId: workspace._id,
      role: adminRole._id,
    });
    await member.save();

    const project = new Project({
      name: "Test Project",
      description: "A project for testing",
      workspaceId: workspace._id,
      ownerId: adminUser._id,
      team_lead: adminUser._id,
    });
    await project.save();

    const devRole = await Role.findOne({ name: "dev" });
    const newUser = new User({
      name: "New User",
      email: "new.user.project.member@example.com",
      password: "password123",
      role: devRole._id,
      is_varified: true,
    });
    await newUser.save();

    const workspaceMember = new WorkspaceMember({
      userId: newUser._id,
      workspaceId: workspace._id,
      role: devRole._id,
    });
    await workspaceMember.save();

    const response = await request(app)
      .post(`/api/workspace/${workspace._id}/projects/${project._id}/members`)
      .set("Cookie", [`jwt_access_token=${adminToken}`])
      .send({ userId: newUser._id });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Member added successfully.");

    const projectMember = await ProjectMember.findOne({
      userId: newUser._id,
      projectId: project._id,
    });
    expect(projectMember).toBeTruthy();
  });

  it("should remove a member from a project", async () => {
    const workspace = new Workspace({
      name: "Remove Project Member Test",
      slug: "remove-project-member-test",
      ownerId: adminUser._id,
      description: "Description",
      invite_code: "901234",
    });
    await workspace.save();

    const member = new WorkspaceMember({
      userId: adminUser._id,
      workspaceId: workspace._id,
      role: adminRole._id,
    });
    await member.save();

    const project = new Project({
      name: "Test Project",
      description: "A project for testing",
      workspaceId: workspace._id,
      ownerId: adminUser._id,
      team_lead: adminUser._id,
    });
    await project.save();

    const devRole = await Role.findOne({ name: "dev" });
    const newUser = new User({
      name: "New User",
      email: "new.user.to.remove.from.project@example.com",
      password: "password123",
      role: devRole._id,
      is_varified: true,
    });
    await newUser.save();

    const projectMember = new ProjectMember({
      userId: newUser._id,
      projectId: project._id,
    });
    await projectMember.save();

    const response = await request(app)
      .delete(
        `/api/workspace/${workspace._id}/projects/${project._id}/members/${projectMember._id}`,
      )
      .set("Cookie", [`jwt_access_token=${adminToken}`]);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Member removed successfully.");

    const deletedProjectMember = await ProjectMember.findById(
      projectMember._id,
    );
    expect(deletedProjectMember).toBeNull();
  });

  it("should create a new task in a project", async () => {
    const workspace = new Workspace({
      name: "Task Test",
      slug: "task-test",
      ownerId: adminUser._id,
      description: "Description",
      invite_code: "567890",
    });
    await workspace.save();

    const member = new WorkspaceMember({
      userId: adminUser._id,
      workspaceId: workspace._id,
      role: adminRole._id,
    });
    await member.save();

    const project = new Project({
      name: "Test Project",
      description: "A project for testing",
      workspaceId: workspace._id,
      ownerId: adminUser._id,
      team_lead: adminUser._id,
    });
    await project.save();

    const response = await request(app)
      .post(`/api/workspace/${workspace._id}/projects/${project._id}/tasks`)
      .set("Cookie", [`jwt_access_token=${adminToken}`])
      .send({
        title: "Test Task",
        description: "A task for testing",
        assigneeId: adminUser._id,
        due_date: new Date(),
      });

    expect(response.status).toBe(201);
    expect(response.body.data.title).toBe("Test Task");

    const task = await Task.findOne({ title: "Test Task" });
    expect(task).toBeTruthy();
    expect(task.projectId.toString()).toBe(project._id.toString());
  });

  it("should get tasks of a project", async () => {
    const workspace = new Workspace({
      name: "Get Tasks Test",
      slug: "get-tasks-test",
      ownerId: adminUser._id,
      description: "Description",
      invite_code: "112233",
    });
    await workspace.save();

    const member = new WorkspaceMember({
      userId: adminUser._id,
      workspaceId: workspace._id,
      role: adminRole._id,
    });
    await member.save();

    const project = new Project({
      name: "Test Project",
      description: "A project for testing",
      workspaceId: workspace._id,
      ownerId: adminUser._id,
      team_lead: adminUser._id,
    });
    await project.save();

    const task = new Task({
      title: "Test Task",
      description: "A task for testing",
      projectId: project._id,
      workspaceId: workspace._id,
      ownerId: adminUser._id,
      assigneeId: adminUser._id,
      due_date: new Date(),
    });
    await task.save();

    const response = await request(app)
      .get(`/api/workspace/${workspace._id}/projects/${project._id}/tasks`)
      .set("Cookie", [`jwt_access_token=${adminToken}`]);

    expect(response.status).toBe(200);
    expect(response.body.data.tasks.length).toBe(1);
    expect(response.body.data.tasks[0].title).toBe("Test Task");
  });

  it("should update a task's status", async () => {
    const workspace = new Workspace({
      name: "Update Task Status Test",
      slug: "update-task-status-test",
      ownerId: adminUser._id,
      description: "Description",
      invite_code: "445566",
    });
    await workspace.save();

    const member = new WorkspaceMember({
      userId: adminUser._id,
      workspaceId: workspace._id,
      role: adminRole._id,
    });
    await member.save();

    const project = new Project({
      name: "Test Project",
      description: "A project for testing",
      workspaceId: workspace._id,
      ownerId: adminUser._id,
      team_lead: adminUser._id,
    });
    await project.save();

    const task = new Task({
      title: "Test Task",
      description: "A task for testing",
      projectId: project._id,
      workspaceId: workspace._id,
      ownerId: adminUser._id,
      status: "TODO",
      assigneeId: adminUser._id,
      due_date: new Date(),
    });
    await task.save();

    const response = await request(app)
      .patch(
        `/api/workspace/${workspace._id}/projects/${project._id}/tasks/${task._id}/status`,
      )
      .set("Cookie", [`jwt_access_token=${adminToken}`])
      .send({ status: "IN_PROGRESS" });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("IN_PROGRESS");

    const updatedTask = await Task.findById(task._id);
    expect(updatedTask.status).toBe("IN_PROGRESS");
  });

  it("should delete tasks from a project", async () => {
    const workspace = new Workspace({
      name: "Delete Tasks Test",
      slug: "delete-tasks-test",
      ownerId: adminUser._id,
      description: "Description",
      invite_code: "778899",
    });
    await workspace.save();

    const member = new WorkspaceMember({
      userId: adminUser._id,
      workspaceId: workspace._id,
      role: adminRole._id,
    });
    await member.save();

    const project = new Project({
      name: "Test Project",
      description: "A project for testing",
      workspaceId: workspace._id,
      ownerId: adminUser._id,
      team_lead: adminUser._id,
    });
    await project.save();

    const task = new Task({
      title: "Test Task",
      description: "A task for testing",
      projectId: project._id,
      workspaceId: workspace._id,
      ownerId: adminUser._id,
      assigneeId: adminUser._id,
      due_date: new Date(),
    });
    await task.save();

    const response = await request(app)
      .delete(`/api/workspace/${workspace._id}/projects/${project._id}/tasks`)
      .set("Cookie", [`jwt_access_token=${adminToken}`])
      .send({ taskIds: [task._id] });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Tasks deleted successfully.");

    const deletedTask = await Task.findById(task._id);
    expect(deletedTask).toBeNull();
  });

  it("should add a comment to a task", async () => {
    const workspace = new Workspace({
      name: "Comment Test",
      slug: "comment-test",
      ownerId: adminUser._id,
      description: "Description",
      invite_code: "121212",
    });
    await workspace.save();

    const member = new WorkspaceMember({
      userId: adminUser._id,
      workspaceId: workspace._id,
      role: adminRole._id,
    });
    await member.save();

    const project = new Project({
      name: "Test Project",
      description: "A project for testing",
      workspaceId: workspace._id,
      ownerId: adminUser._id,
      team_lead: adminUser._id,
    });
    await project.save();

    const task = new Task({
      title: "Test Task",
      description: "A task for testing",
      projectId: project._id,
      workspaceId: workspace._id,
      ownerId: adminUser._id,
      assigneeId: adminUser._id,
      due_date: new Date(),
    });
    await task.save();

    const response = await request(app)
      .post(`/api/workspace/tasks/${task._id}/comments`)
      .set("Cookie", [`jwt_access_token=${adminToken}`])
      .send({ content: "This is a test comment." });

    expect(response.status).toBe(201);
    expect(response.body.data.content).toBe("This is a test comment.");
    expect(response.body.data.userId._id.toString()).toBe(
      adminUser._id.toString(),
    );
  });

  it("should get comments for a task", async () => {
    const workspace = new Workspace({
      name: "Get Comments Test",
      slug: "get-comments-test",
      ownerId: adminUser._id,
      description: "Description",
      invite_code: "232323",
    });
    await workspace.save();

    const member = new WorkspaceMember({
      userId: adminUser._id,
      workspaceId: workspace._id,
      role: adminRole._id,
    });
    await member.save();

    const project = new Project({
      name: "Test Project",
      description: "A project for testing",
      workspaceId: workspace._id,
      ownerId: adminUser._id,
      team_lead: adminUser._id,
    });
    await project.save();

    const task = new Task({
      title: "Test Task",
      description: "A task for testing",
      projectId: project._id,
      workspaceId: workspace._id,
      ownerId: adminUser._id,
      assigneeId: adminUser._id,
      due_date: new Date(),
    });
    await task.save();

    const comment = new Comment({
      taskId: task._id,
      userId: adminUser._id,
      content: "Test comment content",
    });
    await comment.save();

    const response = await request(app)
      .get(`/api/workspace/tasks/${task._id}/comments`)
      .set("Cookie", [`jwt_access_token=${adminToken}`]);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0].content).toBe("Test comment content");
  });
});
