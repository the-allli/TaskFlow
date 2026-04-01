import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Loader } from "lucide-react";
import { axiosInstance } from "../../../lib/axios";
import useWorkspaceStore from "../../../store/useWorkspaceStore";

const JoinPage = () => {
  const { invite_code } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const role = searchParams.get("role") || "dev";
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const { fetchWorkspaces, setCurrentWorkspace } = useWorkspaceStore();

  useEffect(() => {
    const join = async () => {
      try {
        const res = await axiosInstance.post(
          `/workspace/join/${invite_code}?role=${role}`,
        );

        await fetchWorkspaces();

        const joinedWorkspaceId = res.data.data.workspaceId;
        setCurrentWorkspace(joinedWorkspaceId);

        setStatus("success");
        navigate("/dashboard/team");
      } catch (err) {
        setStatus("error");
        setMessage(err?.response?.data?.message || "Something went wrong.");
      }
    };
    join();
  }, [invite_code]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-zinc-950">
      <div className="text-center space-y-3">
        {status === "loading" && (
          <Loader className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
        )}
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {status === "loading" && "Joining workspace..."}
          {status === "success" && "You've joined the workspace!"}
          {status === "error" && message}
        </h2>
        {status === "success" && (
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Redirecting to dashboard...
          </p>
        )}
      </div>
    </div>
  );
};

export default JoinPage;
