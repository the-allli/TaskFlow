import { Link } from "react-router-dom";
import { ArrowRight, Calendar, UsersIcon } from "lucide-react";
import { format } from "date-fns";
import { useMemo } from "react";
import useWorkspaceStore from "../../../../store/useWorkspaceStore";
import useAuthStore from "../../../../store/useAuthStore";

const ProjectOverview = () => {
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

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
        <h2 className="text-xl font-bold dark:text-white text-zinc-900">
          Active Projects
        </h2>
        <Link
          to="/dashboard/projects"
          className="text-sm font-medium text-blue-500 hover:text-blue-600 flex items-center gap-1"
        >
          View All <ArrowRight size={14} />
        </Link>
      </div>
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {accessibleProjects.slice(0, 4).map((project) => (
          <div
            key={project._id}
            className="p-6 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {project.name}
                </h3>
                <p className="text-sm text-zinc-500 line-clamp-1">
                  {project.description}
                </p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                {project.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-zinc-500 mb-4">
              <span className="flex items-center gap-1">
                <UsersIcon size={12} /> {project.members?.length || 0}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={12} />{" "}
                {project.end_date
                  ? format(new Date(project.end_date), "MMM d")
                  : "No date"}
              </span>
            </div>
            <div className="relative h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectOverview;
