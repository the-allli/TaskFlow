import { useState, useRef } from "react";
import { XIcon, PaperclipIcon } from "lucide-react";
import toast from "react-hot-toast";
import useWorkspaceStore from "../../../../store/useWorkspaceStore";
import useAuthStore from "../../../../store/useAuthStore";
import useClickOutside from "../../../../hooks/useClickOutside";

const CreateProjectDialog = ({ isDialogOpen, setIsDialogOpen }) => {
  const { currentWorkspace, addProject } = useWorkspaceStore();
  const { authUser } = useAuthStore();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "PLANNING",
    priority: "MEDIUM",
    start_date: "",
    end_date: "",
    project_members: [],
    team_lead: "",
    progress: 0,
  });
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const modalRef = useRef(null);

  useClickOutside(modalRef, () => {
    if (isDialogOpen) setIsDialogOpen(false);
  });

  const workspaceMembers = currentWorkspace?.members || [];

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    setFiles((prev) => {
      const existingNames = prev.map((f) => f.name);
      const newFiles = selected.filter((f) => !existingNames.includes(f.name));
      return [...prev, ...newFiles];
    });
    e.target.value = "";
  };

  const removeFile = (name) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error("Project name is required.");

    setIsSubmitting(true);
    const workspaceId = currentWorkspace?._id || currentWorkspace?.id;

    const payload = new FormData();
    payload.append("name", formData.name);
    payload.append("description", formData.description);
    payload.append("status", formData.status);
    payload.append("priority", formData.priority);
    payload.append("start_date", formData.start_date || "");
    payload.append("end_date", formData.end_date || "");
    payload.append(
      "team_lead",
      formData.team_lead || authUser?._id || authUser?.id,
    );
    payload.append("progress", formData.progress);
    formData.project_members.forEach((id) =>
      payload.append("project_members", id),
    );
    files.forEach((file) => payload.append("files", file));

    const result = await addProject(workspaceId, payload);

    if (result.success) {
      toast.success("Project created!");
      setFormData({
        name: "",
        description: "",
        status: "PLANNING",
        priority: "MEDIUM",
        start_date: "",
        end_date: "",
        project_members: [],
        team_lead: "",
        progress: 0,
      });
      setFiles([]);
      setIsDialogOpen(false);
    } else {
      toast.error(result.message);
    }
    setIsSubmitting(false);
  };

  const addMember = (userId) => {
    if (userId && !formData.project_members.includes(userId)) {
      setFormData((prev) => ({
        ...prev,
        project_members: [...prev.project_members, userId],
      }));
    }
  };

  const removeMember = (userId) => {
    setFormData((prev) => ({
      ...prev,
      project_members: prev.project_members.filter((id) => id !== userId),
      team_lead: prev.team_lead === userId ? "" : prev.team_lead,
    }));
  };

  const getMemberName = (userId) => {
    const m = workspaceMembers.find(
      (m) => m?.userId?._id === userId || m?.userId?.id === userId,
    );
    return m?.userId?.name || m?.userId?.email || userId;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes}b`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}kb`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}mb`;
  };

  if (!isDialogOpen) return null;

  const selectClass =
    "w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 text-sm cursor-pointer hover:border-blue-400 dark:hover:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_10px_center] pr-8";

  const inputClass =
    "w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-sm";

  return (
    <div className="fixed inset-0 bg-black/20 dark:bg-black/60 backdrop-blur flex items-center justify-center text-left z-50 overflow-y-auto py-6">
      <div
        ref={modalRef}
        className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 w-full max-w-lg text-zinc-900 dark:text-zinc-200 relative my-auto"
      >
        <button
          type="button"
          className="absolute top-3 right-3 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1"
          onClick={() => setIsDialogOpen(false)}
        >
          <XIcon className="size-5" />
        </button>

        <h2 className="text-xl font-medium mb-1">Create New Project</h2>
        {currentWorkspace && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            In workspace:{" "}
            <span className="text-blue-600 dark:text-blue-400">
              {currentWorkspace.name}
            </span>
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Project Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter project name"
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe your project"
              className="w-full px-3 py-2 rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 mt-1 text-sm h-20 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className={selectClass}
              >
                <option value="PLANNING">Planning</option>
                <option value="ACTIVE">Active</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
                className={selectClass}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Start Date</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) =>
                  setFormData({ ...formData, start_date: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">End Date</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) =>
                  setFormData({ ...formData, end_date: e.target.value })
                }
                min={formData.start_date}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Project Lead</label>
            <select
              value={formData.team_lead}
              onChange={(e) => {
                const userId = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  team_lead: userId,
                  project_members: userId
                    ? [...new Set([...prev.project_members, userId])]
                    : prev.project_members,
                }));
              }}
              className={selectClass}
            >
              <option value="">Select lead</option>
              {workspaceMembers.map((member) => {
                const uid = member?.userId?._id || member?.userId?.id;
                return (
                  <option key={uid} value={uid}>
                    {member?.userId?.name} ({member?.userId?.email})
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Project Members</label>
            <select
              value=""
              onChange={(e) => addMember(e.target.value)}
              className={selectClass}
            >
              <option value="">Add project members</option>
              {workspaceMembers
                .filter((m) => {
                  const uid = m?.userId?._id || m?.userId?.id;
                  return !formData.project_members.includes(uid);
                })
                .map((member) => {
                  const uid = member?.userId?._id || member?.userId?.id;
                  return (
                    <option key={uid} value={uid}>
                      {member?.userId?.name} ({member?.userId?.email})
                    </option>
                  );
                })}
            </select>

            {formData.project_members.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.project_members.map((uid) => (
                  <div
                    key={uid}
                    className="flex items-center gap-1 bg-blue-200/50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-md text-sm"
                  >
                    {getMemberName(uid)}
                    <button
                      type="button"
                      onClick={() => removeMember(uid)}
                      className="ml-1 hover:bg-blue-300/30 rounded"
                    >
                      <XIcon className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm mb-1">Attachments</label>
            <label className="flex items-center gap-2 w-full px-3 py-2 rounded border border-dashed border-zinc-300 dark:border-zinc-700 text-sm text-zinc-500 dark:text-zinc-400 cursor-pointer hover:border-blue-400 dark:hover:border-zinc-500 transition-all">
              <PaperclipIcon className="w-4 h-4 shrink-0" />
              <span>Click to attach files</span>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {files.length > 0 && (
              <div className="flex flex-col gap-1.5 mt-2">
                {files.map((file) => (
                  <div
                    key={file.name}
                    className="flex items-center justify-between gap-2 bg-zinc-100 dark:bg-zinc-800/70 px-3 py-1.5 rounded-md text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <PaperclipIcon className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                      <span className="truncate text-zinc-700 dark:text-zinc-300">
                        {file.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-zinc-400 text-xs">
                        {formatFileSize(file.size)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(file.name)}
                        className="text-zinc-400 hover:text-red-500 transition-colors"
                      >
                        <XIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2 text-sm">
            <button
              type="button"
              onClick={() => setIsDialogOpen(false)}
              className="px-4 py-2 rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !currentWorkspace}
              className="px-4 py-2 rounded bg-linear-to-br from-blue-500 to-blue-600 text-white disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectDialog;
