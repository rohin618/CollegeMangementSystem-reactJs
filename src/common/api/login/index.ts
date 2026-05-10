import { notifyEntity } from "../../../helpers/helpers";
import api from "../../axios";

export interface LoginRequest {
    username: string;
    password: string;
}


import axios from "axios";
import { NOTIFY_TYPE } from "../../constant/app";

export const loginUser = async (data: LoginRequest) => {
    try {
        const response = await api.post("/auth/login", data);

        if (response.data) {
            notifyEntity("Login Successful", NOTIFY_TYPE.CREATE);
        }

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const errorMessage =
                error.response?.data?.message || "Login failed. Please try again.";

            notifyEntity(errorMessage, NOTIFY_TYPE.ERROR);
        } else {
            notifyEntity("Something went wrong", NOTIFY_TYPE.ERROR);
        }

        throw error; // rethrow so login component can also handle it
    }
};