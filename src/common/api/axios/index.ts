
import { httpErrorInterceptor } from "../../../helpers/httpErrorInterceptor";
import { HTTTP_STATUS_CODE } from "../../constant/app";
import axiosInstance from "./instance";


/**
 * Supported HTTP methods
 */
export type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

/**
 * API call options
 */
export interface ApiCallOptions<T = any> {
  method?: HttpMethod;
  api: string;
  body?: any;
  params?: Record<string, any>;
  isFormData?: boolean;
  onUploadProgress?: (progressEvent: ProgressEvent) => void;
  signal?: AbortSignal;

  // 🔥 ADD THIS
  responseType?: "json" | "blob";
}
  


/**
 * Generic API caller
 */
export async function apiCall<R = any, B = any>({
  method = "get",
  api,
  body,
  params,
  isFormData = false,
  onUploadProgress,
  signal,
  responseType = "json", 
}: ApiCallOptions<B>): Promise<R> {
  try {
    const url = `${getApiUrl()}${api}`;


    const config:any = {
      params,
      signal,
      onUploadProgress,
      headers: {} as Record<string, string>,
      responseType
    };

    if (isFormData) {
      config.headers["Content-Type"] = "multipart/form-data";
    }

    const response =
      method === "get"
        ? await axiosInstance.get(url, config)
        : await axiosInstance[method](url, body, config);

          // 🔥 IMPORTANT: DO NOT handle blob with handleStatus
    if (responseType === "blob") {
      return response.data as R;
    }

    return handleStatus<R>(response);
  } catch (error) {
    httpErrorInterceptor(error);
    throw error;
  }
}
// notification/invoiveDetailsById'
/**
 * API base URL
 */
const getApiUrl = (): string => {
  const raw: string = import.meta.env.VITE_API_URL ?? '';
  const base = raw.replace(/^['"]|['"]$/g, '').trim();
  return base.endsWith('/') ? base : `${base}/`;
};

/**
 * Response handler
 */
function handleStatus<T>(response: any): T {
  if (response?.status === HTTTP_STATUS_CODE.SUCCESS) {
    return response.data as T;
  }
  throw response;
}
