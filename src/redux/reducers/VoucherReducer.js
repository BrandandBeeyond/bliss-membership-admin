import {
  GET_ALL_REQUESTED_REEDEEMED_VOUCHERS_FAILURE,
  GET_ALL_REQUESTED_REEDEEMED_VOUCHERS_REQUEST,
  GET_ALL_REQUESTED_REEDEEMED_VOUCHERS_SUCCESS,
  VERIFY_REEDEMPTION_FAILURE,
  VERIFY_REEDEMPTION_REQUEST,
  VERIFY_REEDEMPTION_SUCCESS,
} from "../constants/MembershipConstant";

let initialState = {
  loading: false,
  vouchers: [],
  error: null,
  verifying: false,
};

export const VoucherReducer = (state = initialState, action) => {
  switch (action.type) {
    case GET_ALL_REQUESTED_REEDEEMED_VOUCHERS_REQUEST:
      return {
        ...state,
        loading: true,
      };

    case VERIFY_REEDEMPTION_REQUEST:
      return {
        ...state,
        verifying: true,
      };

    case VERIFY_REEDEMPTION_SUCCESS:
      return {
        ...state,
        verifying: false,
        vouchers: state.vouchers.map((v) =>
          v._id === action.payload._id ? { ...v, ...action.payload } : v,
        ),
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

    case VERIFY_REEDEMPTION_FAILURE:
      return {
        ...state,
        verifying: false,
        error: action.payload,
      };

    default:
      return state;
  }
};
