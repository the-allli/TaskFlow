import { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Search,
  FolderOpen,
  Bug,
  Zap,
  Square,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertCircle,
  Layout,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import CreateTaskDialog from "../projects/components/CreateTaskDialog";
import useWorkspaceStore from "../../../store/useWorkspaceStore";
import useAuthStore from "../../../store/useAuthStore";
import { usePlanLimits } from "../../../hooks/usePlanLimits";
import FilterSelect from "../../../components/FilterSelect";
import StatCard from "../../../components/StatCard";

const Tasks = () => {
  const navigate = useNavigate();
  const { currentWorkspace, fetchMembers } = useWorkspaceStore();
  const { authUser } = useAuthStore();
  const { plan, limits, canCreate } = usePlanLimits();

  const workspaceId = currentWorkspace?._id || currentWorkspace?.id;
  const allProjects = currentWorkspace?.projects || [];
  const users = currentWorkspace?.members || [];
  const userId = authUser?._id || authUser?.id;

  const myMembership = users.find(
    (u) => u?.userId?._id === authUser?._id || u?.userId?._id === authUser?.id,
  );
  const roleName = myMembership?.role?.name;
  const isDev = roleName === "dev";
  const canCreateTaskByRole = roleName === "admin" || roleName === "manager";

  const accessibleProjects = useMemo(() => {
    if (roleName === "admin") return allProjects;

    return allProjects.filter((project) => {
      const isMember = project.members?.some((m) => {
        const memberId = m?.userId?._id || m?.userId?.id || m?.userId;
        return memberId?.toString() === userId?.toString();
      });

      const isTeamLead = project.team_lead?.toString() === userId?.toString();

      return isMember || isTeamLead;
    });
  }, [allProjects, userId, roleName]);

  const allTasks = useMemo(
    () =>
      accessibleProjects.flatMap((project) =>
        (project.tasks || []).map((task) => ({
          ...task,
          projectName: project.name,
          projectId: project._id || project.id,
        })),
      ),
    [accessibleProjects],
  );

  const visibleTasks = useMemo(() => {
    if (!isDev) return allTasks;
    return allTasks.filter((task) => {
      const assignees = task.assignees || [];
      return assignees.some(
        (a) =>
          (a._id || a.id || a).toString() ===
          (authUser?._id || authUser?.id)?.toString(),
      );
    });
  }, [allTasks, isDev, authUser]);

  const taskStats = useMemo(
    () => [
      {
        label: "Total Tasks",
        count: visibleTasks.length,
        icon: Layout,
        colorClass: {
          bg: "bg-blue-50 dark:bg-blue-500/10",
          icon: "text-blue-500",
        },
      },
      {
        label: "To Do",
        count: visibleTasks.filter((t) => t.status === "TODO").length,
        icon: Square,
        colorClass: {
          bg: "bg-zinc-100 dark:bg-zinc-500/10",
          icon: "text-zinc-500",
        },
      },
      {
        label: "In Progress",
        count: visibleTasks.filter((t) => t.status === "IN_PROGRESS").length,
        icon: Clock,
        colorClass: {
          bg: "bg-amber-50 dark:bg-amber-500/10",
          icon: "text-amber-500",
        },
      },
      {
        label: "Completed",
        count: visibleTasks.filter((t) => t.status === "DONE").length,
        icon: CheckCircle2,
        colorClass: {
          bg: "bg-emerald-50 dark:bg-emerald-500/10",
          icon: "text-emerald-500",
        },
      },
    ],
    [visibleTasks],
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filters, setFilters] = useState({ status: "ALL", priority: "ALL" });

  const typeIcons = {
    BUG: Bug,
    FEATURE: Zap,
    TASK: Square,
    IMPROVEMENT: MessageSquare,
  };

  const priorityStyles = {
    HIGH: "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
    MEDIUM:
      "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
    LOW: "bg-slate-50 text-slate-600 border-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
  };

  const filteredTasks = useMemo(() => {
    return visibleTasks.filter((task) => {
      const matchesSearch =
        !searchTerm ||
        task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        filters.status === "ALL" || task.status === filters.status;
      const matchesPriority =
        filters.priority === "ALL" || task.priority === filters.priority;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [visibleTasks, searchTerm, filters]);

  useEffect(() => {
    if (workspaceId) fetchMembers(workspaceId);
  }, [workspaceId]);

  const canCreateTask =
    limits.maxTasksInAProject === -1 ||
    accessibleProjects.length === 0 ||
    accessibleProjects.some((project) =>
      canCreate("maxTasksInAProject", (project.tasks || []).length),
    );

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tasks
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 text-sm mt-1">
            {isDev
              ? "Review and update your assigned work"
              : "Track progress across all workspace projects"}
          </p>
        </div>

        {canCreateTaskByRole && (
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={() => canCreateTask && setIsDialogOpen(true)}
              disabled={!canCreateTask}
              className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all shadow-sm ${
                canCreateTask
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-100 dark:bg-zinc-800 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Plus className="size-4 mr-2" /> New Task
            </button>
            {!canCreateTask && (
              <p className="text-xs text-amber-500 font-medium">
                Limit reached.{" "}
                <a
                  href="/dashboard/payment"
                  className="underline hover:text-amber-600"
                >
                  Upgrade plan
                </a>
              </p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {taskStats.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-50 dark:bg-zinc-900/30 p-4 rounded-xl border border-gray-200 dark:border-zinc-800">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            onChange={(e) => setSearchTerm(e.target.value)}
            value={searchTerm}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="Search tasks..."
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <FilterSelect
            value={filters.status}
            onChange={(val) => setFilters({ ...filters, status: val })}
            options={[
              { value: "ALL", label: "All Status" },
              { value: "TODO", label: "To Do" },
              { value: "IN_PROGRESS", label: "In Progress" },
              { value: "DONE", label: "Done" },
            ]}
          />

          <FilterSelect
            value={filters.priority}
            onChange={(val) => setFilters({ ...filters, priority: val })}
            options={[
              { value: "ALL", label: "All Priority" },
              { value: "HIGH", label: "High" },
              { value: "MEDIUM", label: "Medium" },
              { value: "LOW", label: "Low" },
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 bg-gray-50/50 dark:bg-zinc-900/20 rounded-2xl border-2 border-dashed border-gray-200 dark:border-zinc-800">
            <FolderOpen className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              No tasks found
            </h3>
            <p className="text-gray-500 dark:text-zinc-400 text-sm">
              Try adjusting your filters or search term.
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const TypeIcon = typeIcons[task.type] || Square;
            const assignees = task.assignees || [];

            return (
              <div
                key={task._id || task.id}
                onClick={() =>
                  navigate(
                    `/dashboard/tasks/taskDetails?projectId=${task.projectId}&taskId=${task._id || task.id}`,
                  )
                }
                className="group cursor-pointer bg-white dark:bg-zinc-900/40 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 hover:border-blue-500/40 transition-all shadow-sm hover:shadow-md"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 transition-colors">
                      <TypeIcon className="w-4 h-4 text-gray-500 dark:text-zinc-400 group-hover:text-blue-500" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-500">
                      {task.type}
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${priorityStyles[task.priority]}`}
                  >
                    {task.priority}
                  </span>
                </div>

                <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {task.title}
                </h3>

                <p className="text-xs text-gray-500 dark:text-zinc-400 mb-4 line-clamp-2">
                  {task.projectName}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-zinc-800">
                  <div
                    className={`px-3 py-1 rounded-lg text-xs font-medium ${
                      task.status === "DONE"
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10"
                        : task.status === "IN_PROGRESS"
                          ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10"
                          : "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    {task.status?.replace("_", " ")}
                  </div>

                  <div className="flex -space-x-2 overflow-hidden">
                    {assignees.length > 0 ? (
                      assignees
                        .slice(0, 3)
                        .map((a, i) => (
                          <img
                            key={a._id || a.id || i}
                            className="inline-block size-7 rounded-full ring-2 ring-white dark:ring-zinc-900 object-cover bg-zinc-200"
                            src={a.dp || "/default-avatar.png"}
                            alt={a.name}
                            title={a.name}
                          />
                        ))
                    ) : (
                      <div className="size-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border-2 border-white dark:border-zinc-900">
                        <span className="text-[10px] font-bold text-zinc-500">
                          ?
                        </span>
                      </div>
                    )}
                    {assignees.length > 3 && (
                      <div className="size-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border-2 border-white dark:border-zinc-900 ring-2 ring-white dark:ring-zinc-900">
                        <span className="text-[10px] font-bold text-zinc-500">
                          +{assignees.length - 3}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <CreateTaskDialog
        showCreateTask={isDialogOpen}
        setShowCreateTask={setIsDialogOpen}
        projects={accessibleProjects}
        projectId={null}
      />
    </div>
  );
};

export default Tasks;
