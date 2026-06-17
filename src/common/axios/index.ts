import axios from "axios";
import { EXIST_SESSION_STORAGE_NAMES } from "../constant";

const api = axios.create({
  baseURL: "http://localhost:8080/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(EXIST_SESSION_STORAGE_NAMES.AUTH_TOKEN_CMS);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(EXIST_SESSION_STORAGE_NAMES.AUTH_TOKEN_CMS);
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;