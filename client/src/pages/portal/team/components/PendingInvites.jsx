import { useState } from "react";
import { Mail, RefreshCw, Clock, UserX } from "lucide-react";
import toast from "react-hot-toast";
import useWorkspaceStore from "../../../../store/useWorkspaceStore";
import FilterSelect from "../../../../components/FilterSelect";

const PendingInvites = () => {
  const [resendingId, setResendingId] = useState(null);
  const [roleChanges, setRoleChanges] = useState({});

  const { currentWorkspace, resendInvite } = useWorkspaceStore();
  const pendingInvites = currentWorkspace?.pendingInvites || [];

  const handleRoleChange = (inviteId, newRole) => {
    setRoleChanges((prev) => ({
      ...prev,
      [inviteId]: newRole,
    }));
  };

  const handleResend = async (inviteId, email) => {
    const selectedRole = roleChanges[inviteId] || "dev";
    
    setResendingId(inviteId);
    try {
      const result = await resendInvite(currentWorkspace._id, inviteId, selectedRole);
      if (result.success) {
        toast.success(`Invitation resent to ${email} as ${selectedRole}`);
        // Clear the role change after successful resend
        setRoleChanges((prev) => {
          const updated = { ...prev };
          delete updated[inviteId];
          return updated;
        });
      } else {
        toast.error(result.message || "Failed to resend invitation");
      }
    } catch (error) {
      toast.error(error.message || "Failed to resend invitation");
    } finally {
      setResendingId(null);
    }
  };

  if (!pendingInvites || pendingInvites.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900/40 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            No pending invites
          </h3>
          <p className="text-gray-500 dark:text-zinc-400 text-sm mt-1">
            All invitations have been accepted or there are no pending invites yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900/40 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/30">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Clock className="size-5 text-amber-500" />
          Pending Invites ({pendingInvites.length})
        </h2>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
          Track and manage pending workspace invitations
        </p>
      </div>

      {/* Desktop View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50/50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-800">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-500">
                Email
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-500">
                Role
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-500">
                Invited Date
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-500">
                Status
              </th>
              <th className="px-6 py-4 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
            {pendingInvites.map((invite) => (
              <tr
                key={invite._id}
                className="hover:bg-gray-50 dark:hover:bg-zinc-800/30 transition-colors group"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-full bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center">
                      <UserX className="size-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {invite.email}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <FilterSelect
                    value={roleChanges[invite._id] || invite.role?.name || "dev"}
                    onChange={(newRole) => handleRoleChange(invite._id, newRole)}
                    options={[
                      { value: "manager", label: "Manager" },
                      { value: "dev", label: "Developer" },
                    ]}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-zinc-400">
                  <div className="flex items-center gap-2">
                    <Clock className="size-3.5 opacity-60" />
                    {new Date(invite.sentAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
                    {invite.status || "Pending"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleResend(invite._id, invite.email)}
                    disabled={resendingId === invite._id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Resend Invitation"
                  >
                    <RefreshCw
                      className={`size-4 ${resendingId === invite._id ? "animate-spin" : ""}`}
                    />
                    {resendingId === invite._id ? "Sending..." : "Resend"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="sm:hidden divide-y divide-gray-200 dark:divide-zinc-800">
        {pendingInvites.map((invite) => (
          <div
            key={invite._id}
            className="p-4 space-y-3 bg-white dark:bg-zinc-900/40"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center">
                  <UserX className="size-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {invite.email}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">
                    Invited on{" "}
                    {new Date(invite.sentAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <span className="px-2 py-1 text-xs font-semibold rounded bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                {invite.status || "Pending"}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <FilterSelect
                value={roleChanges[invite._id] || invite.role?.name || "dev"}
                onChange={(newRole) => handleRoleChange(invite._id, newRole)}
                options={[
                  { value: "manager", label: "Manager" },
                  { value: "dev", label: "Developer" },
                ]}
              />
              <button
                onClick={() => handleResend(invite._id, invite.email)}
                disabled={resendingId === invite._id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 transition-all disabled:opacity-50"
              >
                <RefreshCw
                  className={`size-4 ${resendingId === invite._id ? "animate-spin" : ""}`}
                />
                {resendingId === invite._id ? "Sending..." : "Resend"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingInvites;
