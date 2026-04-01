import usePaymentStore from "../store/usePaymentStore";
import useWorkspaceStore from "../store/useWorkspaceStore";

export const usePlanLimits = () => {
  const { subscription: userSubscription, subPlans } = usePaymentStore();
  const { currentWorkspace } = useWorkspaceStore();

  const subscription =
    currentWorkspace?.subscriptionId &&
    typeof currentWorkspace.subscriptionId === "object"
      ? currentWorkspace.subscriptionId
      : userSubscription;

  const planKey =
    subscription?.status === "active" &&
    (subscription.planId?.name || subscription.planId?.key)
      ? (subscription.planId?.name || subscription.planId?.key).toLowerCase()
      : "free";

  const planData =
    subPlans?.find((p) =>
      p.key
        ? p.key.toLowerCase() === planKey
        : p.name?.toLowerCase() === planKey,
    ) ||
    subPlans?.find((p) => p.name?.toLowerCase() === planKey) ||
    (subscription?.planId && {
      key: subscription.planId.name?.toLowerCase() || subscription.planId.key,
      name: subscription.planId.name,
      limits: subscription.planId.limits,
    });

  const limits = planData?.limits || {};

  const canCreate = (resourceKey, currentCount) => {
    const limit = limits[resourceKey];

    if (limit === -1) return true;

    return currentCount < (limit || 0);
  };

  return {
    plan: planKey,
    limits,
    canCreate,
  };
};
