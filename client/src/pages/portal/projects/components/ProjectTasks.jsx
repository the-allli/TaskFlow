import { format } from "date-fns";
import toast from "react-hot-toast";
import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useWorkspaceStore from "../../../../store/useWorkspaceStore";
import useAuthStore from "../../../../store/useAuthStore";
import {
  Bug,
  CalendarIcon,
  GitCommit,
  MessageSquare,
  Square,
  Trash,
  XIcon,
  Zap,
  UserPlus,
  Check,
} from "lucide-react";
import FilterSelect from "../../../../components/FilterSelect";

const typeIcons = {
  BUG: { icon: Bug, color: "text-red-600 dark:text-red-400" },
  FEATURE: { icon: Zap, color: "text-blue-600 dark:text-blue-400" },
  TASK: { icon: Square, color: "text-green-600 dark:text-green-400" },
  IMPROVEMENT: {
    icon: GitCommit,
    color: "text-purple-600 dark:text-purple-400",
  },
  OTHER: { icon: MessageSquare, color: "text-amber-600 dark:text-amber-400" },
};

const priorityTexts = {
  LOW: {
    background: "bg-red-100 dark:bg-red-950",
    prioritycolor: "text-red-600 dark:text-red-400",
  },
  MEDIUM: {
    background: "bg-blue-100 dark:bg-blue-950",
    prioritycolor: "text-blue-600 dark:text-blue-400",
  },
  HIGH: {
    background: "bg-emerald-100 dark:bg-emerald-950",
    prioritycolor: "text-emerald-600 dark:text-emerald-400",
  },
};

const selectClass =
  "px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 text-sm cursor-pointer hover:border-blue-400 dark:hover:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_10px_center] pr-8";

const AssigneeModal = ({ isOpen, onClose, task, projectMembers, onUpdate }) => {
  const modalRef = useRef(null);
  const assignees = task?.assignees || [];
  const assigneeIds = assignees.map((a) => a._id || a.id || a);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  const toggleAssignee = (userId) => {
    let newAssigneeIds;
    const uidStr = userId.toString();
    const currentAssigneeIds = assigneeIds.map((id) => id.toString());

    if (currentAssigneeIds.includes(uidStr)) {
      newAssigneeIds = currentAssigneeIds.filter((id) => id !== uidStr);
    } else {
      newAssigneeIds = [...currentAssigneeIds, uidStr];
    }
    onUpdate(task._id || task.id, newAssigneeIds);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/60 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="font-bold text-zinc-900 dark:text-white">
            Manage Assignees
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <XIcon className="size-4 text-zinc-500" />
          </button>
        </div>

        <div className="p-2 max-h-80 overflow-y-auto">
          {projectMembers.length > 0 ? (
            projectMembers.map((member) => {
              const u = member.userId;
              const uid = u._id || u.id;
              const isSelected = assigneeIds.some(
                (id) => id.toString() === uid.toString(),
              );
              return (
                <button
                  key={uid}
                  onClick={() => toggleAssignee(uid)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all mb-1 ${
                    isSelected
                      ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={u.dp || "/default-avatar.png"}
                      className="size-8 rounded-full object-cover ring-2 ring-white dark:ring-zinc-800 shadow-sm"
                      alt=""
                    />
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-semibold truncate max-w-[150px]">
                        {u.name}
                      </span>
                      <span className="text-[10px] opacity-70 truncate max-w-[150px]">
                        {u.email}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`size-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-blue-500 border-blue-500 text-white"
                        : "border-zinc-300 dark:border-zinc-700"
                    }`}
                  >
                    {isSelected && <Check className="size-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="py-8 text-center text-zinc-500 dark:text-zinc-400">
              <p className="text-sm italic">No members found</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

const AssigneeList = ({ task, onOpen, isAdminOrManager }) => {
  const assignees = task.assignees || [];

  return (
    <button
      onClick={(e) => {
        if (!isAdminOrManager) return;
        e.stopPropagation();
        onOpen();
      }}
      className={`flex -space-x-2 overflow-hidden p-1 rounded-lg transition-all ${
        isAdminOrManager
          ? "hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          : "cursor-default"
      }`}
    >
      {assignees.length > 0 ? (
        assignees.map((a, i) => (
          <img
            key={a._id || a.id || i}
            className="inline-block size-7 rounded-full ring-2 ring-white dark:ring-zinc-900 object-cover shadow-sm"
            src={a.dp || "/default-avatar.png"}
            alt={a.name}
            title={a.name}
          />
        ))
      ) : (
        <div className="size-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 border border-zinc-200 dark:border-zinc-700">
          <UserPlus className="size-3.5" />
        </div>
      )}
    </button>
  );
};

const ProjectTasks = ({ project, tasks, setTasks }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("id");

  const {
    currentWorkspace,
    updateTaskStatus,
    updateTaskAssignees,
    deleteTasks,
  } = useWorkspaceStore();
  const { authUser } = useAuthStore();
  const workspaceId = currentWorkspace?.id || currentWorkspace?._id;

  const myMembership = currentWorkspace?.members?.find(
    (m) => m?.userId?._id === authUser?._id || m?.userId?._id === authUser?.id,
  );

  const isAdminOrManager = ["admin", "manager"].includes(
    myMembership?.role?.name || myMembership?.role,
  );

  const userId = authUser?._id || authUser?.id;
  const [activeTaskForAssignees, setActiveTaskForAssignees] = useState(null);

  const visibleTasks = useMemo(() => {
    if (isAdminOrManager) return tasks;
    return tasks.filter((t) => {
      const assignees = t.assignees || [];
      return assignees.some(
        (a) => (a._id || a.id || a).toString() === userId?.toString(),
      );
    });
  }, [tasks, isAdminOrManager, userId]);

  const [selectedTasks, setSelectedTasks] = useState([]);
  const [filters, setFilters] = useState({
    status: "",
    type: "",
    priority: "",
    assignee: "",
  });

  const assigneeList = useMemo(() => {
    const names = new Set();
    visibleTasks.forEach((t) => {
      (t.assignees || []).forEach((a) => {
        if (a.name) names.add(a.name);
      });
    });
    return Array.from(names);
  }, [visibleTasks]);

  const filteredTasks = useMemo(() => {
    return visibleTasks.filter((task) => {
      const { status, type, priority, assignee } = filters;
      const taskAssigneeNames = (task.assignees || []).map((a) => a.name);

      return (
        (!status || task.status === status) &&
        (!type || task.type === type) &&
        (!priority || task.priority === priority) &&
        (!assignee || taskAssigneeNames.includes(assignee))
      );
    });
  }, [filters, visibleTasks]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = async (taskId, newStatus) => {
    const toastId = toast.loading("Updating status...");
    const result = await updateTaskStatus(
      workspaceId,
      projectId,
      taskId,
      newStatus,
    );

    if (result.success) {
      setTasks((prev) =>
        prev.map((t) =>
          t._id === taskId || t.id === taskId ? { ...t, status: newStatus } : t,
        ),
      );
      toast.success("Status updated.", { id: toastId });
    } else {
      toast.error(result.message || "Failed to update status", { id: toastId });
    }
  };

  const handleAssigneeUpdate = async (taskId, newAssigneeIds) => {
    const toastId = toast.loading("Updating assignees...");
    const result = await updateTaskAssignees(
      workspaceId,
      projectId,
      taskId,
      newAssigneeIds,
    );

    if (result.success) {
      const updatedTask = { ...result.data };
      setTasks((prev) =>
        prev.map((t) =>
          t._id === taskId || t.id === taskId ? updatedTask : t,
        ),
      );
      if (
        activeTaskForAssignees?._id === taskId ||
        activeTaskForAssignees?.id === taskId
      ) {
        setActiveTaskForAssignees(updatedTask);
      }
      toast.success("Assignees updated.", { id: toastId });
    } else {
      toast.error(result.message || "Failed to update assignees", {
        id: toastId,
      });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete selected tasks?")) return;
    const toastId = toast.loading("Deleting tasks...");

    const result = await deleteTasks(workspaceId, projectId, selectedTasks);

    if (result.success) {
      const remainingTasks = tasks.filter(
        (t) => !selectedTasks.includes(t._id) && !selectedTasks.includes(t.id),
      );
      setTasks(remainingTasks);
      setSelectedTasks([]);
      toast.success("Tasks deleted.", { id: toastId });
    } else {
      toast.error(result.message || "Failed to delete tasks", { id: toastId });
    }
  };

  const formatDate = (date) => {
    if (!date) return "—";
    try {
      return format(new Date(date), "dd MMM yyyy");
    } catch {
      return "—";
    }
  };

  const getTaskId = (task) => task._id || task.id;

  const filterOptions = {
    status: [
      { label: "All Statuses", value: "" },
      { label: "To Do", value: "TODO" },
      { label: "In Progress", value: "IN_PROGRESS" },
      { label: "In Review", value: "IN_REVIEW" },
      { label: "Done", value: "DONE" },
    ],
    type: [
      { label: "All Types", value: "" },
      { label: "Task", value: "TASK" },
      { label: "Bug", value: "BUG" },
      { label: "Feature", value: "FEATURE" },
      { label: "Improvement", value: "IMPROVEMENT" },
    ],
    priority: [
      { label: "All Priorities", value: "" },
      { label: "Low", value: "LOW" },
      { label: "Medium", value: "MEDIUM" },
      { label: "High", value: "HIGH" },
    ],
    assignee: [
      { label: "All Assignees", value: "" },
      ...assigneeList.map((n) => ({ label: n, value: n })),
    ],
  };

  return (
    <div className="p-1">
      <div className="flex flex-wrap gap-4 mb-4">
        {[
          "status",
          "type",
          "priority",
          ...(isAdminOrManager ? ["assignee"] : []),
        ].map((name) => (
          <select
            key={name}
            name={name}
            value={filters[name]}
            onChange={handleFilterChange}
            className={selectClass}
          >
            {filterOptions[name].map((opt, idx) => (
              <option key={idx} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ))}
        {(filters.status ||
          filters.type ||
          filters.priority ||
          filters.assignee) && (
          <button
            onClick={() =>
              setFilters({ status: "", type: "", priority: "", assignee: "" })
            }
            className="px-3 py-1 flex items-center gap-2 rounded bg-linear-to-br from-purple-400 to-purple-500 text-white text-sm"
          >
            <XIcon className="size-3" /> Reset
          </button>
        )}

        {selectedTasks.length > 0 && isAdminOrManager && (
          <button
            onClick={handleDelete}
            className="px-3 py-1 flex items-center gap-2 rounded bg-linear-to-br from-red-400 to-red-500 text-white text-sm"
          >
            <Trash className="size-3" /> Delete ({selectedTasks.length})
          </button>
        )}
      </div>

      <div className="overflow-auto rounded-lg lg:border border-zinc-300 dark:border-zinc-800">
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full text-sm text-left text-zinc-900 dark:text-zinc-300">
            <thead className="text-xs uppercase dark:bg-zinc-800/70 text-zinc-500 dark:text-zinc-400">
              <tr>
                {isAdminOrManager && (
                  <th className="pl-4 pr-1">
                    <input
                      type="checkbox"
                      className="size-3 accent-zinc-600 dark:accent-zinc-500"
                      checked={
                        selectedTasks.length === visibleTasks.length &&
                        visibleTasks.length > 0
                      }
                      onChange={() =>
                        selectedTasks.length === visibleTasks.length
                          ? setSelectedTasks([])
                          : setSelectedTasks(visibleTasks.map(getTaskId))
                      }
                    />
                  </th>
                )}
                <th
                  className={`py-3 ${isAdminOrManager ? "px-4 pl-0" : "px-4"}`}
                >
                  Title
                </th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Assignees</th>
                <th className="px-4 py-3">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => {
                  const tid = getTaskId(task);
                  const { icon: Icon, color } = typeIcons[task.type] || {};
                  const { background, prioritycolor } =
                    priorityTexts[task.priority] || {};

                  return (
                    <tr
                      key={tid}
                      onClick={() =>
                        navigate(
                          `/dashboard/tasks/taskDetails?projectId=${projectId}&taskId=${tid}`,
                        )
                      }
                      className="border-t border-zinc-300 dark:border-zinc-800 group hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all cursor-pointer"
                    >
                      {isAdminOrManager && (
                        <td
                          onClick={(e) => e.stopPropagation()}
                          className="pl-4 pr-1"
                        >
                          <input
                            type="checkbox"
                            className="size-3 accent-zinc-600 dark:accent-zinc-500"
                            checked={selectedTasks.includes(tid)}
                            onChange={() =>
                              selectedTasks.includes(tid)
                                ? setSelectedTasks(
                                    selectedTasks.filter((i) => i !== tid),
                                  )
                                : setSelectedTasks((prev) => [...prev, tid])
                            }
                          />
                        </td>
                      )}
                      <td
                        className={`py-2 ${isAdminOrManager ? "px-4 pl-0" : "px-4"}`}
                      >
                        {task.title}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          {Icon && <Icon className={`size-4 ${color}`} />}
                          <span
                            className={`uppercase text-[10px] font-medium ${color}`}
                          >
                            {task.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-medium ${background} ${prioritycolor}`}
                        >
                          {task.priority}
                        </span>
                      </td>
                      <td
                        onClick={(e) => e.stopPropagation()}
                        className="px-4 py-2"
                      >
                        <FilterSelect
                          value={task.status}
                          onChange={(val) => handleStatusChange(tid, val)}
                          options={[
                            { label: "To Do", value: "TODO" },
                            { label: "In Progress", value: "IN_PROGRESS" },
                            { label: "In Review", value: "IN_REVIEW" },
                            { label: "Done", value: "DONE" },
                          ]}
                        />
                      </td>
                      <td
                        onClick={(e) => e.stopPropagation()}
                        className="px-4 py-2"
                      >
                        <AssigneeList
                          task={task}
                          isAdminOrManager={isAdminOrManager}
                          onOpen={() => setActiveTaskForAssignees(task)}
                        />
                      </td>
                      <td className="px-4 py-2 text-xs text-zinc-500">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="size-3" />
                          {formatDate(task.due_date)}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={isAdminOrManager ? 7 : 6}
                    className="text-center text-zinc-500 dark:text-zinc-400 py-10 px-4"
                  >
                    No tasks found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="lg:hidden flex flex-col gap-4 p-2">
          {filteredTasks.map((task) => {
            const tid = getTaskId(task);
            const { icon: Icon, color } = typeIcons[task.type] || {};
            const { background, prioritycolor } =
              priorityTexts[task.priority] || {};
            return (
              <div
                key={tid}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 space-y-3 shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                    {task.title}
                  </h3>
                  {isAdminOrManager && (
                    <input
                      type="checkbox"
                      className="size-4 accent-zinc-500"
                      checked={selectedTasks.includes(tid)}
                      onChange={() =>
                        selectedTasks.includes(tid)
                          ? setSelectedTasks(
                              selectedTasks.filter((i) => i !== tid),
                            )
                          : setSelectedTasks((p) => [...p, tid])
                      }
                    />
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded flex items-center gap-1 ${background} ${prioritycolor}`}
                  >
                    {Icon && <Icon className="size-3" />} {task.type}
                  </span>
                  <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded">
                    Due: {formatDate(task.due_date)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <AssigneeList
                      task={task}
                      isAdminOrManager={isAdminOrManager}
                      onOpen={() => setActiveTaskForAssignees(task)}
                    />
                  </div>
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(tid, e.target.value)}
                    className="text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AssigneeModal
        isOpen={!!activeTaskForAssignees}
        onClose={() => setActiveTaskForAssignees(null)}
        task={activeTaskForAssignees}
        projectMembers={(currentWorkspace?.members || []).filter(
          (m) => (m?.role?.name || m?.role) !== "admin",
        )}
        onUpdate={handleAssigneeUpdate}
      />
    </div>
  );
};

export default ProjectTasks;
