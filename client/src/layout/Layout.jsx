import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import useThemeStore from "../store/useThemeStore";
import useModal from "../hooks/useModal";
import usePaymentStore from "../store/usePaymentStore";
import useAuthStore from "../store/useAuthStore";

const Layout = () => {
  const sidebar = useModal();
  const loadTheme = useThemeStore((state) => state.loadTheme);
  const { authUser } = useAuthStore();
  const { fetchSubscription, fetchHistory, getPlans } = usePaymentStore();

  useEffect(() => {
    if (authUser?.id || authUser?._id) {
      fetchSubscription(authUser?.id || authUser?._id);
      fetchHistory(authUser?.id || authUser?._id);
      getPlans();
    }
    loadTheme();
  }, [authUser, fetchSubscription, fetchHistory, getPlans]);

  return (
    <div className="flex bg-white dark:bg-zinc-950 text-gray-900 dark:text-slate-100">
      <Sidebar isSidebarOpen={sidebar.isOpen} onSidebarClose={sidebar.close} />
      <div className="flex-1 flex flex-col h-screen">
        <Navbar onSidebarToggle={sidebar.toggle} />
        <div className="flex-1 h-full p-6 xl:p-10 xl:px-16 overflow-y-scroll">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
