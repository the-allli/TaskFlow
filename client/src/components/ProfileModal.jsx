import { useState, useRef } from "react";
import { X, Camera, Lock, Check } from "lucide-react";
import useAuthStore from "../store/useAuthStore";

export const ProfileModal = ({ onClose, authUser }) => {
  const { updateProfile, changePassword } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState("profile");
  const [name, setName] = useState(authUser?.name || "");
  const [email] = useState(authUser?.email || "");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(authUser?.dp || "");
  const fileInputRef = useRef(null);

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleProfileSave = async () => {
    setProfileLoading(true);
    try {
      await updateProfile(name, selectedFile);
      setProfileSuccess(true);
      setTimeout(() => {
        setProfileSuccess(false);
        onClose();
      }, 1000);
    } catch (error) {
      console.error(error);
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSave = async () => {
    setPasswordError("");
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }
    setPasswordLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setPasswordSuccess(false);
        onClose();
      }, 1000);
    } catch (error) {
      setPasswordError(
        error.response?.data?.message || "Error changing password",
      );
    } finally {
      setPasswordLoading(false);
    }
  };
  return (
    <div
      onClick={handleBackdrop}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <div className="w-full max-w-md mx-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-700 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Account Settings
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex border-b border-gray-100 dark:border-zinc-800">
          {["profile", "password"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-white"
              }`}
            >
              {tab === "profile" ? "Profile" : "Password"}
            </button>
          ))}
        </div>

        <div className="px-6 py-6 space-y-5">
          {activeTab === "profile" && (
            <>
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt={authUser?.name}
                    className="size-20 rounded-full ring-4 ring-gray-100 dark:ring-zinc-700 object-cover"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="absolute bottom-0 right-0 size-6 bg-blue-600 rounded-full flex items-center justify-center shadow-md hover:bg-blue-700 transition"
                  >
                    <Camera size={12} className="text-white" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 dark:text-zinc-500">
                  {selectedFile
                    ? selectedFile.name
                    : "Click icon to change avatar"}
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">
                  Full Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">
                  Email
                </label>
                <input
                  value={email}
                  disabled
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800/60 text-sm text-gray-400 dark:text-zinc-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 dark:text-zinc-600">
                  Email cannot be changed.
                </p>
              </div>
              <button
                onClick={handleProfileSave}
                disabled={profileLoading}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium transition flex items-center justify-center gap-2"
              >
                {profileLoading ? (
                  <span className="size-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : profileSuccess ? (
                  <>
                    <Check size={15} /> Saved!
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </>
          )}

          {activeTab === "password" && (
            <>
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                <Lock size={15} className="text-blue-500 shrink-0" />
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Use a strong password with letters, numbers and symbols.
                </p>
              </div>

              {[
                {
                  label: "Current Password",
                  value: currentPassword,
                  set: setCurrentPassword,
                  show: showCurrent,
                },
                {
                  label: "New Password",
                  value: newPassword,
                  set: setNewPassword,
                  show: showNew,
                },
                {
                  label: "Confirm New Password",
                  value: confirmPassword,
                  set: setConfirmPassword,
                  show: showConfirm,
                },
              ].map(({ label, value, set, show }) => (
                <div key={label} className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">
                    {label}
                  </label>
                  <div className="relative">
                    <input
                      type={show ? "text" : "password"}
                      value={value}
                      onChange={(e) => set(e.target.value)}
                      className="w-full px-3 py-2 pr-10 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                </div>
              ))}

              {passwordError && (
                <p className="text-xs text-red-500">{passwordError}</p>
              )}

              <button
                onClick={handlePasswordSave}
                disabled={passwordLoading}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium transition flex items-center justify-center gap-2"
              >
                {passwordLoading ? (
                  <span className="size-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : passwordSuccess ? (
                  <>
                    <Check size={15} /> Updated!
                  </>
                ) : (
                  "Update Password"
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
