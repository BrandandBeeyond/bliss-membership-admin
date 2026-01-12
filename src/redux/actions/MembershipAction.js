import axios from "axios";
import {
  APPROVE_MEMBERSHIP_BOOKING_FAILURE,
  APPROVE_MEMBERSHIP_BOOKING_SUCCESS,
  GET_ALL_BOOKED_MEMBERSHIPS_FAILURE,
  GET_ALL_BOOKED_MEMBERSHIPS_REQUEST,
  GET_ALL_BOOKED_MEMBERSHIPS_SUCCESS,
} from "../constants/MembershipConstant";
import { API_SERVER } from "../../config/Key";

export const getAllBookings = () => async (dispatch) => {
  try {
    dispatch({ type: GET_ALL_BOOKED_MEMBERSHIPS_REQUEST });

    const { data } = await axios.get(`${API_SERVER}/bookings/allbookings`);

    dispatch({
      type: GET_ALL_BOOKED_MEMBERSHIPS_SUCCESS,
      payload: data.bookings,
    });

  
    return data.bookings;
  } catch (error) {
    dispatch({
      type: GET_ALL_BOOKED_MEMBERSHIPS_FAILURE,
      payload: error.response?.data?.message || error.message,
    });
    console.log(
      "membership bookings fetching failure:",
      error.response?.data || error
    );

    throw error;
  }
};


export const approveMembershipBooking = (bookingId,arrivalStatus,arrivalDate = null) => async (dispatch) => {
  try {
    const { data } = await axios.put(`${API_SERVER}/bookings/approve/${bookingId}`, {
      arrivalStatus,
      arrivalDate
    });

    dispatch({
      type: APPROVE_MEMBERSHIP_BOOKING_SUCCESS,
      payload: data.booking,
    });
  } catch (error) {
    dispatch({
      type: APPROVE_MEMBERSHIP_BOOKING_FAILURE,
      payload: error.response?.data?.message || error.message,
    });
  }
};