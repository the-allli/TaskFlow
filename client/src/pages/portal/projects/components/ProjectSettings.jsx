import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Plus, Save, Trash2, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AddProjectMember from "./AddProjectMember";
import useWorkspaceStore from "../../../../store/useWorkspaceStore";
import useAuthStore from "../../../../store/useAuthStore";

export default function ProjectSettings({ project }) {
  const {
    currentWorkspace,
    updateProject,
    deleteProject,
    removeProjectMember,
  } = useWorkspaceStore();
  const { authUser } = useAuthStore();
  const navigate = useNavigate();

  const myMembership = currentWorkspace?.members?.find(
    (m) => m?.userId?._id === authUser?._id || m?.userId?._id === authUser?.id,
  );
  const roleName = myMembership?.role?.name;
  const isWorkspaceAdmin = roleName === "admin";
  const isAdminOrManager = ["admin", "manager"].includes(roleName);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "PLANNING",
    priority: "MEDIUM",
    start_date: "",
    end_date: "",
    progress: 0,
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || "",
        description: project.description || "",
        status: project.status || "PLANNING",
        priority: project.priority || "MEDIUM",
        start_date: project.start_date || "",
        end_date: project.end_date || "",
        progress: project.progress || 0,
      });
    }
  }, [project]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const workspaceId = currentWorkspace?.id || currentWorkspace?._id;
    const projectId = project?._id || project?.id;
    const result = await updateProject(workspaceId, projectId, formData);
    if (result.success) toast.success("Project updated!");
    else toast.error(result.message);
    setIsSubmitting(false);
  };

  const handleDeleteProject = async () => {
    if (deleteInput !== project?.name) {
      return toast.error("Project name doesn't match.");
    }
    setIsDeleting(true);
    const workspaceId = currentWorkspace?.id || currentWorkspace?._id;
    const projectId = project?._id || project?.id;
    const result = await deleteProject(workspaceId, projectId);
    if (result.success) {
      toast.success("Project deleted.");
      navigate("/dashboard/projects");
    } else {
      toast.error(result.message);
      setIsDeleting(false);
    }
  };

  const canRemoveMember = (memberUserId) => {
    if (project.team_lead?.toString() === memberUserId?.toString()) {
      return false;
    }

    const currentUserId = authUser?._id || authUser?.id;
    if (currentUserId?.toString() === memberUserId?.toString()) {
      return false;
    }

    if (isWorkspaceAdmin) {
      return true;
    }

    if (roleName === "manager") {
      const memberWorkspaceMembership = currentWorkspace?.members?.find(
        (m) =>
          m?.userId?._id?.toString() === memberUserId?.toString() ||
          m?.userId?.id?.toString() === memberUserId?.toString(),
      );
      const memberRole = memberWorkspaceMembership?.role?.name;
      return memberRole === "dev";
    }

    return false;
  };

  const handleRemoveMember = async (memberId, memberUserId, memberName) => {
    if (!canRemoveMember(memberUserId)) {
      toast.error("You don't have permission to remove this member.");
      return;
    }

    if (project.team_lead?.toString() === memberUserId?.toString()) {
      toast.error("Cannot remove the project team lead.");
      return;
    }

    if (confirm(`Remove ${memberName} from this project?`)) {
      const workspaceId = currentWorkspace?.id || currentWorkspace?._id;
      const projectId = project?._id || project?.id;
      const result = await removeProjectMember(
        workspaceId,
        projectId,
        memberId,
      );
      if (result.success) {
        toast.success(`${memberName} removed from project.`);
      } else {
        toast.error(result.message);
      }
    }
  };

  const formatDate = (date) => {
    if (!date) return "";
    try {
      return format(new Date(date), "yyyy-MM-dd");
    } catch {
      return "";
    }
  };

  const inputClasses =
    "w-full px-3 py-2 rounded mt-2 border text-sm dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-300 focus:outline-none focus:border-blue-500";
  const selectClasses =
    "w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 text-sm cursor-pointer hover:border-blue-400 dark:hover:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_10px_center] pr-8 mt-2";
  const cardClasses =
    "rounded-lg border p-6 dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border-zinc-300 dark:border-zinc-800";
  const labelClasses = "text-sm text-zinc-600 dark:text-zinc-400";

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div className={cardClasses}>
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-300 mb-4">
          Project Details
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className={labelClasses}>Project Name</label>
            <input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={inputClasses}
              required
            />
          </div>

          <div className="space-y-2">
            <label className={labelClasses}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className={inputClasses + " h-24 resize-none"}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={labelClasses}>Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className={selectClasses}
              >
                <option value="PLANNING">Planning</option>
                <option value="ACTIVE">Active</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className={labelClasses}>Priority</label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
                className={selectClasses}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={labelClasses}>Start Date</label>
              <input
                type="date"
                value={formatDate(formData.start_date)}
                onChange={(e) =>
                  setFormData({ ...formData, start_date: e.target.value })
                }
                className={inputClasses}
              />
            </div>
            <div className="space-y-2">
              <label className={labelClasses}>End Date</label>
              <input
                type="date"
                value={formatDate(formData.end_date)}
                onChange={(e) =>
                  setFormData({ ...formData, end_date: e.target.value })
                }
                className={inputClasses}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className={labelClasses}>
              Progress: {formData.progress}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={formData.progress}
              onChange={(e) =>
                setFormData({ ...formData, progress: Number(e.target.value) })
              }
              className="w-full accent-blue-500 dark:accent-blue-400"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="ml-auto flex items-center text-sm justify-center gap-2 bg-linear-to-br from-blue-500 to-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            <Save className="size-4" />
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      <div className="space-y-6">
        <div className={cardClasses}>
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-300">
              Project Members{" "}
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                ({project?.members?.length || 0})
              </span>
            </h2>
            {isAdminOrManager && (
              <button
                type="button"
                onClick={() => setIsDialogOpen(true)}
                className="p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <Plus className="size-4 text-zinc-900 dark:text-zinc-300" />
              </button>
            )}
            <AddProjectMember
              isDialogOpen={isDialogOpen}
              setIsDialogOpen={setIsDialogOpen}
            />
          </div>

          {project?.members?.length > 0 ? (
            <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
              {project.members.map((member, index) => {
                const user = member?.userId;
                const name = user?.name || "Unknown";
                const email = user?.email || "Unknown";
                const uid = user?._id || user?.id;
                const isLead =
                  project.team_lead?.toString() === uid?.toString() ||
                  project.team_lead === uid;
                const canRemove = canRemoveMember(uid);

                return (
                  <div
                    key={member._id || index}
                    className="flex items-center justify-between px-3 py-2 rounded dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-300"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={user?.dp || "/default-avatar.png"}
                        className="size-6 rounded-full object-cover bg-zinc-200 dark:bg-zinc-700"
                        alt={name}
                      />
                      <div>
                        <p className="font-medium">{name}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isLead && (
                        <span className="text-xs px-2 py-0.5 rounded ring ring-zinc-200 dark:ring-zinc-600">
                          Project Lead
                        </span>
                      )}
                      {canRemove && !isLead && (
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveMember(member._id, uid, name)
                          }
                          className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-500/20 transition"
                          title="Remove member"
                        >
                          <Trash2 className="size-4 text-red-500" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
              No members yet.
            </p>
          )}
        </div>

        {isWorkspaceAdmin && (
          <div className="border border-red-200 dark:border-red-500/20 rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-red-500">Danger Zone</h2>

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-white">
                  Delete this project
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Permanently deletes the project, all tasks and members. This
                  cannot be undone.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-md text-sm border border-red-300 dark:border-red-500/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
              >
                <Trash2 className="size-4" /> Delete
              </button>
            </div>

            {showDeleteConfirm && (
              <div className="space-y-3 border-t border-red-100 dark:border-red-500/10 pt-4">
                <div className="flex items-center gap-2 text-sm text-red-500">
                  <AlertTriangle className="size-4 shrink-0" />
                  Type{" "}
                  <span className="font-semibold mx-1">
                    "{project?.name}"
                  </span>{" "}
                  to confirm.
                </div>
                <input
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder={project?.name}
                  className="w-full rounded-md border border-red-300 dark:border-red-500/30 bg-transparent text-zinc-900 dark:text-white text-sm px-3 py-2 focus:outline-none focus:border-red-500"
                />
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteInput("");
                    }}
                    className="px-4 py-2 rounded-md text-sm border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteProject}
                    disabled={isDeleting || deleteInput !== project?.name}
                    className="flex items-center gap-2 px-4 py-2 rounded-md text-sm bg-red-500 hover:bg-red-600 text-white transition disabled:opacity-50"
                  >
                    <Trash2 className="size-4" />
                    {isDeleting ? "Deleting..." : "Confirm Delete"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
