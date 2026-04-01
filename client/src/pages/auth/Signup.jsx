import { motion } from "framer-motion";
import {
  Loader,
  Lock,
  Mail,
  User,
  ShieldCheck,
  ChevronDown,
  Eye,
  EyeOff,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../../components/Input";
import PasswordStrengthMeter from "./components/PasswordStrengthMeter";
import useAuthStore from "../../store/useAuthStore";

const SignUpPage = () => {
  const [userRole, setUserRole] = useState("admin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const { signup, error, isLoading } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userData = {
      userRole,
      name,
      email,
      password,
    };
    try {
      await signup(userData);
      navigate("/varify_email");
    } catch (error) {
      console.log(error.message);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-xl rounded-2xl shadow-xl 
			overflow-hidden"
      >
        <div className="pt-8 px-8 pb-3">
          <h2 className="text-3xl font-bold mb-6 text-center bg-linear-to-r from-[#2a7dff] to-sky-300 text-transparent bg-clip-text">
            Create Account
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <ShieldCheck className="size-5 text-sky-300" />
              </div>
              <select
                value={userRole}
                onChange={(e) => {
                  setUserRole(e.target.value);
                  e.target.blur();
                }}
                onFocus={() => setIsOpen(true)}
                onBlur={() => setIsOpen(false)}
                className="w-full pl-10 pr-10 py-2 bg-gray-800 bg-opacity-50 rounded-lg border border-gray-700 
                           focus:border-sky-500 focus:ring-2 focus:ring-sky-500 text-white transition duration-200 
                           outline-none appearance-none cursor-pointer"
              >
                <option value="admin" className="bg-gray-800">
                  Admin
                </option>
                <option value="manager" className="bg-gray-800">
                  Manager
                </option>
                <option value="dev" className="bg-gray-800">
                  Developer
                </option>
              </select>

              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center"
                >
                  <ChevronDown className="size-5 text-gray-400" />
                </motion.div>
              </div>
            </div>

            <Input
              icon={User}
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              icon={Mail}
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {[
              {
                name: "password",
                value: password,
                set: setPassword,
                show: showPassword,
                toggle: () => setShowPassword((p) => !p),
              },
            ].map(({ value, set, show, toggle }) => (
              <div className="space-y-1.5" key={name}>
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

            {error && (
              <p className="text-red-500 font-semibold mt-2">{error}</p>
            )}

            <PasswordStrengthMeter password={password} />

            <div className="flex items-center justify-center">
              <motion.button
                className="cursor-pointer mt-5 py-3 px-4 bg-linear-to-r from-[#2a7dff] to-sky-300 text-white 
              font-bold rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2
              focus:ring-offset-gray-900 transition duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader className=" animate-spin mx-auto" size={24} />
                ) : (
                  "Sign Up"
                )}
              </motion.button>
            </div>
          </form>
        </div>
        <div className="px-8 py-4 bg-gray-900 bg-opacity-50 flex justify-center">
          <p className="text-sm text-gray-400">
            Already have an account?{" "}
            <Link
              to={"/login"}
              className="cursor-pointer text-sky-400 hover:underline"
            >
              Login
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
export default SignUpPage;
