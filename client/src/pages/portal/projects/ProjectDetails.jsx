import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeftIcon,
  PlusIcon,
  SettingsIcon,
  BarChart3Icon,
  CalendarIcon,
  FileStackIcon,
  ZapIcon,
  Files,
  Loader2,
  Users2,
  CheckCircle2,
  Clock3,
} from "lucide-react";
import ProjectAnalytics from "./components/ProjectAnalytics";
import ProjectSettings from "./components/ProjectSettings";
import CreateTaskDialog from "./components/CreateTaskDialog";
import ProjectCalendar from "./components/ProjectCalendar";
import ProjectTasks from "./components/ProjectTasks";
import useWorkspaceStore from "../../../store/useWorkspaceStore";
import useAuthStore from "../../../store/useAuthStore";
import { usePlanLimits } from "../../../hooks/usePlanLimits";
import ProjectFiles from "./components/ProjectFiles";

export default function ProjectDetail() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab");
  const id = searchParams.get("id");
  const navigate = useNavigate();

  const { currentWorkspace, fetchMembers, fetchTasks } = useWorkspaceStore();
  const { authUser } = useAuthStore();
  const { canCreate, plan } = usePlanLimits();

  const users = currentWorkspace?.members || [];
  const projects = currentWorkspace?.projects || [];

  const myMembership = users.find(
    (u) =>
      String(u?.userId?._id || u?.userId?.id) ===
      String(authUser?._id || authUser?.id),
  );
  const roleName = myMembership?.role?.name;
  const isDev = roleName === "dev";
  const canCreateTaskByRole = roleName === "admin" || roleName === "manager";

  const canCreateTaskByPlan = (project) => {
    if (!project) return false;
    return canCreate("maxTasksInAProject", project.tasks?.length || 0);
  };

  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [activeTab, setActiveTab] = useState(tab || "tasks");

  useEffect(() => {
    if (tab) setActiveTab(tab);
  }, [tab]);

  useEffect(() => {
    setIsLoading(true);
    const proj = currentWorkspace?.projects?.find(
      (p) => p._id === id || p.id === id || p._id?.toString() === id,
    );
    if (proj) {
      setProject(proj);
      setTasks(proj?.tasks || []);
    }
    setIsLoading(false);
  }, [id, currentWorkspace, projects]);

  useEffect(() => {
    if (id && currentWorkspace) {
      const workspaceId = currentWorkspace?.id || currentWorkspace?._id;
      if (workspaceId) fetchMembers(workspaceId);
      fetchTasks(workspaceId, id);
    }
  }, [id]);

  const statusColors = {
    PLANNING:
      "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
    ACTIVE:
      "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    ON_HOLD:
      "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    COMPLETED:
      "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
    CANCELLED:
      "bg-red-50 text-red-700 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="size-10 animate-spin text-blue-500 mb-4" />
        <p className="text-zinc-500 font-medium animate-pulse">
          Syncing project data...
        </p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="size-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6">
          <FileStackIcon className="size-10 text-zinc-400" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Project not found
        </h2>
        <p className="text-zinc-500 mt-2 mb-8">
          The project you're looking for doesn't exist or has been moved.
        </p>
        <button
          onClick={() => navigate("/dashboard/projects")}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium transition-transform hover:scale-105"
        >
          <ArrowLeftIcon className="size-4" /> Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pb-20 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <button
            onClick={() => navigate("/dashboard/projects")}
            className="group flex items-center gap-2 text-sm text-zinc-500 hover:text-blue-500 transition-colors mb-2"
          >
            <ArrowLeftIcon className="size-4 group-hover:-translate-x-1 transition-transform" />
            Back to Projects
          </button>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {project.name}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border shadow-sm capitalize ${statusColors[project.status]}`}
            >
              {project.status?.replace("_", " ")}
            </span>
          </div>
        </div>

        {canCreateTaskByRole && (
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={() =>
                canCreateTaskByPlan(project) && setShowCreateTask(true)
              }
              disabled={!canCreateTaskByPlan(project)}
              className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all shadow-sm ${
                canCreateTaskByPlan(project)
                  ? "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-blue-500/25 active:scale-95"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed shadow-none"
              }`}
            >
              <PlusIcon className="size-4 mr-2" />
              New Task
            </button>
            {!canCreateTaskByPlan(project) && (
              <p className="text-xs font-medium text-amber-500">
                {plan} plan limit reached.{" "}
                <a href="/dashboard/payment" className="underline font-bold">
                  Upgrade
                </a>
              </p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Tasks",
            value: tasks.length,
            icon: FileStackIcon,
            color: "blue",
          },
          {
            label: "Completed",
            value: tasks.filter((t) => t.status === "DONE").length,
            icon: CheckCircle2,
            color: "emerald",
          },
          {
            label: "In Progress",
            value: tasks.filter((t) =>
              ["IN_PROGRESS", "TODO"].includes(t.status),
            ).length,
            icon: Clock3,
            color: "amber",
          },
          {
            label: "Project Members",
            value: project.members?.length || 0,
            icon: Users2,
            color: "indigo",
          },
        ].map((card, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {card.label}
                </p>
                <p className="text-2xl font-bold mt-1 text-zinc-900 dark:text-white">
                  {card.value}
                </p>
              </div>
              <div
                className={`p-2 rounded-lg bg-${card.color}-50 dark:bg-${card.color}-500/10`}
              >
                <card.icon
                  className={`size-5 text-${card.color}-600 dark:text-${card.color}-400 group-hover:scale-110 transition-transform`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <div className="flex items-center p-1.5 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl w-fit border border-zinc-200 dark:border-zinc-800 overflow-x-auto no-scrollbar">
          {[
            { key: "files", label: "Files", icon: Files },
            { key: "tasks", label: "Tasks", icon: FileStackIcon },
            { key: "calendar", label: "Calendar", icon: CalendarIcon },
            { key: "analytics", label: "Analytics", icon: BarChart3Icon },
            { key: "settings", label: "Settings", icon: SettingsIcon },
          ]
            .filter((t) => (isDev ? t.key !== "settings" : true))
            .map((tabItem) => (
              <button
                key={tabItem.key}
                onClick={() => {
                  setActiveTab(tabItem.key);
                  setSearchParams({ id, tab: tabItem.key });
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tabItem.key
                    ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/30"
                }`}
              >
                <tabItem.icon className="size-4" />
                {tabItem.label}
              </button>
            ))}
        </div>

        <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-2 sm:p-6 shadow-sm min-h-[400px]">
          {activeTab === "files" && (
            <ProjectFiles files={project?.files || []} />
          )}
          {activeTab === "tasks" && (
                  <ProjectTasks
                    project={project}
                    tasks={tasks}
                    setTasks={setTasks}
                  />
                )}
          {activeTab === "calendar" && (
            <ProjectCalendar project={project} tasks={tasks} />
          )}
          {activeTab === "analytics" && (
            <ProjectAnalytics tasks={tasks} project={project} />
          )}
          {activeTab === "settings" && !isDev && (
            <ProjectSettings project={project} />
          )}
        </div>
      </div>

      {showCreateTask && (
        <CreateTaskDialog
          showCreateTask={showCreateTask}
          setShowCreateTask={setShowCreateTask}
          projects={projects}
          projectId={id}
        />
      )}
    </div>
  );
}