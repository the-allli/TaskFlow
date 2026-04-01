import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  FolderOpen,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  PlayCircle,
  XCircle,
  PauseCircle,
  ArrowDownCircle,
  BarChart2,
} from "lucide-react";
import ProjectCard from "./components/ProjectCard";
import CreateProjectDialog from "./components/CreateProjectDialog";
import FilterSelect from "../../../components/FilterSelect";
import useWorkspaceStore from "../../../store/useWorkspaceStore";
import useAuthStore from "../../../store/useAuthStore";
import { usePlanLimits } from "../../../hooks/usePlanLimits";
import StatCard from "../../../components/StatCard";

export default function Projects() {
  const { currentWorkspace, fetchMembers } = useWorkspaceStore();
  const { authUser } = useAuthStore();
  const { plan, canCreate } = usePlanLimits();

  const workspaceId = currentWorkspace?._id || currentWorkspace?.id;
  const users = currentWorkspace?.members || [];
  const allProjects = currentWorkspace?.projects || [];

  const myMembership = users.find(
    (u) => u?.userId?._id === authUser?._id || u?.userId?._id === authUser?.id,
  );
  const roleName = myMembership?.role?.name;
  const roleAllowsProjectCreate =
    roleName === "admin" || roleName === "manager";
  const userId = authUser?._id || authUser?.id;

  const planAllowsNewProject = canCreate(
    "maxProjectsInAWorkspace",
    allProjects.length,
  );

  const myProjects = useMemo(() => {
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

  const stats = useMemo(() => {
    const projectsToDisplay = roleName === "admin" ? allProjects : myProjects;
    return [
      {
        label: "High Priority",
        count: projectsToDisplay.filter((p) => p.priority === "HIGH").length,
        icon: AlertCircle,
        colorClass: {
          bg: "bg-rose-50 dark:bg-rose-500/10",
          icon: "text-rose-500",
        },
      },
      {
        label: "Medium Priority",
        count: projectsToDisplay.filter((p) => p.priority === "MEDIUM").length,
        icon: BarChart2,
        colorClass: {
          bg: "bg-blue-50 dark:bg-blue-500/10",
          icon: "text-blue-500",
        },
      },
      {
        label: "Low Priority",
        count: projectsToDisplay.filter((p) => p.priority === "LOW").length,
        icon: ArrowDownCircle,
        colorClass: {
          bg: "bg-slate-50 dark:bg-slate-500/10",
          icon: "text-slate-500",
        },
      },
      {
        label: "Planning",
        count: projectsToDisplay.filter((p) => p.status === "PLANNING").length,
        icon: Clock,
        colorClass: {
          bg: "bg-blue-50 dark:bg-blue-500/10",
          icon: "text-blue-500",
        },
      },
      {
        label: "Active",
        count: projectsToDisplay.filter(
          (p) => p.status !== "CANCELLED" && p.status !== "COMPLETED",
        ).length,
        icon: PlayCircle,
        colorClass: {
          bg: "bg-emerald-50 dark:bg-emerald-500/10",
          icon: "text-emerald-500",
        },
      },
      {
        label: "Completed",
        count: projectsToDisplay.filter((p) => p.status === "COMPLETED").length,
        icon: CheckCircle2,
        colorClass: {
          bg: "bg-purple-50 dark:bg-purple-500/10",
          icon: "text-purple-500",
        },
      },
      {
        label: "On Hold",
        count: projectsToDisplay.filter((p) => p.status === "ON_HOLD").length,
        icon: PauseCircle,
        colorClass: {
          bg: "bg-amber-50 dark:bg-amber-500/10",
          icon: "text-amber-500",
        },
      },
      {
        label: "Cancelled",
        count: projectsToDisplay.filter((p) => p.status === "CANCELLED").length,
        icon: XCircle,
        colorClass: {
          bg: "bg-zinc-100 dark:bg-zinc-500/10",
          icon: "text-zinc-500",
        },
      },
    ];
  }, [allProjects, myProjects, roleName]);

  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filters, setFilters] = useState({ status: "ALL", priority: "ALL" });

  const filteredProjects = useMemo(() => {
    let filtered = myProjects;
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }
    if (filters.status !== "ALL")
      filtered = filtered.filter((p) => p.status === filters.status);
    if (filters.priority !== "ALL")
      filtered = filtered.filter((p) => p.priority === filters.priority);
    return filtered;
  }, [myProjects, searchTerm, filters]);

  useEffect(() => {
    if (workspaceId) fetchMembers(workspaceId);
  }, [workspaceId]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Projects
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 text-sm mt-1">
            {roleName === "admin"
              ? "Manage and track all workspace projects"
              : roleName === "manager"
                ? "View projects you're assigned to or managing"
                : "Viewing projects assigned to you"}
          </p>
        </div>

        {roleAllowsProjectCreate && (
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={() => planAllowsNewProject && setIsDialogOpen(true)}
              disabled={!planAllowsNewProject}
              className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all shadow-sm ${
                planAllowsNewProject
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-100 dark:bg-zinc-800 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Plus className="size-4 mr-2" /> New Project
            </button>
            {!planAllowsNewProject && (
              <p className="text-xs text-amber-500 font-medium">
                {plan} plan limit reached.{" "}
                <a
                  href="/dashboard/payment"
                  className="underline hover:text-amber-600"
                >
                  Upgrade
                </a>
              </p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
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
            placeholder="Search by name or description..."
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <FilterSelect
            value={filters.status}
            onChange={(val) => setFilters({ ...filters, status: val })}
            options={[
              { value: "ALL", label: "All Status" },
              { value: "PLANNING", label: "Planning" },
              { value: "ACTIVE", label: "Active" },
              { value: "COMPLETED", label: "Completed" },
              { value: "ON_HOLD", label: "On Hold" },
              { value: "CANCELLED", label: "Cancelled" },
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 bg-gray-50/50 dark:bg-zinc-900/20 rounded-2xl border-2 border-dashed border-gray-200 dark:border-zinc-800">
            <div className="w-16 h-16 mb-4 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
              <FolderOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              No projects found
            </h3>
            <p className="text-gray-500 dark:text-zinc-400 text-sm max-w-xs text-center mt-1">
              {roleName === "admin"
                ? "No projects in this workspace yet. Create one to get started."
                : roleName === "manager"
                  ? "You haven't been assigned to any projects yet."
                  : "You haven't been assigned to any projects yet."}
            </p>
          </div>
        ) : (
          filteredProjects.map((project) => (
            <ProjectCard key={project._id || project.id} project={project} />
          ))
        )}
      </div>

      <CreateProjectDialog
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
      />
    </div>
  );
}
