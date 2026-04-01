import { useEffect, useState, useMemo } from "react";
import {
  UsersIcon,
  Search,
  UserPlus,
  Shield,
  Activity,
  Trash2,
  Mail,
  UserCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import InviteMemberDialog from "./components/InviteMemberDialog";
import useWorkspaceStore from "../../../store/useWorkspaceStore";
import useAuthStore from "../../../store/useAuthStore";
import { usePlanLimits } from "../../../hooks/usePlanLimits";
import FilterSelect from "../../../components/FilterSelect";
import StatCard from "../../../components/StatCard";

const Team = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [updatingRoleId, setUpdatingRoleId] = useState(null);

  const { authUser } = useAuthStore();
  const { currentWorkspace, fetchMembers, removeMember, updateMemberRole } =
    useWorkspaceStore();
  const { plan, limits, canCreate } = usePlanLimits();

  const users = currentWorkspace?.members || [];
  const workspaceId = currentWorkspace?._id || currentWorkspace?.id;

  const myMembership = users.find(
    (u) => u?.userId?._id === authUser?._id || u?.userId?._id === authUser?.id,
  );

  const isAdmin = myMembership?.role?.name === "admin";
  const isManager = myMembership?.role?.name === "manager";
  const canInviteOrManageTeam = isAdmin || isManager;
  const canRemoveTeamMember = isAdmin;
  const canInviteMore = canCreate("maxMembersInAWorkspace", users.length);

  useEffect(() => {
    if (workspaceId) fetchMembers(workspaceId);
  }, [workspaceId]);

  const teamStats = useMemo(() => {
    const managerCount = users.filter((u) => u.role?.name === "manager").length;
    const devCount = users.filter(
      (u) => u.role?.name === "dev" || !u.role?.name,
    ).length;

    const baseStats = [
      {
        label: "Total Members",
        count: users.length,
        icon: UsersIcon,
        colorClass: {
          bg: "bg-blue-50 dark:bg-blue-500/10",
          icon: "text-blue-500",
        },
      },
      {
        label: "Managers",
        count: managerCount,
        icon: Shield,
        colorClass: {
          bg: "bg-purple-50 dark:bg-purple-500/10",
          icon: "text-purple-500",
        },
      },
      {
        label: "Developers",
        count: devCount,
        icon: UserCheck,
        colorClass: {
          bg: "bg-emerald-50 dark:bg-emerald-500/10",
          icon: "text-emerald-500",
        },
      },
    ];

    if (authUser?.role?.name === "admin") {
      baseStats.push({
        label: "Workspace Limit",
        count:
          limits?.maxMembersInAWorkspace === -1
            ? "∞"
            : limits?.maxMembersInAWorkspace || 0,
        icon: Activity,
        colorClass: {
          bg: "bg-amber-50 dark:bg-amber-500/10",
          icon: "text-amber-500",
        },
      });
    }

    return baseStats;
  }, [users, limits]);

  const handleRemove = async (memberId) => {
    setRemovingId(memberId);
    const result = await removeMember(workspaceId, memberId);
    if (result.success) {
      toast.success("Member removed.");
    } else {
      toast.error(result.message);
    }
    setRemovingId(null);
  };

  const handleRoleChange = async (memberId, newRole) => {
    setUpdatingRoleId(memberId);
    const result = await updateMemberRole(workspaceId, memberId, newRole);
    if (result.success) {
      toast.success(`Role updated to ${newRole}`);
    } else {
      toast.error(result.message);
    }
    setUpdatingRoleId(null);
  };

  const filteredUsers = users.filter(
    (user) =>
      user?.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user?.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Team
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 text-sm mt-1">
            Manage your workspace members and their access levels
          </p>
        </div>

        {canInviteOrManageTeam && (
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={() => canInviteMore && setIsDialogOpen(true)}
              disabled={!canInviteMore}
              className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all shadow-sm ${
                canInviteMore
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-100 dark:bg-zinc-800 text-gray-400 cursor-not-allowed"
              }`}
            >
              <UserPlus className="size-4 mr-2" /> Invite Member
            </button>
            {!canInviteMore && (
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {teamStats.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      <div className="w-full max-w-md flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-50 dark:bg-zinc-900/30 p-4 rounded-xl border border-gray-200 dark:border-zinc-800">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            onChange={(e) => setSearchTerm(e.target.value)}
            value={searchTerm}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="Search by name or email..."
          />
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900/40 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
              <UsersIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {users.length === 0 ? "No team members yet" : "No results found"}
            </h3>
            <p className="text-gray-500 dark:text-zinc-400 text-sm mt-1">
              {users.length === 0
                ? "Start by inviting your first team member."
                : "Try adjusting your search criteria."}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50/50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-500">
                      Member
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-500">
                      Email
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-500">
                      Role
                    </th>
                    <th className="px-6 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                  {filteredUsers.map((user) => (
                    <tr
                      key={user._id}
                      className="hover:bg-gray-50 dark:hover:bg-zinc-800/30 transition-colors group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <img
                            src={user?.userId?.dp || "/default-avatar.png"}
                            alt=""
                            className="size-9 rounded-full bg-gray-200 dark:bg-zinc-800 object-cover ring-2 ring-transparent group-hover:ring-blue-500/20 transition-all"
                          />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {user?.userId?.name || "Unknown User"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-zinc-400">
                        <div className="flex items-center gap-2">
                          <Mail className="size-3.5 opacity-60" />
                          {user?.userId?.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isAdmin && user?.role?.name !== "admin" ? (
                          <FilterSelect
                            value={user?.role?.name || "dev"}
                            onChange={(newRole) =>
                              handleRoleChange(user._id, newRole)
                            }
                            options={[
                              { value: "manager", label: "Manager" },
                              { value: "dev", label: "Developer" },
                            ]}
                          />
                        ) : (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              user?.role?.name === "admin"
                                ? "bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
                                : user?.role?.name === "manager"
                                  ? "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20"
                                  : "bg-gray-50 text-gray-600 border-gray-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
                            }`}
                          >
                            {user?.role?.name || "dev"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {canRemoveTeamMember &&
                          user?.role?.name !== "admin" && (
                            <button
                              onClick={() => handleRemove(user._id)}
                              disabled={removingId === user._id}
                              className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all disabled:opacity-50"
                              title="Remove Member"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="sm:hidden divide-y divide-gray-200 dark:divide-zinc-800">
              {filteredUsers.map((user) => (
                <div
                  key={user._id}
                  className="p-4 space-y-3 bg-white dark:bg-zinc-900/40"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <img
                        src={user?.userId?.dp || "/default-avatar.png"}
                        alt=""
                        className="size-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">
                          {user?.userId?.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400">
                          {user?.userId?.email}
                        </p>
                      </div>
                    </div>
                    {canRemoveTeamMember && user?.role?.name !== "admin" && (
                      <button
                        onClick={() => handleRemove(user._id)}
                        disabled={removingId === user._id}
                        className="p-2 text-red-500 bg-red-50 dark:bg-red-500/10 rounded-lg"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    {isAdmin && user?.role?.name !== "admin" ? (
                      <FilterSelect
                        value={user?.role?.name || "dev"}
                        onChange={(newRole) =>
                          handleRoleChange(user._id, newRole)
                        }
                        options={[
                          { value: "manager", label: "Manager" },
                          { value: "dev", label: "Developer" },
                        ]}
                      />
                    ) : (
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${
                          user?.role?.name === "admin"
                            ? "text-red-500 bg-red-50 dark:bg-red-500/10"
                            : "text-zinc-500 bg-zinc-100 dark:bg-zinc-800"
                        }`}
                      >
                        {user?.role?.name?.toUpperCase() || "DEV"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <InviteMemberDialog
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
      />
    </div>
  );
};

export default Team;
