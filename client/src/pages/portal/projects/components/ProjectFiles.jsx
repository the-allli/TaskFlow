import { useState } from "react";
import {
  LayoutGridIcon,
  ListIcon,
  FileTextIcon,
  FileImageIcon,
  FileVideoIcon,
  FileAudioIcon,
  FileCodeIcon,
  FileArchiveIcon,
  FileIcon,
  DownloadIcon,
  EyeIcon,
  XIcon,
  CopyIcon,
  CheckIcon,
} from "lucide-react";
import toast from "react-hot-toast";

const getFileIcon = (mimetype) => {
  if (!mimetype) return FileIcon;
  if (mimetype.startsWith("image/")) return FileImageIcon;
  if (mimetype.startsWith("video/")) return FileVideoIcon;
  if (mimetype.startsWith("audio/")) return FileAudioIcon;
  if (
    mimetype.includes("pdf") ||
    mimetype.includes("word") ||
    mimetype.includes("text")
  )
    return FileTextIcon;
  if (
    mimetype.includes("zip") ||
    mimetype.includes("rar") ||
    mimetype.includes("tar")
  )
    return FileArchiveIcon;
  if (
    mimetype.includes("javascript") ||
    mimetype.includes("json") ||
    mimetype.includes("html") ||
    mimetype.includes("css")
  )
    return FileCodeIcon;
  return FileIcon;
};

const getFileColor = (mimetype) => {
  if (!mimetype) return "text-zinc-400";
  if (mimetype.startsWith("image/")) return "text-purple-500";
  if (mimetype.startsWith("video/")) return "text-red-500";
  if (mimetype.startsWith("audio/")) return "text-pink-500";
  if (mimetype.includes("pdf")) return "text-red-400";
  if (mimetype.includes("word")) return "text-blue-500";
  if (mimetype.includes("zip") || mimetype.includes("rar"))
    return "text-amber-500";
  if (
    mimetype.includes("javascript") ||
    mimetype.includes("json") ||
    mimetype.includes("html")
  )
    return "text-green-500";
  return "text-zinc-400";
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getFileUrl = (file) => file?.url || null;

const isPreviewable = (mimetype) =>
  mimetype?.startsWith("image/") ||
  mimetype?.includes("pdf") ||
  mimetype?.startsWith("video/") ||
  mimetype?.startsWith("audio/");

const handleDownload = async (fileUrl, fileName) => {
  try {
    const response = await fetch(fileUrl);
    if (response.ok) {
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } else {
      window.open(fileUrl, "_blank");
    }
  } catch (error) {
    console.log(error.message);
    window.open(fileUrl, "_blank");
  }
};

const PreviewModal = ({ file, onClose }) => {
  const fileUrl = getFileUrl(file);

  const renderPreview = () => {
    if (file.mimetype?.startsWith("image/")) {
      return (
        <img
          src={fileUrl}
          alt={file.originalName}
          className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-2xl"
        />
      );
    }
    if (file.mimetype?.includes("pdf")) {
      return (
        <iframe
          src={`${fileUrl}#toolbar=0`}
          title={file.originalName}
          className="w-full h-[75vh] rounded-lg border-0 bg-white"
        />
      );
    }
    if (file.mimetype?.startsWith("video/")) {
      return (
        <video controls autoPlay className="max-h-[70vh] max-w-full rounded-lg">
          <source src={fileUrl} type={file.mimetype} />
        </video>
      );
    }
    if (file.mimetype?.startsWith("audio/")) {
      return (
        <div className="w-full max-w-md p-8 bg-zinc-100 dark:bg-zinc-800 rounded-2xl">
          <audio controls className="w-full">
            <source src={fileUrl} type={file.mimetype} />
          </audio>
        </div>
      );
    }
    return (
      <div className="text-center py-16 text-zinc-500 dark:text-zinc-400">
        <FileIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
        <p className="text-sm">Preview not available for this file type.</p>
        <button
          onClick={() => handleDownload(fileUrl, file.originalName)}
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <DownloadIcon className="w-4 h-4" /> Download to view
        </button>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-100 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-5xl overflow-hidden relative shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div
              className={`p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 ${getFileColor(file.mimetype)}`}
            >
              {(() => {
                const Icon = getFileIcon(file.mimetype);
                return <Icon className="w-5 h-5" />;
              })()}
            </div>
            <div className="truncate">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {file.originalName}
              </p>
              <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                {file.mimetype} • {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownload(fileUrl, file.originalName)}
              className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors"
              title="Download"
            >
              <DownloadIcon className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-center bg-zinc-50/50 dark:bg-zinc-950 p-4 min-h-100">
          {renderPreview()}
        </div>
      </div>
    </div>
  );
};

const ProjectFiles = ({ files = [] }) => {
  const [view, setView] = useState("grid");
  const [previewFile, setPreviewFile] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const copyToClipboard = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-zinc-400 dark:text-zinc-600 border-2 border-dashed border-zinc-100 dark:border-zinc-800/50 rounded-2xl">
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-full mb-4">
          <FileIcon className="w-10 h-10 opacity-40" />
        </div>
        <p className="text-sm font-medium">
          No files attached to this project.
        </p>
        <p className="text-xs mt-1">
          Files uploaded here will be stored in the cloud.
        </p>
      </div>
    );
  }

  const FileCard = ({ file }) => {
    const Icon = getFileIcon(file.mimetype);
    const iconColor = getFileColor(file.mimetype);
    const fileUrl = getFileUrl(file);
    const canPreview = isPreviewable(file.mimetype);
    const fileId = file._id || file.cloudinary_id;

    return (
      <div className="group flex flex-col gap-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 hover:bg-white dark:hover:bg-zinc-900 hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200">
        <div className="flex items-center justify-between">
          <div
            className={`p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 ${iconColor}`}
          >
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0">
            <button
              onClick={() => copyToClipboard(fileUrl, fileId)}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
              title="Copy Link"
            >
              {copiedId === fileId ? (
                <CheckIcon className="w-4 h-4 text-green-500" />
              ) : (
                <CopyIcon className="w-4 h-4" />
              )}
            </button>
            {canPreview && (
              <button
                onClick={() => setPreviewFile(file)}
                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                title="Preview"
              >
                <EyeIcon className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => handleDownload(fileUrl, file.originalName)}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
              title="Download"
            >
              <DownloadIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {file.originalName}
          </p>
          <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-500 font-medium">
            <span>{(file.size / 1024).toFixed(0)} KB</span>
            <span>{formatDate(file.createdAt)}</span>
          </div>
        </div>
      </div>
    );
  };

  const FileRow = ({ file }) => {
    const Icon = getFileIcon(file.mimetype);
    const iconColor = getFileColor(file.mimetype);
    const fileUrl = getFileUrl(file);
    const canPreview = isPreviewable(file.mimetype);

    return (
      <div className="group flex items-center gap-4 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 hover:bg-white dark:hover:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
        <div
          className={`p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 shrink-0 ${iconColor}`}
        >
          <Icon className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">
            {file.originalName}
          </p>
          <p className="text-[11px] text-zinc-500 sm:hidden">
            {formatDate(file.createdAt)} • {(file.size / 1024).toFixed(0)} KB
          </p>
        </div>

        <div className="hidden sm:block text-right shrink-0 px-4">
          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            {formatDate(file.createdAt)}
          </p>
          <p className="text-[10px] text-zinc-400">
            {(file.size / 1024).toFixed(0)} KB
          </p>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {canPreview && (
            <button
              onClick={() => setPreviewFile(file)}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
            >
              <EyeIcon className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => handleDownload(fileUrl, file.originalName)}
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
          >
            <DownloadIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-tight">
            Attachments
          </h3>
          <p className="text-xs text-zinc-500">{files.length} items total</p>
        </div>
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg p-1">
          <button
            onClick={() => setView("grid")}
            className={`p-1.5 rounded-md transition-all ${view === "grid" ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
          >
            <LayoutGridIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView("list")}
            className={`p-1.5 rounded-md transition-all ${view === "list" ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
          >
            <ListIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {files.map((file) => (
            <FileCard key={file._id || file.cloudinary_id} file={file} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <FileRow key={file._id || file.cloudinary_id} file={file} />
          ))}
        </div>
      )}

      {previewFile && (
        <PreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </div>
  );
};

export default ProjectFiles;
