import {
  GET_ALL_REQUESTED_REEDEEMED_VOUCHERS_FAILURE,
  GET_ALL_REQUESTED_REEDEEMED_VOUCHERS_REQUEST,
  GET_ALL_REQUESTED_REEDEEMED_VOUCHERS_SUCCESS,
} from "../constants/MembershipConstant";

let initialState = {
  loading: false,
  vouchers: [],
  error: null,
};

export const VoucherReducer = (state = initialState, action) => {
  switch (action.payload) {
    case GET_ALL_REQUESTED_REEDEEMED_VOUCHERS_REQUEST:
      return {
        ...state,
        loading: true,
      };

    case GET_ALL_REQUESTED_REEDEEMED_VOUCHERS_SUCCESS:
      return {
        ...state,
        loading: false,
        vouchers: action.payload,
      };

    case GET_ALL_REQUESTED_REEDEEMED_VOUCHERS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    default:
      return state;
  }
};
