import { useMemo } from "react";
import {
  GitCommit,
  MessageSquare,
  Clock,
  Bug,
  Zap,
  Square,
} from "lucide-react";
import { format } from "date-fns";
import useWorkspaceStore from "../../../../store/useWorkspaceStore";
import useAuthStore from "../../../../store/useAuthStore";

const typeIcons = {
  BUG: { icon: Bug, color: "text-red-500 dark:text-red-400" },
  FEATURE: { icon: Zap, color: "text-blue-500 dark:text-blue-400" },
  TASK: { icon: Square, color: "text-green-500 dark:text-green-400" },
  IMPROVEMENT: {
    icon: MessageSquare,
    color: "text-amber-500 dark:text-amber-400",
  },
  OTHER: { icon: GitCommit, color: "text-purple-500 dark:text-purple-400" },
};

const statusColors = {
  TODO: "bg-zinc-200 text-zinc-800 dark:bg-zinc-600 dark:text-zinc-200",
  IN_PROGRESS:
    "bg-amber-200 text-amber-800 dark:bg-amber-500 dark:text-amber-900",
  DONE: "bg-emerald-200 text-emerald-800 dark:bg-emerald-500 dark:text-emerald-900",
};

const RecentActivity = () => {
  const { currentWorkspace } = useWorkspaceStore();
  const { authUser } = useAuthStore();

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
    return accessibleProjects
      .flatMap((p) => p.tasks || [])
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 10);
  }, [accessibleProjects]);

  const formatDate = (date, fmt) => {
    if (!date) return "";
    try {
      return format(new Date(date), fmt);
    } catch {
      return "";
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-950 dark:bg-linear-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-lg transition-all overflow-hidden">
      <div className="border-b border-zinc-200 dark:border-zinc-800 p-3 sm:p-4">
        <h2 className="text-base sm:text-lg text-zinc-800 dark:text-zinc-200">
          Recent Activity
        </h2>
      </div>

      <div className="p-0">
        {tasks.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center">
              <Clock className="w-8 h-8 text-zinc-600 dark:text-zinc-500" />
            </div>
            <p className="text-zinc-600 dark:text-zinc-400">
              No recent activity
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {tasks.map((task) => {
              const tid = task._id || task.id;
              const TypeIcon = typeIcons[task.type]?.icon || Square;
              const iconColor =
                typeIcons[task.type]?.color ||
                "text-gray-500 dark:text-gray-400";
              const assignees = task.assignees || [];

              return (
                <div
                  key={tid}
                  className="p-3 sm:p-4 lg:p-6 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                >
                  <div className="flex items-start gap-2 sm:gap-4">
                    <div className="p-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg shrink-0">
                      <TypeIcon
                        className={`w-3 h-3 sm:w-4 sm:h-4 ${iconColor}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                        <h4 className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 truncate">
                          {task.title}
                        </h4>
                        <span
                          className={`px-2 py-1 rounded text-xs w-fit shrink-0 ${statusColors[task.status] || "bg-zinc-300 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"}`}
                        >
                          {task.status?.replace("_", " ")}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                        <span className="capitalize">
                          {task.type?.toLowerCase()}
                        </span>

                        {assignees.length > 0 && (
                          <div className="flex items-center -space-x-1.5 overflow-hidden">
                            {assignees.slice(0, 3).map((a, i) => (
                              <img
                                key={a._id || a.id || i}
                                className="inline-block size-5 rounded-full ring-2 ring-white dark:ring-zinc-900 object-cover"
                                src={a.dp || "/default-avatar.png"}
                                alt={a.name}
                                title={a.name}
                              />
                            ))}
                            {assignees.length > 3 && (
                              <div className="size-5 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border-2 border-white dark:border-zinc-900 ring-2 ring-white dark:ring-zinc-900">
                                <span className="text-[8px] font-bold text-zinc-500">
                                  +{assignees.length - 3}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        <span className="hidden sm:inline">
                          {formatDate(task.updatedAt, "MMM d, h:mm a")}
                        </span>
                        <span className="sm:hidden">
                          {formatDate(task.updatedAt, "MMM d")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
