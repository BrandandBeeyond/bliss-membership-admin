import axios from "axios";
import { API_SERVER } from "../../config/Key";
import {
  GET_ALL_REQUESTED_REEDEEMED_VOUCHERS_FAILURE,
  GET_ALL_REQUESTED_REEDEEMED_VOUCHERS_REQUEST,
  GET_ALL_REQUESTED_REEDEEMED_VOUCHERS_SUCCESS,
  VERIFY_REEDEMPTION_FAILURE,
  VERIFY_REEDEMPTION_REQUEST,
  VERIFY_REEDEMPTION_SUCCESS,
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
      error.response?.data || error,
    );
    throw error;
  }
};

export const verifyVoucherwithCode = (payload) => async (dispatch) => {
  try {
    dispatch({ type: VERIFY_REEDEMPTION_REQUEST });

    const admintoken = localStorage.getItem("adminToken");

    const { data } = await axios.post(
      `${API_SERVER}/vouchers/voucher/redeem/approve-with-code`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${admintoken}`,
        },
      },
    );

    dispatch({
      type: VERIFY_REEDEMPTION_SUCCESS,
      payload: data.data,
    });

    return data;
  } catch (error) {
    dispatch({
      type: VERIFY_REEDEMPTION_FAILURE,
      payload: error.response?.data?.message || error.message,
    });
    console.log(
      "voucher reedeem verification failure:",
      error.response?.data || error,
    );
    throw error;
  }
};
