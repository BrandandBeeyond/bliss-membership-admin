import {
  ADD_EXPERIENCE_STORIES_FAILURE,
  ADD_EXPERIENCE_STORIES_REQUEST,
  ADD_EXPERIENCE_STORIES_SUCCESS,
  GET_ALL_EXPERIENCES_FAILURE,
  GET_ALL_EXPERIENCES_REQUEST,
  GET_ALL_EXPERIENCES_SUCCESS,
  UPDATE_EXPERIENCE_STORIES_FAILURE,
  UPDATE_EXPERIENCE_STORIES_REQUEST,
  UPDATE_EXPERIENCE_STORIES_SUCCESS,
} from "../constants/CMSconstant";

let initialState = {
  loading: false,
  stories: [],
  error: null,
};

export const experienceReducer = (state = initialState, action) => {
  switch (action.type) {
    case ADD_EXPERIENCE_STORIES_REQUEST:
    case GET_ALL_EXPERIENCES_REQUEST:
    case UPDATE_EXPERIENCE_STORIES_REQUEST:
      return {
        ...state,
        loading: true,
      };

    case ADD_EXPERIENCE_STORIES_SUCCESS:
      return {
        ...state,
        loading: false,
        stories: [...state.stories, action.payload],
      };

    case UPDATE_EXPERIENCE_STORIES_SUCCESS:
      return {
        ...state,
        loading: false,
        stories: state.stories.map((item) =>
          item._id === action.payload._id ? action.payload : item,
        ),
      };

    case GET_ALL_EXPERIENCES_SUCCESS:
      return {
        ...state,
        loading: false,
        stories: action.payload,
      };

    case ADD_EXPERIENCE_STORIES_FAILURE:
    case GET_ALL_EXPERIENCES_FAILURE:
    case UPDATE_EXPERIENCE_STORIES_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    default:
      return state;
  }
};
