import axios from "axios";
import { API_SERVER } from "../../config/Key";
import {
  GET_ALL_REQUESTED_REEDEEMED_VOUCHERS_REQUEST,
  GET_ALL_REQUESTED_REEDEEMED_VOUCHERS_SUCCESS,
} from "../constants/MembershipConstant";

export const getAllRequestedRedeemVouchers = () => async (dispatch) => {
  try {
    dispatch({ type: GET_ALL_REQUESTED_REEDEEMED_VOUCHERS_REQUEST });

    const admintoken = localStorage.getItem("admintoken");

    const { data } = await axios.get(`${API_SERVER}/vouchers/getall`, {
      headers: {
        Authorization: `Bearer ${admintoken}`,
      },
    });

    dispatch({
      type: GET_ALL_REQUESTED_REEDEEMED_VOUCHERS_SUCCESS,
      payload: data.reedemedVouchers,
    });
  } catch (error) {}
};
