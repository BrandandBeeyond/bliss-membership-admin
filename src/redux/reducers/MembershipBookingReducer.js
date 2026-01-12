import {
  APPROVE_MEMBERSHIP_BOOKING_FAILURE,
  APPROVE_MEMBERSHIP_BOOKING_REQUEST,
  APPROVE_MEMBERSHIP_BOOKING_SUCCESS,
  GET_ALL_BOOKED_MEMBERSHIPS_FAILURE,
  GET_ALL_BOOKED_MEMBERSHIPS_REQUEST,
  GET_ALL_BOOKED_MEMBERSHIPS_SUCCESS,
} from "../constants/MembershipConstant";

let initialState = {
  loading: false,
  bookings: [],
  approving:false,
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


    case APPROVE_MEMBERSHIP_BOOKING_REQUEST:
      return {
        ...state,
        approving: true,
        error: null,
      };


    case APPROVE_MEMBERSHIP_BOOKING_SUCCESS:
      return{
        ...state,
        approving: false,
        bookings: state.bookings.map(booking =>
          booking.id === action.payload.id ? action.payload : booking
        ),
      }

    case APPROVE_MEMBERSHIP_BOOKING_FAILURE:
      return {
        ...state,
        approving: false,
        error: action.payload,
      };


    default:
      return state;
  }
};
