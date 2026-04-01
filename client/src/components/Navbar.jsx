import { useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderOpen,
  Square,
  SearchIcon,
  PanelLeft,
  X,
  MoonIcon,
  SunIcon,
  LogOut,
  User,
} from "lucide-react";
import useThemeStore from "../store/useThemeStore";
import useAuthStore from "../store/useAuthStore";
import useWorkspaceStore from "../store/useWorkspaceStore";
import { ProfileModal } from "./ProfileModal";
import useModal from "../hooks/useModal";
import useClickOutside from "../hooks/useClickOutside";

const Navbar = ({ onSidebarToggle }) => {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const { authUser, logout } = useAuthStore();
  const { currentWorkspace } = useWorkspaceStore();
  const navigate = useNavigate();

  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  const dropdown = useModal();
  const profileModal = useModal();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  useClickOutside(dropdownRef, dropdown.close);
  useClickOutside(searchRef, () => setSearchOpen(false));

  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !currentWorkspace)
      return { projects: [], tasks: [] };

    const q = searchQuery.toLowerCase();

    const projects = (currentWorkspace.projects || [])
      .filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q),
      )
      .slice(0, 4);

    const tasks = (currentWorkspace.projects || [])
      .flatMap((p) =>
        (p.tasks || []).map((t) => ({
          ...t,
          projectName: p.name,
          projectId: p._id || p.id,
        })),
      )
      .filter(
        (t) =>
          t.title?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q),
      )
      .slice(0, 4);

    return { projects, tasks };
  }, [searchQuery, currentWorkspace]);

  const hasResults =
    searchResults.projects.length > 0 || searchResults.tasks.length > 0;

  const handleProjectClick = (project) => {
    const pid = project._id || project.id;
    navigate(`/dashboard/projects/projectsDetail?id=${pid}&tab=tasks`);
    setSearchQuery("");
    setSearchOpen(false);
  };

  const handleTaskClick = (task) => {
    const tid = task._id || task.id;
    navigate(
      `/dashboard/tasks/taskDetails?projectId=${task.projectId}&taskId=${tid}`,
    );
    setSearchQuery("");
    setSearchOpen(false);
  };

  return (
    <>
      <div className="w-full bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-6 xl:px-16 py-3.25 shrink-0">
        <div className="flex items-center gap-5 justify-between mx-auto">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <button
              onClick={onSidebarToggle}
              className="sm:hidden p-2 rounded-lg transition-colors text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800"
            >
              <PanelLeft size={20} />
            </button>

            <div className="relative flex-1 max-w-xs" ref={searchRef}>
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-400 size-3.5 z-10" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search projects, tasks..."
                className="pl-8 pr-8 py-2 w-full bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-md text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSearchOpen(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200"
                >
                  <X className="size-3.5" />
                </button>
              )}

              {searchOpen && searchQuery.trim() && (
                <div className="absolute top-full left-0 mt-1 w-80 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden">
                  {!hasResults ? (
                    <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-zinc-400">
                      No results for "{searchQuery}"
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">
                      {searchResults.projects.length > 0 && (
                        <div>
                          <p className="px-3 pt-3 pb-1 text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                            Projects
                          </p>
                          {searchResults.projects.map((project) => {
                            const pid = project._id || project.id;
                            return (
                              <button
                                key={pid}
                                onClick={() => handleProjectClick(project)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-zinc-800 transition text-left"
                              >
                                <div className="p-1.5 bg-blue-100 dark:bg-blue-500/10 rounded">
                                  <FolderOpen className="size-3.5 text-blue-500" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {project.name}
                                  </p>
                                  {project.description && (
                                    <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">
                                      {project.description}
                                    </p>
                                  )}
                                </div>
                                <span
                                  className={`ml-auto text-xs px-1.5 py-0.5 rounded shrink-0 ${
                                    project.status === "ACTIVE"
                                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                                      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
                                  }`}
                                >
                                  {project.status?.replace("_", " ")}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {searchResults.tasks.length > 0 && (
                        <div>
                          <p className="px-3 pt-3 pb-1 text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                            Tasks
                          </p>
                          {searchResults.tasks.map((task) => {
                            const tid = task._id || task.id;
                            return (
                              <button
                                key={tid}
                                onClick={() => handleTaskClick(task)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-zinc-800 transition text-left"
                              >
                                <div className="p-1.5 bg-purple-100 dark:bg-purple-500/10 rounded">
                                  <Square className="size-3.5 text-purple-500" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {task.title}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">
                                    {task.projectName}
                                  </p>
                                </div>
                                <span
                                  className={`ml-auto text-xs px-1.5 py-0.5 rounded shrink-0 ${
                                    task.status === "DONE"
                                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                                      : task.status === "IN_PROGRESS"
                                        ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
                                  }`}
                                >
                                  {task.status?.replace("_", " ")}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="size-8 flex items-center justify-center bg-white dark:bg-zinc-800 shadow rounded-lg transition hover:scale-105 active:scale-95"
            >
              {theme === "light" ? (
                <MoonIcon className="size-5 text-gray-800 dark:text-gray-200" />
              ) : (
                <SunIcon className="size-5 text-yellow-400" />
              )}
            </button>

            <div className="relative" ref={dropdownRef}>
              <img
                src={authUser?.dp}
                alt={authUser?.name}
                onClick={dropdown.toggle}
                className="size-8 rounded-full cursor-pointer ring-2 ring-transparent hover:ring-blue-500 transition"
              />
              {dropdown.isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {authUser?.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">
                      {authUser?.email}
                    </p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        dropdown.close();
                        profileModal.open();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-700 transition"
                    >
                      <User size={15} /> Profile
                    </button>
                    <button
                      onClick={() => {
                        dropdown.close();
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
                    >
                      <LogOut size={15} /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {profileModal.isOpen && (
        <ProfileModal onClose={profileModal.close} authUser={authUser} />
      )}
    </>
  );
};

export default Navbar;
