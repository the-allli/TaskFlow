import { useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, Check, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useWorkspaceStore from "../store/useWorkspaceStore";
import CreateWorkspaceModal from "../components/WorkspaceModal";
import useAuthStore from "../store/useAuthStore";
import useModal from "../hooks/useModal";
import useClickOutside from "../hooks/useClickOutside";
import defaultWorkspaceImg from "../assets/workspace_img_default.png";
import { usePlanLimits } from "../hooks/usePlanLimits";

function WorkspaceDropdown() {
  const { workspaces, currentWorkspace, setCurrentWorkspace, fetchWorkspaces } =
    useWorkspaceStore();
  const { authUser } = useAuthStore();
  const { plan, canCreate } = usePlanLimits();

  const dropdown = useModal();
  const createModal = useModal();

  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const canCreateWorkspace = canCreate("maxWorkspaces", workspaces.length);

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  useClickOutside(dropdownRef, dropdown.close);

  const onSelectWorkspace = (organizationId) => {
    setCurrentWorkspace(organizationId);
    dropdown.close();
    navigate("/dashboard");
  };

  return (
    <>
      <div className="relative m-4" ref={dropdownRef}>
        <button
          onClick={dropdown.toggle}
          className={`w-full flex items-center justify-between h-auto text-left rounded ${
            dropdown.isOpen
              ? "bg-gray-100 dark:bg-zinc-800"
              : "hover:bg-gray-100 dark:hover:bg-zinc-800"
          }`}
        >
          <div className="flex items-center gap-3">
            <img
              src={currentWorkspace?.image_url || defaultWorkspaceImg}
              alt={currentWorkspace?.name}
              className="w-8 h-8 rounded shadow"
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-800 dark:text-white text-sm truncate">
                {currentWorkspace?.name || "Select Workspace"}
              </p>
            </div>
          </div>
          {dropdown.isOpen ? (
            <ChevronUp className="w-4 h-4 text-gray-500 dark:text-zinc-400 shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500 dark:text-zinc-400 shrink-0" />
          )}
        </button>

        {dropdown.isOpen && (
          <div className="absolute z-50 w-42 sm:w-47 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg top-full left-0">
            <div className="p-2">
              <p className="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2 px-2">
                Workspaces
              </p>
              {workspaces.map((ws) => (
                <div
                  key={ws.id}
                  onClick={() => onSelectWorkspace(ws.id)}
                  className="flex items-center gap-3 p-2 cursor-pointer rounded hover:bg-gray-100 dark:hover:bg-zinc-800"
                >
                  <img
                    src={ws.image_url || defaultWorkspaceImg}
                    alt={ws.name}
                    className="w-6 h-6 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                      {ws.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">
                      {ws.members.length || 0} members
                    </p>
                  </div>
                  {currentWorkspace?.id === ws.id && (
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  )}
                </div>
              ))}
            </div>

            <hr className="border-gray-200 dark:border-zinc-700" />

            {authUser?.role?.name === "admin" && (
              <div className="p-2">
                {canCreateWorkspace ? (
                  <button
                    onClick={() => {
                      dropdown.close();
                      createModal.open();
                    }}
                    className="flex items-center text-xs gap-2 my-1 w-full text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 cursor-pointer rounded p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Create Workspace
                  </button>
                ) : (
                  <div className="px-1 py-1.5">
                    <p className="text-xs text-gray-400 dark:text-zinc-500">
                      Workspace limit reached.{" "}
                      <a
                        href="/dashboard/payment"
                        className="text-amber-500 underline hover:text-amber-600"
                        onClick={dropdown.close}
                      >
                        Upgrade
                      </a>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {createModal.isOpen && (
        <CreateWorkspaceModal onClose={createModal.close} />
      )}
    </>
  );
}

export default WorkspaceDropdown;
