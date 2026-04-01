import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Lock, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../../store/useAuthStore";

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const { resetPassword, error, isLoading, message } = useAuthStore();

  const { token } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    try {
      await resetPassword(token, password);
      toast.success(
        "Password reset successfully, redirecting to login page...",
      );
      navigate("/login");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Error resetting password");
    }
  };
  return (
    <div className="w-full min-h-screen flex items-center justify-center mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="p-8">
          <h2 className="text-3xl font-bold mb-6 text-center bg-linear-to-r from-[#2a7dff] to-sky-300 text-transparent bg-clip-text">
            Reset Password
          </h2>

          <form onSubmit={handleSubmit}>
            {[
              {
                placeholder: "New Password",
                value: password,
                set: setPassword,
                show: showPassword,
                toggle: () => setShowPassword((p) => !p),
              },
              {
                placeholder: "Confirm New Password",
                value: confirmPassword,
                set: setConfirmPassword,
                show: showConfirm,
                toggle: () => setShowConfirm((p) => !p),
              },
            ].map(({ placeholder, value, set, show, toggle }) => (
              <div className="space-y-1.5">
                <div className="relative mb-6">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Lock className="size-5 text-sky-300" />
                  </div>
                  <input
                    type={show ? "text" : "password"}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-gray-800 bg-opacity-50 rounded-lg border border-gray-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-500 outline-none text-white placeholder-gray-400 transition duration-200"
                  />
                  <button
                    type="button"
                    onClick={toggle}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition"
                  >
                    {show ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-center">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="cursor-pointer py-3 px-4 bg-linear-to-r from-[#2a7dff] to-sky-300 text-white font-bold rounded-lg shadow-lg  focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-200"
                type="submit"
              >
                {isLoading ? "Resetting..." : "Set New Password"}{" "}
              </motion.button>
            </div>
          </form>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          {message && <p className="text-green-500 text-sm mb-4">{message}</p>}
        </div>
      </motion.div>
    </div>
  );
};
export default ResetPasswordPage;
