import {
  GET_ALL_BOOKED_MEMBERSHIPS_FAILURE,
  GET_ALL_BOOKED_MEMBERSHIPS_REQUEST,
  GET_ALL_BOOKED_MEMBERSHIPS_SUCCESS,
} from "../constants/MembershipConstant";

let initialState = {
  loading: false,
  bookings: null,
  error: null,
};

export const MembershipBookingReducer = (state = initialState, action) => {
  switch (action.type) {
    case GET_ALL_BOOKED_MEMBERSHIPS_REQUEST:
      return {
        ...state,
        loading: true,
      };

    case GET_ALL_BOOKED_MEMBERSHIPS_SUCCESS:
      return {
        ...state,
        loading: false,
        bookings: action.payload,
      };

    case GET_ALL_BOOKED_MEMBERSHIPS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    default:
      return state;
  }
};
