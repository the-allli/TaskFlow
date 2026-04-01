import { useState, useRef } from "react";
import { UserPlus, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import useWorkspaceStore from "../../../../store/useWorkspaceStore";
import { axiosInstance } from "../../../../lib/axios";
import useClickOutside from "../../../../hooks/useClickOutside";

const AddProjectMember = ({ isDialogOpen, setIsDialogOpen }) => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");

  const { currentWorkspace } = useWorkspaceStore();

  const modalRef = useRef(null);
  useClickOutside(modalRef, () => {
    if (isDialogOpen) setIsDialogOpen(false);
  });

  const project = currentWorkspace?.projects?.find(
    (p) => p._id === id || p.id === id || p._id?.toString() === id,
  );

  const projectMemberIds =
    project?.members?.map(
      (m) => m?.userId?._id?.toString() || m?.userId?.toString(),
    ) || [];

  const availableMembers =
    currentWorkspace?.members?.filter((m) => {
      const uid = m?.userId?._id?.toString() || m?.userId?.id?.toString();
      return !projectMemberIds.includes(uid);
    }) || [];

  const [selectedUserId, setSelectedUserId] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return toast.error("Please select a member.");

    setIsAdding(true);
    try {
      await axiosInstance.post(
        `/workspace/${currentWorkspace?.id || currentWorkspace?._id}/projects/${
          project?._id || project?.id
        }/members`,
        { userId: selectedUserId },
      );
      toast.success("Member added to project!");
      setSelectedUserId("");
      setIsDialogOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add member.");
    } finally {
      setIsAdding(false);
    }
  };

  if (!isDialogOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="relative bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl p-6 w-full max-w-md text-zinc-900 dark:text-zinc-200"
      >
        <button
          onClick={() => setIsDialogOpen(false)}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
        >
          <X className="size-5" />
        </button>

        <div className="mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <UserPlus className="size-5" /> Add Member to Project
          </h2>
          {project && (
            <p className="text-sm text-zinc-700 dark:text-zinc-400 mt-1">
              Adding to:{" "}
              <span className="text-blue-600 dark:text-blue-400">
                {project.name}
              </span>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-900 dark:text-zinc-200">
              Select Member
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 text-sm cursor-pointer hover:border-blue-400 dark:hover:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-position-[right_10px_center] pr-8"
              required
            >
              <option value="">Select a workspace member</option>
              {availableMembers.map((member) => {
                const uid = member?.userId?._id || member?.userId?.id;
                const name = member?.userId?.name || "Unknown";
                const email = member?.userId?.email || "";
                return (
                  <option key={uid} value={uid}>
                    {name} ({email})
                  </option>
                );
              })}
            </select>

            {availableMembers.length === 0 && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                All workspace members are already in this project.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsDialogOpen(false)}
              className="px-5 py-2 text-sm rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAdding || !selectedUserId}
              className="px-5 py-2 text-sm rounded bg-linear-to-br from-blue-500 to-blue-600 text-white hover:opacity-90 disabled:opacity-50 transition"
            >
              {isAdding ? "Adding..." : "Add Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProjectMember;
