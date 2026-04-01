import axios from "axios";
import toast from "react-hot-toast";

export const axiosInstance = axios.create({
  baseURL:
    import.meta.env.MODE === "development"
      ? import.meta.env.VITE_API_BASE_URL
      : "/api",
  withCredentials: true,
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      const retryAfter = error.response.data?.retryAfter;
      const minutes = Math.ceil(retryAfter / 60);

      toast.error(
        `Too many attempts. Please try again in ${minutes} minute${minutes > 1 ? "s" : ""}.`,
        { duration: retryAfter * 1000 },
      );

      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);
