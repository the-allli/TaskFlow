import { useState, useRef } from "react";
import { X, Upload, Loader2 } from "lucide-react";
import useWorkspaceStore from "../store/useWorkspaceStore";
import { generateSlug } from "../utils";

function CreateWorkspaceModal({ onClose }) {
  const { addWorkspace } = useWorkspaceStore();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null); 
  const [imagePreview, setImagePreview] = useState(null); 

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  const handleNameChange = (e) => {
    const value = e.target.value;
    setName(value);
    setSlug(generateSlug(value));
    if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = "Workspace name is required.";
    if (!slug.trim()) newErrors.slug = "Slug is required.";
    else if (!/^[a-z0-9-]+$/.test(slug))
      newErrors.slug =
        "Slug can only contain lowercase letters, numbers, and hyphens.";
    return newErrors;
  };

  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("slug", slug);
    formData.append("description", description);

    if (image) {
      formData.append("image", image);
    }

    const result = await addWorkspace(formData);

    if (!result.success) {
      setErrors(
        typeof result.message === "object"
          ? result.message
          : { general: result.message },
      );
      setLoading(false);
      return;
    }

    setLoading(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-gray-200 dark:border-zinc-700 p-6 mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Create Workspace
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 dark:border-zinc-600 flex items-center justify-center cursor-pointer hover:border-blue-400 overflow-hidden shrink-0"
          >
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <Upload className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">
              Workspace Icon
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
            >
              Upload image
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="My Workspace"
              className={`w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none ${errors.name ? "border-red-400" : "border-gray-300 dark:border-zinc-600"}`}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
              Slug *
            </label>
            <div className="flex items-center rounded-lg border border-gray-300 dark:border-zinc-600 overflow-hidden">
              <span className="px-3 py-2 text-sm text-gray-400 bg-gray-50 dark:bg-zinc-800">
                workspace/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="flex-1 px-3 py-2 text-sm bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none"
              />
            </div>
            {errors.slug && (
              <p className="text-xs text-red-500 mt-1">{errors.slug}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this workspace for?"
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none resize-none"
            />
          </div>
          {errors.general && (
            <p className="text-xs text-red-500 text-center">{errors.general}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-60 flex items-center gap-2"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {loading ? "Creating..." : "Create Workspace"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateWorkspaceModal;
