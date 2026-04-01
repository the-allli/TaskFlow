import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Check,
  CreditCard,
  Clock,
  AlertTriangle,
  Download,
  Loader,
  ShieldCheck,
  Zap,
  History,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import useWorkspaceStore from "../../../store/useWorkspaceStore";
import usePaymentStore from "../../../store/usePaymentStore";
import useAuthStore from "../../../store/useAuthStore";

const statusBadge = {
  active:
    "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  cancelled:
    "bg-red-50 text-red-700 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
  past_due:
    "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  inactive:
    "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
  trialing:
    "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
};

const Payment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { authUser, checkAuth } = useAuthStore();
  const { currentWorkspace } = useWorkspaceStore();
  const {
    subscription,
    history,
    loading,
    checkout,
    cancelSubscription,
    downgradeToFree,
    subPlans,
    fetchSubscription,
    fetchHistory,
  } = usePaymentStore();

  const [checkingOut, setCheckingOut] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [downgrading, setDowngrading] = useState(false);
  const [activeTab, setActiveTab] = useState("plans");

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Subscription activated successfully!");
      checkAuth();
      navigate("/dashboard/payment", { replace: true });
    }
    if (searchParams.get("cancelled") === "true") {
      toast.error("Payment cancelled.");
      navigate("/dashboard/payment", { replace: true });
    }
  }, [searchParams, checkAuth, navigate]);

  useEffect(() => {
    if (authUser && authUser.role?.name !== "admin") {
      toast.error("Only the billing admin can manage subscriptions.");
      navigate("/dashboard", { replace: true });
    }
  }, [authUser, navigate]);

  const getPlanFeatures = (plan) => {
    const { limits } = plan;
    const f = (val) => (val === -1 ? "Unlimited" : val);
    return [
      { text: `${f(limits.maxWorkspaces)} Workspaces` },
      { text: `${f(limits.maxProjectsInAWorkspace)} Projects / workspace` },
      { text: `${f(limits.maxMembersInAWorkspace)} Members / workspace` },
      { text: `${f(limits.maxTasksInAProject)} Tasks / project` },
    ];
  };

  const normalizePlanKey = (plan) =>
    (plan?.key || plan?.name || "").toString().toLowerCase();

  const isCurrentPlan = (planKey) => {
    const currentPlan = subscription?.planId?.name || "free";
    const normalizedCurrent = currentPlan.toLowerCase();
    const normalizedTarget = (planKey || "").toLowerCase();
    if (normalizedTarget === "free") {
      return (
        !subscription ||
        normalizedCurrent === "free" ||
        subscription?.status === "inactive"
      );
    }
    return (
      normalizedCurrent === normalizedTarget &&
      subscription?.status === "active"
    );
  };

  const currentPlanWeight =
    subPlans?.find((p) => {
      const key = normalizePlanKey(p);
      const currentPlan = normalizePlanKey({
        name: subscription?.planId?.name,
      });
      return !subscription || subscription.status === "inactive"
        ? key === "free"
        : key === currentPlan;
    })?.weight ?? 0;

  const formatDate = (date) =>
    date ? format(new Date(date), "MMM d, yyyy") : "—";

  const formatAmount = (amount, currency = "usd") => {
    const value = amount > 1000 ? amount / 100 : amount;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(value);
  };

  const handleCheckout = async (planKey) => {
    if (planKey === "free") {
      if (
        !window.confirm(
          "Confirm downgrade to Free? Limits will apply immediately.",
        )
      )
        return;
      setDowngrading(true);
      const result = await downgradeToFree(authUser?.id);
      if (result.success) {
        toast.success("Downgraded to Free.");
        // Refresh subscription and payment history
        await fetchSubscription(authUser?.id);
        await fetchHistory(authUser?.id);
        await checkAuth();
      } else {
        toast.error(result.message || "Downgrade failed.");
      }
      setDowngrading(false);
      return;
    }
    setCheckingOut(planKey);
    const result = await checkout(planKey);
    if (result.success) {
      if (result.url) {
        window.location.href = result.url;
      } else {
        toast.success("Plan updated successfully!");
        await fetchSubscription(authUser?.id);
        await fetchHistory(authUser?.id);
        await checkAuth();
        setCheckingOut(null);
      }
    } else {
      toast.error(result.message);
      setCheckingOut(null);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Billing & Plans
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Current Workspace:{" "}
            <span className="font-bold text-zinc-900 dark:text-zinc-200">
              {currentWorkspace?.name}
            </span>
          </p>
        </div>

        <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setActiveTab("plans")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === "plans" ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
          >
            <Zap className="size-4" /> Plans
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === "history" ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
          >
            <History className="size-4" /> History
          </button>
        </div>
      </div>

      {subscription && subscription.status !== "inactive" && (
        <div
          className={`relative overflow-hidden rounded-3xl border shadow-sm p-6 sm:p-8 ${
            subscription.status === "past_due"
              ? "border-amber-200 bg-amber-50/50 dark:bg-amber-500/5"
              : "border-blue-200 bg-blue-50/30 dark:bg-blue-500/5"
          }`}
        >
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="size-14 rounded-2xl bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                <ShieldCheck
                  className={`size-8 ${subscription.status === "past_due" ? "text-amber-500" : "text-blue-500"}`}
                />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold capitalize text-zinc-900 dark:text-white">
                    {subscription?.planId?.name} Membership
                  </h2>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${statusBadge[subscription.status]}`}
                  >
                    {subscription.cancelAtPeriodEnd
                      ? "Ending Soon"
                      : subscription.status}
                  </span>
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  {subscription.cancelAtPeriodEnd
                    ? "Access expires on "
                    : "Your next automatic renewal: "}
                  <span className="font-bold text-zinc-700 dark:text-zinc-200">
                    {formatDate(subscription.currentPeriodEnd)}
                  </span>
                </p>
              </div>
            </div>

            {!subscription.cancelAtPeriodEnd && (
              <button
                onClick={() => !cancelling && cancelSubscription(authUser?.id)}
                className="group flex items-center gap-2 text-sm font-bold text-red-500 hover:text-red-600 transition-colors"
              >
                Cancel Plan{" "}
                <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>
      )}

      {activeTab === "plans" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {subPlans
            ?.sort((a, b) => (a.weight || 0) - (b.weight || 0))
            .map((plan) => {
              const planKey = normalizePlanKey(plan);
              const isCurrent = isCurrentPlan(planKey);
              const isUpgrade = (plan.weight ?? 0) > currentPlanWeight;
              const isPro = plan.key === "ultimate";

              return (
                <div
                  key={plan._id}
                  className={`relative flex flex-col p-8 rounded-[2.5rem] border transition-all duration-500 ${
                    isCurrent
                      ? "border-blue-500 bg-white dark:bg-zinc-900 shadow-xl ring-1 ring-blue-500/20 z-10 md:scale-105"
                      : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 opacity-90 hover:opacity-100"
                  }`}
                >
                  {isPro && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-tighter shadow-lg">
                      Most Popular
                    </div>
                  )}

                  <div className="mb-8">
                    <p className="text-sm font-bold text-blue-500 uppercase tracking-widest mb-2">
                      {plan.name}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-black text-zinc-900 dark:text-white">
                        ${plan.price}
                      </span>
                      <span className="text-zinc-400 text-sm font-medium">
                        /mo
                      </span>
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-4 leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  <button
                    onClick={() => handleCheckout(planKey)}
                    disabled={isCurrent || checkingOut === planKey}
                    className={`w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
                      isCurrent
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed border border-zinc-200 dark:border-zinc-700"
                        : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:scale-[1.02] active:scale-95 shadow-xl"
                    }`}
                  >
                    {checkingOut === planKey ? (
                      <Loader className="size-4 animate-spin" />
                    ) : isCurrent ? (
                      "Active Now"
                    ) : isUpgrade ? (
                      "Upgrade Plan"
                    ) : (
                      "Downgrade"
                    )}
                  </button>

                  <div className="mt-10 space-y-5 flex-1">
                    <div className="h-px bg-zinc-200 dark:bg-zinc-800 w-full" />
                    <ul className="space-y-4">
                      {getPlanFeatures(plan).map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-3">
                          <div className="rounded-full bg-blue-500/10 p-1 text-blue-500">
                            <Check className="size-3" strokeWidth={4} />
                          </div>
                          <span className="text-sm text-zinc-600 dark:text-zinc-300 font-medium">
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {activeTab === "history" && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm animate-in slide-in-from-bottom-2">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-4">
              <Loader className="size-8 animate-spin text-blue-500" />
              <p className="text-zinc-500 font-medium">Loading ledger...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="py-24 text-center">
              <History className="size-12 mx-auto text-zinc-300 mb-4" />
              <p className="text-zinc-500 font-medium">
                No payment history available yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-tighter text-zinc-400">
                      Date
                    </th>
                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-tighter text-zinc-400">
                      Plan
                    </th>
                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-tighter text-zinc-400">
                      Amount
                    </th>
                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-tighter text-zinc-400">
                      Status
                    </th>
                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-tighter text-zinc-400 text-right">
                      Invoice
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {history.map((item) => (
                    <tr
                      key={item._id}
                      className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors"
                    >
                      <td className="px-8 py-5 text-sm text-zinc-600 dark:text-zinc-400">
                        {formatDate(item.invoiceDate)}
                      </td>
                      <td className="px-8 py-5 text-sm font-bold text-zinc-900 dark:text-white capitalize">
                        {item?.planId?.name}
                      </td>
                      <td className="px-8 py-5 text-sm font-black">
                        {formatAmount(item?.amount, item.currency)}
                      </td>
                      <td className="px-8 py-5">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${item.status === "paid" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        {item.invoicePdfUrl && (
                          <a
                            href={item.invoicePdfUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-xs font-bold text-blue-500 hover:text-blue-600 bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <Download className="size-3" /> PDF
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Payment;
