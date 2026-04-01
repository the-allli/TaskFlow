import { FolderOpen, CheckCircle, Users, AlertTriangle } from "lucide-react";
import { useMemo } from "react";
import useWorkspaceStore from "../../../../store/useWorkspaceStore";
import useAuthStore from "../../../../store/useAuthStore";

export default function StatsGrid() {
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

  const stats = useMemo(() => {
    if (!currentWorkspace)
      return {
        totalProjects: 0,
        completedProjects: 0,
        myTasks: 0,
        overdueIssues: 0,
      };

    return {
      totalProjects: accessibleProjects.length,
      completedProjects: accessibleProjects.filter(
        (p) => p.status === "COMPLETED",
      ).length,
      myTasks: accessibleProjects.reduce(
        (acc, p) =>
          acc +
          (p.tasks || []).filter((t) => {
            const assignees = t.assignees || [];
            return assignees.some(
              (a) => (a._id || a.id || a)?.toString() === userId?.toString(),
            );
          }).length,
        0,
      ),
      overdueIssues: accessibleProjects.reduce(
        (acc, p) =>
          acc +
          (p.tasks || []).filter(
            (t) =>
              t.due_date &&
              new Date(t.due_date) < new Date() &&
              t.status !== "DONE",
          ).length,
        0,
      ),
    };
  }, [currentWorkspace, accessibleProjects, userId]);

  const cards = [
    {
      title: "Projects",
      value: stats.totalProjects,
      icon: FolderOpen,
      color: "blue",
    },
    {
      title: "Completed",
      value: stats.completedProjects,
      icon: CheckCircle,
      color: "emerald",
    },
    { title: "My Tasks", value: stats.myTasks, icon: Users, color: "purple" },
    {
      title: "Overdue",
      value: stats.overdueIssues,
      icon: AlertTriangle,
      color: "amber",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {cards.map((card) => (
        <div
          key={card.title}
          className="group relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
        >
          <div
            className={`absolute -right-4 -top-4 w-20 h-20 rounded-full blur-3xl opacity-10 bg-${card.color}-500`}
          />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {card.title}
              </p>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white mt-1">
                {card.value}
              </p>
            </div>
            <div
              className={`p-3 rounded-xl bg-${card.color}-500/10 text-${card.color}-500 group-hover:scale-110 transition-transform`}
            >
              <card.icon size={20} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
