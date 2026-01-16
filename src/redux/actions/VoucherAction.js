import axios from "axios";
import { API_SERVER } from "../../config/Key";
import {
  GET_ALL_REQUESTED_REEDEEMED_VOUCHERS_FAILURE,
  GET_ALL_REQUESTED_REEDEEMED_VOUCHERS_REQUEST,
  GET_ALL_REQUESTED_REEDEEMED_VOUCHERS_SUCCESS,
} from "../constants/MembershipConstant";

export const getAllRequestedRedeemVouchers = () => async (dispatch) => {
  try {
    dispatch({ type: GET_ALL_REQUESTED_REEDEEMED_VOUCHERS_REQUEST });

    const admintoken = localStorage.getItem("adminToken");

    const { data } = await axios.get(`${API_SERVER}/vouchers/getall`, {
      headers: {
        Authorization: `Bearer ${admintoken}`,
      },
    });

    dispatch({
      type: GET_ALL_REQUESTED_REEDEEMED_VOUCHERS_SUCCESS,
      payload: data.reedemedVouchers,
    });

    return data.reedemedVouchers;
  } catch (error) {
    dispatch({
      type: GET_ALL_REQUESTED_REEDEEMED_VOUCHERS_FAILURE,
      payload: error.response?.data?.message || error.message,
    });
    console.log(
      "requested redeemed vouchers fetching failure:",
      error.response?.data || error
    );
    throw error;
  }
};
