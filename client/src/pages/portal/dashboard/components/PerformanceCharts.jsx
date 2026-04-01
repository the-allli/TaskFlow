import React, { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { PieChart as PieIcon, Info } from "lucide-react";
import useWorkspaceStore from "../../../../store/useWorkspaceStore";
import useAuthStore from "../../../../store/useAuthStore";
import FilterSelect from "../../../../components/FilterSelect";

const STATUS_COLORS = {
  TODO: "#94a3b8",
  IN_PROGRESS: "#3b82f6",
  IN_REVIEW: "#8b5cf6",
  DONE: "#10b981",
};

const PRIORITY_COLORS = {
  LOW: "#94a3b8",
  MEDIUM: "#f59e0b",
  HIGH: "#ef4444",
  URGENT: "#7f1d1d",
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl shadow-2xl min-w-[160px] backdrop-blur-md bg-opacity-95">
        <p className="font-bold text-white mb-2 border-b border-zinc-800 pb-1.5 truncate text-xs">
          {data.name}
        </p>
        <div className="space-y-2">
          <div className="flex justify-between items-center gap-4">
            <span className="text-zinc-400 text-[10px] uppercase tracking-wider font-medium">
              Progress
            </span>
            <span className="text-blue-400 font-bold text-xs">
              {data.progress}%
            </span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-zinc-400 text-[10px] uppercase tracking-wider font-medium">
              Tasks
            </span>
            <span className="text-zinc-200 text-xs font-medium">
              {data.completedTasks} / {data.totalTasks}
            </span>
          </div>
          <div className="mt-1 pt-1 border-t border-zinc-800/50 flex justify-between items-center">
            <span className="text-zinc-500 text-[10px]">{data.status}</span>
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: PRIORITY_COLORS[data.priority] }}
            />
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function PerformanceCharts() {
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

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [selectedProjectId, setSelectedProjectId] = useState("ALL");

  const projectData = useMemo(() => {
    if (!accessibleProjects) return [];
    return accessibleProjects
      .filter((p) => {
        const matchStatus = statusFilter === "ALL" || p.status === statusFilter;
        const matchPriority =
          priorityFilter === "ALL" || p.priority === priorityFilter;
        return matchStatus && matchPriority;
      })
      .map((p) => ({
        name: p.name,
        progress: p.progress || 0,
        priority: p.priority,
        status: p.status,
        totalTasks: p.tasks?.length || 0,
        completedTasks: p.tasks?.filter((t) => t.status === "DONE").length || 0,
      }))
      .slice(0, 8);
  }, [accessibleProjects, statusFilter, priorityFilter]);

  const taskDistribution = useMemo(() => {
    if (!accessibleProjects) return [];

    const taskCounts = { TODO: 0, IN_PROGRESS: 0, IN_REVIEW: 0, DONE: 0 };
    const targetProjects =
      selectedProjectId === "ALL"
        ? accessibleProjects
        : accessibleProjects.filter(
            (p) => (p._id || p.id) === selectedProjectId,
          );

    targetProjects.forEach((project) => {
      (project.tasks || []).forEach((task) => {
        if (taskCounts[task.status] !== undefined) taskCounts[task.status]++;
      });
    });

    return Object.keys(taskCounts)
      .map((key) => ({
        name: key.replace("_", " "),
        statusKey: key,
        value: taskCounts[key],
      }))
      .filter((item) => item.value > 0);
  }, [accessibleProjects, selectedProjectId]);

  if (!currentWorkspace) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <div className="lg:col-span-2 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              Project Performance
              <Info size={14} className="text-zinc-400 cursor-help" />
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Completion percentage per project
            </p>
          </div>
          <div className="flex gap-2">
            <FilterSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: "All Status", value: "ALL" },
                { label: "Active", value: "ACTIVE" },
                { label: "Completed", value: "COMPLETED" },
              ]}
            />
            <FilterSelect
              value={priorityFilter}
              onChange={setPriorityFilter}
              options={[
                { label: "All Priority", value: "ALL" },
                { label: "High", value: "HIGH" },
                { label: "Medium", value: "MEDIUM" },
              ]}
            />
          </div>
        </div>

        <div className="h-[280px] w-full">
          {projectData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={projectData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#3f3f46"
                  opacity={0.1}
                />
                <XAxis
                  dataKey="name"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#71717a" }}
                  dy={10}
                />
                <YAxis
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#71717a" }}
                  domain={[0, 100]}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "rgba(39, 39, 42, 0.3)" }}
                />
                <Bar dataKey="progress" radius={[6, 6, 0, 0]} barSize={32}>
                  {projectData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        entry.progress === 100
                          ? STATUS_COLORS.DONE
                          : STATUS_COLORS.IN_PROGRESS
                      }
                      className="transition-all duration-300 hover:opacity-80"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-zinc-500 italic bg-zinc-50/50 dark:bg-zinc-800/20 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
              No matching projects found
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm backdrop-blur-sm">
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Task Overview
          </h3>
          <div className="mt-3">
            <FilterSelect
              value={selectedProjectId}
              onChange={setSelectedProjectId}
              options={[
                { label: "Full Workspace", value: "ALL" },
                ...accessibleProjects.map((p) => ({
                  label: p.name,
                  value: p._id || p.id,
                })),
              ]}
            />
          </div>
        </div>

        <div className="h-[240px] w-full">
          {taskDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskDistribution}
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {taskDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STATUS_COLORS[entry.statusKey]}
                      className="hover:opacity-80 transition-opacity cursor-pointer"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "11px",
                    color: "#fff",
                  }}
                  itemStyle={{ color: "#fff" }}
                />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  iconType="circle"
                  wrapperStyle={{ fontSize: "11px", paddingTop: "20px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 bg-zinc-50/50 dark:bg-zinc-800/20 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
              <PieIcon size={24} className="mb-2 opacity-20 text-zinc-400" />
              <p className="text-[11px] font-medium">No tasks logged</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
