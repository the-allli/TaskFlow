import StatsGrid from "./components/StatsGrid";
import ProjectOverview from "./components/ProjectOverview";
import RecentActivity from "./components/RecentActivity";
import TasksSummary from "./components/TasksSummary";
import useAuthStore from "../../../store/useAuthStore";
import PerformanceCharts from "./components/PerformanceCharts";

const Dashboard = () => {
  const { authUser } = useAuthStore();

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Welcome back, {authUser?.name || "User"}
            </h1>
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <p className="text-sm sm:text-base">
                Monitoring your workspace in real-time.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <StatsGrid />

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-8">
            <PerformanceCharts />
            <ProjectOverview />
          </div>
          <div className="space-y-8">
            <TasksSummary />
            <RecentActivity />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
