import { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import WorkspaceDropdown from "./WorkspaceDropdown";
import useWorkspaceStore from "../store/useWorkspaceStore";
import useAuthStore from "../store/useAuthStore";
import useClickOutside from "../hooks/useClickOutside";
import { allMenuItems } from "../constants";

const Sidebar = ({ isSidebarOpen, onSidebarClose }) => {
  const { currentWorkspace, fetchMembers } = useWorkspaceStore();
  const { authUser } = useAuthStore();
  const userId = authUser?._id || authUser?.id;
  const globalRole = authUser?.role?.name;

  const myMembership = currentWorkspace?.members?.find((m) => {
    const memberId = m?.userId?._id ?? m?.userId?.id ?? m?.userId;
    return memberId?.toString() === userId?.toString();
  });

  const isWorkspaceAdmin = myMembership?.role?.name === "admin";
  const isAdmin = globalRole === "admin";

  const canAccess = (item) => {
    if (!item.restrictedTo) return true;
    const r = item.restrictedTo;
    if (r.includes("globalAdmin")) return isAdmin;
    if (r.includes("workspaceAdmin")) return isWorkspaceAdmin;
    return true;
  };

  useEffect(() => {
    const workspaceId = currentWorkspace?.id || currentWorkspace?._id;
    if (workspaceId) fetchMembers(workspaceId);
  }, [currentWorkspace?.id, currentWorkspace?._id, fetchMembers]);

  const menuItems = allMenuItems.filter(canAccess);
  const sidebarRef = useRef(null);
  useClickOutside(sidebarRef, onSidebarClose);

  return (
    <div
      ref={sidebarRef}
      className={`z-11 bg-white dark:bg-zinc-900 min-w-55 flex flex-col h-screen border-r border-gray-200 dark:border-zinc-800 max-sm:absolute transition-all ${isSidebarOpen ? "left-0" : "-left-full"}`}
    >
      <WorkspaceDropdown />
      <hr className="border-gray-200 dark:border-zinc-800" />
      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col px-3 py-4">
        <nav className="space-y-[2px]">
          {menuItems.map((item) => (
            <NavLink
              to={item.href}
              key={item.name}
              end={item.end}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 py-2 px-3 rounded-md transition-colors duration-150 ${
                  isActive
                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold shadow-sm"
                    : "text-zinc-600 dark:text-zinc-400 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 w-[3px] h-5 bg-blue-600 dark:bg-blue-500 rounded-full" />
                  )}

                  <item.icon
                    size={18}
                    className={`${isActive ? "text-blue-600 dark:text-blue-400" : "text-zinc-400 group-hover:text-zinc-500"}`}
                  />

                  <span className="text-[13.5px] tracking-tight truncate">
                    {item.name}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
