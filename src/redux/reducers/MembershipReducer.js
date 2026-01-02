import {
  FETCH_MEMBERSHIP_OFFERS_FAILURE,
  FETCH_MEMBERSHIP_OFFERS_REQUEST,
  FETCH_MEMBERSHIP_OFFERS_SUCCESS,
  FETCH_MEMBERSHIP_PLANS_FAILURE,
  FETCH_MEMBERSHIP_PLANS_REQUEST,
  FETCH_MEMBERSHIP_PLANS_SUCCESS,
  GET_MEMBERSHIP_BY_ID_FAILURE,
  GET_MEMBERSHIP_BY_ID_REQUEST,
  GET_MEMBERSHIP_BY_ID_SUCCESS,
} from "../constants/MembershipConstant";

let initialState = {
  loading: false,
  bookings: [],
  error: null,
};

export const MembershipReducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_MEMBERSHIP_PLANS_REQUEST:
    case FETCH_MEMBERSHIP_OFFERS_REQUEST:
    case GET_MEMBERSHIP_BY_ID_REQUEST:
      return {
        ...state,
        loading: true,
      };

    case FETCH_MEMBERSHIP_PLANS_SUCCESS:
      return {
        ...state,
        loading: false,
        membershipplans: action.payload,
        error: null,
      };

    case FETCH_MEMBERSHIP_OFFERS_SUCCESS:
      return {
        ...state,
        loading: false,
        offers: action.payload,
        error: null,
      };

    case GET_MEMBERSHIP_BY_ID_SUCCESS:
      return {
        ...state,
        loading: false,
        plan: action.payload,
      };

    case FETCH_MEMBERSHIP_PLANS_FAILURE:
    case FETCH_MEMBERSHIP_OFFERS_FAILURE:
      return {
        ...state,
        loading: false,
        membershipplans: [],
        offers: [],
        error: action.payload,
      };

    case GET_MEMBERSHIP_BY_ID_FAILURE:
      return {
        ...state,
        loading: false,
        plan: {},
        error: action.payload,
      };

    default:
      return state;
  }
};
