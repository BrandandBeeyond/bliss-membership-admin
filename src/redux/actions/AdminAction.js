import axios from "axios";
import {
  ADMIN_LOGIN_FAILURE,
  ADMIN_LOGIN_REQUEST,
  ADMIN_LOGIN_SUCCESS,
  ADMIN_LOGOUT,
} from "../constants/AdminConstant";
import { API_SERVER } from "../../config/Key";

export const AdminLogin = (payload) => async (dispatch) => {
  try {
    dispatch({ type: ADMIN_LOGIN_REQUEST });

    const { data } = await axios.post(`${API_SERVER}/admin/login`, payload);

    dispatch({
      type: ADMIN_LOGIN_SUCCESS,
      payload: data,
    });

    localStorage.setItem("adminToken", data.token);
    localStorage.setItem("adminInfo", JSON.stringify(data.admin));
  } catch (error) {
    dispatch({
      type: ADMIN_LOGIN_FAILURE,
      payload: error.response?.data?.message || error.message,
    });
  }
};

export const AdminLogout = () => async (dispatch) => {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminInfo");

  dispatch({ type: ADMIN_LOGOUT });
};
