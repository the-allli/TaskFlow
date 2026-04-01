import { useMemo } from "react";
import { ArrowRight, Clock, AlertTriangle, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useWorkspaceStore from "../../../../store/useWorkspaceStore";
import useAuthStore from "../../../../store/useAuthStore";

export default function TasksSummary() {
  const { currentWorkspace } = useWorkspaceStore();
  const { authUser } = useAuthStore();
  const navigate = useNavigate();

  const myMembership = useMemo(() => {
    const users = currentWorkspace?.members || [];
    return users.find(
      (u) =>
        u?.userId?._id === authUser?._id || u?.userId?._id === authUser?.id,
    );
  }, [currentWorkspace, authUser]);

  const roleName = myMembership?.role?.name;
  const userId = authUser?._id || authUser?.id;

  const accessibleProjects = useMemo(() => {
    if (!currentWorkspace) return [];

    const allProjects = currentWorkspace.projects || [];

    if (roleName === "admin") return allProjects;

    return allProjects.filter((project) => {
      const isMember = project.members?.some((m) => {
        const memberId = m?.userId?._id || m?.userId?.id || m?.userId;
        return memberId?.toString() === userId?.toString();
      });

      const isTeamLead = project.team_lead?.toString() === userId?.toString();
      return isMember || isTeamLead;
    });
  }, [currentWorkspace, userId, roleName]);

  const tasks = useMemo(() => {
    if (!accessibleProjects) return [];
    return accessibleProjects.flatMap((p) => p.tasks || []);
  }, [accessibleProjects]);

  const myTasks = useMemo(
    () =>
      tasks.filter((t) => {
        const assignees = t.assignees || [];
        const userId = authUser?._id || authUser?.id;
        return assignees.some(
          (a) => (a._id || a.id || a).toString() === userId?.toString(),
        );
      }),
    [tasks, authUser],
  );

  const overdueTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.due_date &&
          new Date(t.due_date) < new Date() &&
          t.status !== "DONE",
      ),
    [tasks],
  );

  const inProgressTasks = useMemo(
    () => tasks.filter((t) => t.status === "IN_PROGRESS"),
    [tasks],
  );

  const summaryCards = [
    {
      title: "My Tasks",
      count: myTasks.length,
      icon: User,
      color:
        "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400",
      items: myTasks.slice(0, 3),
    },
    {
      title: "Overdue",
      count: overdueTasks.length,
      icon: AlertTriangle,
      color: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400",
      items: overdueTasks.slice(0, 3),
    },
    {
      title: "In Progress",
      count: inProgressTasks.length,
      icon: Clock,
      color: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400",
      items: inProgressTasks.slice(0, 3),
    },
  ];

  const handleTaskClick = (task) => {
    const taskId = task._id || task.id;
    const projectId = task.projectId?._id || task.projectId;
    navigate(
      `/dashboard/tasks/taskDetails?projectId=${projectId}&taskId=${taskId}`,
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {summaryCards.map((card) => (
        <div
          key={card.title}
          className="bg-white dark:bg-zinc-950 dark:bg-linear-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 rounded-lg overflow-hidden"
        >
          <div className="border-b border-zinc-200 dark:border-zinc-800 p-3 sm:p-4 pb-2 sm:pb-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg shrink-0">
                <card.icon className="w-4 h-4 text-gray-500 dark:text-zinc-400" />
              </div>
              <div className="flex items-center justify-between flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-medium text-gray-800 dark:text-white truncate">
                  {card.title}
                </h3>
                <span
                  className={`ml-2 px-2 py-1 rounded text-xs font-semibold shrink-0 ${card.color}`}
                >
                  {card.count}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 sm:p-4">
            {card.items.length === 0 ? (
              <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 text-center py-4">
                No {card.title.toLowerCase()}
              </p>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {card.items.map((task) => {
                  const tid = task._id || task.id;
                  return (
                    <div
                      key={tid}
                      onClick={() => handleTaskClick(task)}
                      className="p-2 sm:p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      <h4 className="text-xs sm:text-sm font-medium text-gray-800 dark:text-white truncate">
                        {task.title}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-zinc-400 capitalize mt-1">
                        {task.type?.toLowerCase()} • {task.priority} priority
                      </p>
                    </div>
                  );
                })}

                {card.count > 3 && (
                  <button
                    onClick={() => navigate("/dashboard/tasks")}
                    className="flex items-center justify-center w-full text-xs sm:text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white mt-2"
                  >
                    View {card.count - 3} more{" "}
                    <ArrowRight className="w-3 h-3 ml-2" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
