import { motion } from "framer-motion";
import { useState } from "react";
import { Mail, Lock, Loader, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../../components/Input";
import useAuthStore from "../../store/useAuthStore";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      console.log("Login failed, staying on login page.", err.message);
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
        <div className="pt-8 px-8 pb-3">
          <h2 className="text-3xl font-bold mb-6 text-center bg-linear-to-r from-[#2a7dff] to-sky-300 text-transparent bg-clip-text">
            Welcome Back
          </h2>

          <form onSubmit={handleLogin}>
            <Input
              icon={Mail}
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {[
              {
                value: password,
                set: setPassword,
                show: showPassword,
                toggle: () => setShowPassword((p) => !p),
              },
            ].map(({ value, set, show, toggle }) => (
              <div className="space-y-1.5">
                <div className="relative mb-6">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Lock className="size-5 text-sky-300" />
                  </div>
                  <input
                    type={show ? "text" : "password"}
                    placeholder="Password"
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

            <div className="flex items-center mb-6">
              <Link
                to="/forgot_password"
                className="text-sm text-sky-400 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            {error && (
              <p className="text-red-500 font-semibold mb-2">{error}</p>
            )}

            <div className="flex items-center justify-center">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="cursor-pointer py-3 px-4 bg-linear-to-r from-[#2a7dff] to-sky-300 text-white font-bold rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-200"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader className="w-6 h-6 animate-spin  mx-auto" />
                ) : (
                  "Login"
                )}{" "}
              </motion.button>
            </div>
          </form>
        </div>
        <div className="px-8 py-4 bg-gray-900 bg-opacity-50 flex justify-center">
          <p className="text-sm text-gray-400">
            Don't have an account?{" "}
            <Link to="/signup" className="text-sky-400 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
export default LoginPage;
