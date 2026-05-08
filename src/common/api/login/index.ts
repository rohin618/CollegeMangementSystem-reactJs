import api from "../../axios";

export interface LoginRequest {
  email: string;
  password: string;
}


export const loginUser = async (data: LoginRequest) => {
  const response = await api.post("/auth/login", data);
  return response.data;
};