import { format } from "date-fns";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CalendarIcon,
  MessageCircle,
  PenIcon,
  Info,
  Send,
  User,
  Layout,
  ArrowUpCircle,
  CheckCircle2,
  Clock,
  ArrowLeftIcon,
  X,
  Save,
} from "lucide-react";
import useWorkspaceStore from "../../../store/useWorkspaceStore";
import useAuthStore from "../../../store/useAuthStore";
import { axiosInstance } from "../../../lib/axios";
const selectClass =
  "px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-sm font-medium cursor-pointer hover:border-blue-500 transition-all focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none pr-8 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_10px_center]";

const TaskDetails = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");
  const taskId = searchParams.get("taskId");

  const { currentWorkspace, fetchComments, addComment, updateTask } = useWorkspaceStore();
  const { authUser } = useAuthStore();

  const [task, setTask] = useState(null);
  const [project, setProject] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    type: "TASK",
    priority: "MEDIUM",
    due_date: "",
  });

  const workspaceId = currentWorkspace?.id || currentWorkspace?._id;

  const myMembership = currentWorkspace?.members?.find(
    (m) => m?.userId?._id === authUser?._id || m?.userId?._id === authUser?.id,
  );
  const canEdit = ["admin", "manager"].includes(
    myMembership?.role?.name || myMembership?.role,
  );

  useEffect(() => {
    if (!projectId || !taskId || !currentWorkspace) return;

    const proj = currentWorkspace.projects?.find(
      (p) =>
        p._id === projectId ||
        p.id === projectId ||
        p._id?.toString() === projectId,
    );

    if (!proj) {
      setLoading(false);
      return;
    }

    const tsk = proj.tasks?.find(
      (t) =>
        t._id === taskId || t.id === taskId || t._id?.toString() === taskId,
    );

    setProject(proj);
    setTask(tsk || null);
    if (tsk) {
      setEditForm({
        title: tsk.title || "",
        description: tsk.description || "",
        type: tsk.type || "TASK",
        priority: tsk.priority || "MEDIUM",
        due_date: tsk.due_date ? tsk.due_date.split("T")[0] : "",
      });
    }
    setLoading(false);
  }, [taskId, projectId, currentWorkspace]);

  const fetchCommentsHandler = async () => {
    if (!taskId) return;
    const result = await fetchComments(taskId);
    if (result.success) setComments(result.comments);
  };

  useEffect(() => {
    if (!taskId) return;
    fetchCommentsHandler();
    const interval = setInterval(fetchCommentsHandler, 10000);
    return () => clearInterval(interval);
  }, [taskId]);

  const handleStatusChange = async (newStatus) => {
    const toastId = toast.loading("Updating status...");
    try {
      await axiosInstance.patch(
        `/workspace/${workspaceId}/projects/${projectId}/tasks/${taskId}/status`,
        { status: newStatus },
      );
      setTask((prev) => ({ ...prev, status: newStatus }));
      toast.success("Status updated.", { id: toastId });
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message, {
        id: toastId,
      });
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    const result = await addComment(taskId, newComment);
    if (result.success) {
      setComments((prev) => [...prev, result.comment]);
      setNewComment("");
    } else {
      toast.error(result.message);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (task) {
      setEditForm({
        title: task.title || "",
        description: task.description || "",
        type: task.type || "TASK",
        priority: task.priority || "MEDIUM",
        due_date: task.due_date ? task.due_date.split("T")[0] : "",
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!editForm.title.trim()) {
      toast.error("Title is required");
      return;
    }

    const toastId = toast.loading("Updating task...");
    const result = await updateTask(workspaceId, projectId, taskId, editForm);

    if (result.success) {
      setTask(result.data);
      setIsEditing(false);
      toast.success("Task updated successfully", { id: toastId });
    } else {
      toast.error(result.message || "Failed to update task", { id: toastId });
    }
  };

  const formatDate = (date, fmt = "dd MMM yyyy") => {
    if (!date) return "—";
    try {
      return format(new Date(date), fmt);
    } catch {
      return "—";
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-zinc-500 animate-pulse">
        <Clock className="size-8 mb-2 animate-spin text-blue-500" />
        <p>Loading task details...</p>
      </div>
    );

  if (!task)
    return (
      <div className="text-center py-20 text-red-500 font-medium">
        Task not found.
      </div>
    );

  const assignees = task.assignees || [];

  return (
    <div className="py-4">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 mb-2">
        <div className="space-y-1">
          <button
            onClick={() => navigate("/dashboard/tasks")}
            className="group flex items-center gap-2 text-sm text-zinc-500 hover:text-blue-500 transition-colors mb-2"
          >
            <ArrowLeftIcon className="size-4 group-hover:-translate-x-1 transition-transform" />
            Back to Tasks
          </button>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-8 p-2 sm:p-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="w-full lg:w-[65%] space-y-6">
          <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden flex flex-col h-[75vh] shadow-sm">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/20">
              <h2 className="font-bold flex items-center gap-2.5">
                <MessageCircle className="size-5 text-blue-500" />
                Discussion
                <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-normal">
                  {comments.length}
                </span>
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
              {comments.length > 0 ? (
                comments.map((comment) => {
                  const isMe =
                    comment.userId?._id === authUser?._id ||
                    comment.userId?._id === authUser?.id;
                  return (
                    <div
                      key={comment._id}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-2 mb-1.5 px-1">
                        {!isMe && (
                          <img
                            src={comment.userId?.dp || "/default-avatar.png"}
                            className="size-5 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-700"
                            alt=""
                          />
                        )}
                        <span className="text-xs font-semibold dark:text-zinc-300">
                          {isMe ? "You" : comment.userId?.name}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          {formatDate(comment.createdAt, "HH:mm")}
                        </span>
                      </div>
                      <div
                        className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-xs border ${
                          isMe
                            ? "bg-blue-600 text-white border-blue-500 rounded-tr-none"
                            : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-tl-none"
                        }`}
                      >
                        {comment.content}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-400 opacity-60">
                  <MessageCircle className="size-12 mb-2" />
                  <p className="text-sm">
                    No activity yet. Start the conversation!
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <div className="relative group">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4 pr-16 text-sm resize-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  rows={2}
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="absolute right-3 bottom-3 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[35%] space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <Info className="size-3.5" /> Task Details
              </span>
              <div className="flex items-center gap-2">
                {canEdit && !isEditing && (
                  <button
                    onClick={handleEdit}
                    className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-blue-500 transition-colors"
                    title="Edit task"
                  >
                    <PenIcon className="size-4" />
                  </button>
                )}
                {isEditing && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleSaveEdit}
                      className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 transition-colors"
                      title="Save changes"
                    >
                      <Save className="size-4" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors"
                      title="Cancel"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                )}
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className={selectClass}
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="DONE">Done</option>
                </select>
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1.5">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm({ ...editForm, title: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Task title"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                    rows={3}
                    placeholder="Task description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1.5">
                      Type
                    </label>
                    <select
                      value={editForm.type}
                      onChange={(e) =>
                        setEditForm({ ...editForm, type: e.target.value })
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
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1.5">
                      Priority
                    </label>
                    <select
                      value={editForm.priority}
                      onChange={(e) =>
                        setEditForm({ ...editForm, priority: e.target.value })
                      }
                      className={selectClass}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1.5">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={editForm.due_date}
                    onChange={(e) =>
                      setEditForm({ ...editForm, due_date: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white leading-tight">
                    {task.title}
                  </h1>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase border border-blue-100 dark:border-blue-500/20">
                      {task.type}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${
                        task.priority === "HIGH"
                          ? "bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
                          : "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                      }`}
                    >
                      {task.priority} Priority
                    </span>
                  </div>
                </div>

                {task.description && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed bg-zinc-50 dark:bg-zinc-800/30 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    {task.description}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-6 pt-2">
                  <div className="space-y-1.5 col-span-2">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">
                      Assignees
                    </span>
                    <div className="flex flex-wrap gap-3">
                      {assignees.length > 0 ? (
                        assignees.map((a, i) => (
                          <div
                            key={a._id || a.id || i}
                            className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/50 pr-3 pl-1 py-1 rounded-full border border-zinc-100 dark:border-zinc-800 shadow-sm transition-transform hover:scale-105"
                          >
                            <img
                              src={a.dp || "/default-avatar.png"}
                              className="size-6 rounded-full object-cover ring-2 ring-white dark:ring-zinc-900 shadow-sm"
                              alt={a.name}
                            />
                            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                              {a.name}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center gap-2 text-zinc-400 italic">
                          <User className="size-4" />
                          <span className="text-sm">Unassigned</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5 col-span-2 sm:col-span-1 pt-2">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">
                      Due Date
                    </span>
                    <div className="flex items-center gap-2 text-sm font-medium bg-zinc-50 dark:bg-zinc-800/50 px-4 py-2.5 rounded-2xl border border-zinc-100 dark:border-zinc-800 w-fit">
                      <CalendarIcon className="size-4 text-blue-500" />
                      {formatDate(task.due_date, "PPP")}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {project && (
            <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-5">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <Layout className="size-3.5" /> Project Context
              </span>

              <div className="space-y-4">
                <h3 className="font-bold text-zinc-900 dark:text-white">
                  {project.name}
                </h3>

                <div className="space-y-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-500 font-medium">
                      Completion
                    </span>
                    <span className="font-bold text-blue-500">
                      {project.progress}%
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-[11px] font-medium">
                  <div className="flex flex-col gap-1">
                    <span className="text-zinc-400 uppercase">Status</span>
                    <span className="text-zinc-700 dark:text-zinc-200">
                      {project.status}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-zinc-400 uppercase">Started</span>
                    <span className="text-zinc-700 dark:text-zinc-200">
                      {formatDate(project.start_date)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;
