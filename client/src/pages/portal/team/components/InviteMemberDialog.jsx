import { useState, useRef } from "react";
import { Mail, UserPlus, X } from "lucide-react";
import toast from "react-hot-toast";
import useWorkspaceStore from "../../../../store/useWorkspaceStore.js";
import { axiosInstance } from "../../../../lib/axios.js";
import useClickOutside from "../../../../hooks/useClickOutside";

const InviteMemberDialog = ({ isDialogOpen, setIsDialogOpen }) => {
  const { currentWorkspace, fetchInvites } = useWorkspaceStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    role: "manager",
  });

  const modalRef = useRef(null);

  useClickOutside(modalRef, () => {
    if (isDialogOpen) setIsDialogOpen(false);
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axiosInstance.post(
        `/workspace/${currentWorkspace._id}/invite`,
        formData,
      );
      toast.success("Invitation email sent!");
      setFormData({ email: "", role: "manager" });
      setIsDialogOpen(false);
      // Refresh the pending invites list
      fetchInvites(currentWorkspace._id);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to send invitation.",
      );
    } finally {
      setIsSubmitting(false);
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
          className="absolute top-4 right-4 p-1 rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Close dialog"
        >
          <X className="size-5" />
        </button>

        <div className="mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <UserPlus className="size-5 text-zinc-900 dark:text-zinc-200" />
            Invite Team Member
          </h2>
          {currentWorkspace && (
            <p className="text-sm text-zinc-700 dark:text-zinc-400">
              Inviting to workspace:{" "}
              <span className="text-blue-600 dark:text-blue-400">
                {currentWorkspace?.name}
              </span>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-zinc-900 dark:text-zinc-200"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 w-4 h-4" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="Enter email address"
                className="pl-10 mt-1 w-full rounded border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-200 text-sm placeholder-zinc-400 dark:placeholder-zinc-500 py-2 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-900 dark:text-zinc-200">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 text-sm cursor-pointer hover:border-blue-400 dark:hover:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-position-[right_10px_center] pr-8"
            >
              <option value="manager">Manager</option>
              <option value="dev">Dev</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsDialogOpen(false)}
              className="px-5 py-2 rounded text-sm border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !currentWorkspace}
              className="px-5 py-2 rounded text-sm bg-linear-to-br from-blue-500 to-blue-600 text-white disabled:opacity-50 hover:opacity-90 transition"
            >
              {isSubmitting ? "Sending..." : "Send Invitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteMemberDialog;
