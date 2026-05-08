import axios from "axios";

export const httpErrorInterceptor = (error: any): void => {
  if (axios.isCancel(error)) {
    console.warn("Request cancelled");
    return;
  }

  if (error?.response) {
    console.error(
      `API Error: ${error.response.status}`,
      error.response.data
    );
  } else if (error?.request) {
    console.error("No response from server");
  } else {
    console.error("Error:", error.message);
  }
};
