import {
  ADMIN_LOGIN_FAILURE,
  ADMIN_LOGIN_REQUEST,
  ADMIN_LOGIN_SUCCESS,
  ADMIN_LOGOUT,
} from "../constants/AdminConstant";

const adminFromStorage = localStorage.getItem("adminInfo")
  ? JSON.parse(localStorage.getItem("adminInfo"))
  : null;

const tokenFromStorage = localStorage.getItem("adminToken");

const initialState = {
  loading: false,
  admin: adminFromStorage,
  token: tokenFromStorage,
  isAuthenticated: !!tokenFromStorage,
  error: null,
};

export const AdminAuthReducer = (state = initialState, action) => {
  switch (action.type) {
    case ADMIN_LOGIN_REQUEST:
      return {
        ...state,
        loading: true,
      };

    case ADMIN_LOGIN_SUCCESS:
      return {
        ...state,
        loading: false,
        admin: action.payload,
        token: action.payload,
        isAuthenticated: true,
        error: null,
      };

    case ADMIN_LOGIN_FAILURE:
      return {
        loading: false,
        error: action.payload,
        isAuthenticated: false,
      };

    case ADMIN_LOGOUT:
      return {
        ...state,
        loading: false,
        token: null,
        admin: null,
        isAuthenticated: false,
      };

    default:
      return state;
  }
};
