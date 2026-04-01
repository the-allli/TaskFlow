import { useState, useEffect, useRef } from "react";
import { Calendar as CalendarIcon, X } from "lucide-react"; // or lucide-react
import toast from "react-hot-toast";
import { format } from "date-fns";
import useWorkspaceStore from "../../../../store/useWorkspaceStore";
import useAuthStore from "../../../../store/useAuthStore";
import { usePlanLimits } from "../../../../hooks/usePlanLimits";
import useClickOutside from "../../../../hooks/useClickOutside";

export default function CreateTaskDialog({
  showCreateTask,
  setShowCreateTask,
  projects = [],
  projectId = null,
}) {
  const { currentWorkspace, addTask } = useWorkspaceStore();
  const { authUser } = useAuthStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || "");

  const modalRef = useRef(null);
  useClickOutside(modalRef, () => {
    if (showCreateTask) setShowCreateTask(false);
  });

  useEffect(() => {
    if (projectId) {
      setSelectedProjectId(projectId);
    }
  }, [projectId]);

  const project = projects?.find(
    (p) =>
      p._id === selectedProjectId ||
      p.id === selectedProjectId ||
      p._id?.toString() === selectedProjectId,
  );

  const { canCreate, plan } = usePlanLimits();
  const projectMembers = project?.members || [];
  const teamLeadId = project?.team_lead;
  const assignableMembers = projectMembers.filter(
    (m) => {
      const memberId = m?.userId?._id || m?.userId?.id;
      return teamLeadId?.toString() !== memberId?.toString();
    },
  );

  const canCreateTaskByPlan = project
    ? canCreate("maxTasksInAProject", project.tasks?.length || 0)
    : true;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "TASK",
    status: "TODO",
    priority: "MEDIUM",
    assignees: [],
    due_date: "",
  });

  const toggleAssignee = (userId) => {
    setFormData((prev) => {
      const assignees = prev.assignees.includes(userId)
        ? prev.assignees.filter((id) => id !== userId)
        : [...prev.assignees, userId];
      return { ...prev, assignees };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) return toast.error("Title is required.");
    if (!formData.due_date) return toast.error("Due date is required.");

    const finalProjectId = projectId || selectedProjectId;
    if (!finalProjectId) return toast.error("Please select a project.");

    if (!canCreateTaskByPlan) {
      return toast.error(
        `Task limit reached for ${plan} plan. Please upgrade to add more tasks.`,
      );
    }

    setIsSubmitting(true);
    const workspaceId = currentWorkspace?._id || currentWorkspace?.id;

    const result = await addTask(workspaceId, finalProjectId, {
      ...formData,
      assignees: formData.assignees.length > 0 ? formData.assignees : [],
    });

    if (result.success) {
      toast.success("Task created!");
      setFormData({
        title: "",
        description: "",
        type: "TASK",
        status: "TODO",
        priority: "MEDIUM",
        assignees: [],
        due_date: "",
      });
      if (!projectId) setSelectedProjectId("");
      setShowCreateTask(false);
    } else {
      toast.error(result.message);
    }
    setIsSubmitting(false);
  };

  const selectClass =
    "mt-1 w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 text-sm cursor-pointer hover:border-blue-400 dark:hover:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%236b7280%22 stroke-width=%222%22%3E%3Cpath d=%22M6 9l6 6 6-6%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_10px_center] pr-8";

  if (!showCreateTask) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/60 backdrop-blur p-4">
      <div
        ref={modalRef}
        className="relative bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] flex flex-col text-zinc-900 dark:text-white"
      >
        <div className="p-6 pb-4 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
          <button
            onClick={() => setShowCreateTask(false)}
            className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="size-5" />
          </button>

          <h2 className="text-xl font-bold mb-1">Create New Task</h2>

          {selectedProjectId && !canCreateTaskByPlan && (
            <p className="text-xs text-amber-500 mt-2 p-2 bg-amber-50 dark:bg-amber-500/10 rounded-md border border-amber-200 dark:border-amber-500/20">
              Task limit reached for {plan} plan. <br />
              <a
                href="/dashboard/payment"
                className="font-bold underline hover:text-amber-600"
              >
                Upgrade your plan
              </a>{" "}
              to add more tasks.
            </p>
          )}

          {project && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
              In project:{" "}
              <span className="text-blue-500 font-medium">{project.name}</span>
            </p>
          )}
        </div>

        <div className="overflow-y-auto flex-1 p-6 pt-4">
          <div className="space-y-4">
          {!projectId && (
            <div className="space-y-1">
              <label className="text-sm font-medium">Project</label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className={selectClass}
                required
              >
                <option value="">Select Project</option>
                {projects?.map((proj) => {
                  const pid = proj._id || proj.id;
                  return (
                    <option key={pid} value={pid}>
                      {proj.name}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium">Title</label>
            <input
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Task title"
              className="w-full rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe the task"
              className="w-full rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm mt-1 h-20 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Type</label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className={selectClass}
              >
                <option value="TASK">Task</option>
                <option value="BUG">Bug</option>
                <option value="FEATURE">Feature</option>
                <option value="IMPROVEMENT">Improvement</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Priority</label>
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
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Assignees</label>
            <div className="mt-1 border border-zinc-300 dark:border-zinc-700 rounded-md p-2 max-h-32 overflow-y-auto space-y-1 bg-white dark:bg-zinc-900 transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
              {assignableMembers.length > 0 ? (
                assignableMembers.map((member) => {
                  const uid = member?.userId?._id || member?.userId?.id;
                  const name = member?.userId?.name || "Unknown";
                  const isSelected = formData.assignees.includes(uid);

                  return (
                    <label
                      key={uid}
                      className="flex items-center gap-2 p-1 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleAssignee(uid)}
                        className="size-3.5 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 transition-all"
                      />
                      <div className="flex items-center gap-2 truncate">
                        <img
                          src={member?.userId?.dp || "/default-avatar.png"}
                          className="size-5 rounded-full object-cover"
                          alt=""
                        />
                        <span className="text-sm truncate">{name}</span>
                      </div>
                    </label>
                  );
                })
              ) : (
                <p className="text-xs text-zinc-500 p-2 italic text-center">
                  No project members to assign
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Status</label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              className={selectClass}
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Due Date</label>
            <div className="flex items-center gap-2 mt-1 relative">
              <CalendarIcon className="absolute left-3 size-4 text-zinc-500 dark:text-zinc-400 pointer-events-none" />
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    due_date: e.target.value,
                  })
                }
                min={new Date().toISOString().split("T")[0]}
                className="w-full rounded dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
            </div>

            {formData.due_date && (
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 uppercase font-semibold">
                Scheduled for: {format(new Date(formData.due_date), "PPP")}
              </p>
            )}
          </div>

          </div>
        </div>

        <div className="p-6 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex-shrink-0">
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreateTask(false)}
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-5 py-2 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                isSubmitting || (selectedProjectId && !canCreateTaskByPlan)
              }
              className="rounded-lg px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Create Task"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
