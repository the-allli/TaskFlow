import { useEffect, useRef, useState } from "react";
import { Camera, Trash2, Save, AlertTriangle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import useWorkspaceStore from "../../../store/useWorkspaceStore";
import useAuthStore from "../../../store/useAuthStore";

const Settings = () => {
  const {
    fetchWorkspaces,
    currentWorkspace,
    updateWorkspace,
    deleteWorkspace,
  } = useWorkspaceStore();
  const { authUser } = useAuthStore();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [workspaces, setWorkspaces] = useState([]);

  const members = currentWorkspace?.members || [];
  const myMembership = members.find(
    (m) => m?.userId?._id === authUser?._id || m?.userId?._id === authUser?.id,
  );

  const isWorkspaceAdmin = myMembership?.role?.name === "admin";

  useEffect(() => {
    if (currentWorkspace) {
      setName(currentWorkspace.name || "");
      setDescription(currentWorkspace.description || "");
      setPreview(currentWorkspace.image_url || "");
      setSelectedFile(null);
      setWorkspaces(fetchWorkspaces());
    }
  }, [currentWorkspace?._id || currentWorkspace?.id]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (preview && preview.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!name.trim()) return toast.error("Workspace name is required.");

    setIsSaving(true);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);

    if (selectedFile) {
      formData.append("image", selectedFile);
    }

    const workspaceId = currentWorkspace?._id || currentWorkspace?.id;
    const result = await updateWorkspace(workspaceId, formData);

    if (result.success) {
      toast.success("Workspace updated successfully.");
    } else {
      toast.error(result.message);
    }

    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (deleteInput !== currentWorkspace?.name) {
      return toast.error("Workspace name doesn't match.");
    }

    setIsDeleting(true);
    const workspaceId = currentWorkspace?._id || currentWorkspace?.id;
    const result = await deleteWorkspace(workspaceId);

    if (result.success) {
      toast.success("Workspace deleted.");
      navigate("/dashboard");
    } else {
      toast.error(result.message);
      setIsDeleting(false);
    }
  };

  if (workspaces.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <div className="p-4 rounded-full bg-gray-100 dark:bg-zinc-800">
          <AlertTriangle className="size-6 text-gray-400 dark:text-zinc-500" />
        </div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          No workspace found
        </p>
        <p className="text-xs text-gray-500 dark:text-zinc-400">
          Create a workspace to manage its settings.
        </p>
      </div>
    );
  }

  if (!isWorkspaceAdmin) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500 dark:text-zinc-400 text-sm">
        You don't have permission to view workspace settings.
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
          Workspace Settings
        </h1>
        <p className="text-gray-500 dark:text-zinc-400 text-sm">
          Manage your workspace details
        </p>
      </div>

      <div className="border border-gray-200 dark:border-zinc-800 rounded-xl p-6 space-y-6">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
          General
        </h2>

        <div className="flex items-center gap-5">
          <div className="relative">
            <img
              src={preview || "/default-workspace.png"}
              alt="workspace"
              className="w-16 h-16 rounded-xl object-cover bg-gray-100 dark:bg-zinc-800"
            />
            <button
              onClick={() => fileInputRef.current.click()}
              className="absolute -bottom-1.5 -right-1.5 p-1 rounded-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 transition shadow-sm"
            >
              <Camera className="size-3.5 text-gray-600 dark:text-zinc-300" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Workspace Logo
            </p>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
              JPG, PNG or WebP. Recommended 256×256px.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-900 dark:text-zinc-200">
            Workspace Name
          </label>
          <br />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter workspace name"
            className="w-50 rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-zinc-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-900 dark:text-zinc-200">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your workspace..."
            rows={3}
            className="w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-zinc-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none transition-all"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 rounded-md text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium transition disabled:opacity-50 shadow-sm"
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {isWorkspaceAdmin && (
        <div className="border border-red-200 dark:border-red-500/20 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-red-500">Danger Zone</h2>

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Delete this workspace
              </p>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                Permanently deletes the workspace, all members, and all
                projects. This cannot be undone.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-md text-sm border border-red-300 dark:border-red-500/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
            >
              <Trash2 className="size-4" /> Delete
            </button>
          </div>

          {showDeleteConfirm && (
            <div className="mt-4 space-y-3 border-t border-red-100 dark:border-red-500/10 pt-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 text-sm text-red-500">
                <AlertTriangle className="size-4 shrink-0" />
                Type{" "}
                <span className="font-bold">"{currentWorkspace?.name}"</span> to
                confirm.
              </div>
              <input
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder={currentWorkspace?.name}
                className="w-full rounded-md border border-red-300 dark:border-red-500/30 bg-transparent text-gray-900 dark:text-white text-sm px-3 py-2 focus:outline-none focus:border-red-500"
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteInput("");
                  }}
                  className="px-4 py-2 rounded-md text-sm border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={
                    isDeleting || deleteInput !== currentWorkspace?.name
                  }
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-sm bg-red-500 hover:bg-red-600 text-white transition disabled:opacity-50"
                >
                  {isDeleting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                  {isDeleting ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Settings;
