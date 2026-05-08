import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

/**
 * Get auth token
 */
export const getToken = (): string => {
  return localStorage.getItem("token") || "";
};

/**
 * Axios instance
 */
const axiosInstance: AxiosInstance = axios.create({
  timeout: 60_000,
});

/**
 * ✅ Request interceptor (Axios v1+ compatible)
 */
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = getToken();

    // ✅ headers is ALWAYS defined in InternalAxiosRequestConfig
    if (token) {
      config.headers.Authorization = token;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor
 */
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => Promise.reject(error)
);

export default axiosInstance;
