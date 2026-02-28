import axios from "axios";
import {
  APPROVE_MEMBERSHIP_BOOKING_FAILURE,
  CREATE_OFFLINE_BOOKING_FAILURE,
  CREATE_OFFLINE_BOOKING_REQUEST,
  CREATE_OFFLINE_BOOKING_SUCCESS,
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

export const approveMembershipBooking =
  (bookingId, arrivalStatus, arrivalDate = null) =>
  async (dispatch) => {
    try {
      const admintoken = localStorage.getItem("adminToken");

      const { data } = await axios.put(
        `${API_SERVER}/bookings/membership/${bookingId}/arrival`,
        {
          arrivalStatus,
          arrivalDate,
        },
        {
          headers: {
            Authorization: `Bearer ${admintoken}`,
          },
        }
      );

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

export const createOfflineBookingByAdmin = (payload) => async (dispatch) => {
  try {
    dispatch({ type: CREATE_OFFLINE_BOOKING_REQUEST });

    const adminToken = localStorage.getItem("adminToken");
    console.log("[OfflineBooking][Action] create request start");
    console.log("[OfflineBooking][Action] endpoint:", `${API_SERVER}/bookings/booking/offline/create`);
    console.log("[OfflineBooking][Action] token exists:", Boolean(adminToken));
    console.log("[OfflineBooking][Action] payload:", payload);

    const { data } = await axios.post(
      `${API_SERVER}/bookings/booking/offline/create`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      },
    );
    console.log("[OfflineBooking][Action] create success response:", data);

    dispatch({
      type: CREATE_OFFLINE_BOOKING_SUCCESS,
      payload: data.booking,
    });

    return data.booking;
  } catch (error) {
    console.error("[OfflineBooking][Action] create failed");
    console.error("[OfflineBooking][Action] status:", error?.response?.status);
    console.error("[OfflineBooking][Action] response data:", error?.response?.data);
    console.error("[OfflineBooking][Action] message:", error?.message);
    dispatch({
      type: CREATE_OFFLINE_BOOKING_FAILURE,
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};
