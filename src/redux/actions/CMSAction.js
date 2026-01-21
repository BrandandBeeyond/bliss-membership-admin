import axios from "axios";
import {
  ADD_EXPERIENCE_STORIES_FAILURE,
  ADD_EXPERIENCE_STORIES_REQUEST,
  ADD_EXPERIENCE_STORIES_SUCCESS,
  GET_ALL_EXPERIENCES_REQUEST,
  GET_ALL_EXPERIENCES_SUCCESS,
  UPDATE_EXPERIENCE_STORIES_FAILURE,
  UPDATE_EXPERIENCE_STORIES_REQUEST,
  UPDATE_EXPERIENCE_STORIES_SUCCESS,
} from "../constants/CMSconstant";
import { API_SERVER } from "../../config/Key";
import { GET_ADMIN_DETAILS_FAILURE } from "../constants/AdminConstant";

export const AddExperiencesStories = (formData) => async (dispatch) => {
  try {
    dispatch({ type: ADD_EXPERIENCE_STORIES_REQUEST });

    const admintoken = localStorage.getItem("adminToken");

    const { data } = await axios.post(
      `${API_SERVER}/experiencestory/addstory`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${admintoken}`,
        },
      },
    );

    dispatch({
      type: ADD_EXPERIENCE_STORIES_SUCCESS,
      payload: data.data,
    });

    return data;
  } catch (error) {
    dispatch({
      type: ADD_EXPERIENCE_STORIES_FAILURE,
      payload: error.response?.data?.message || error.message,
    });
    console.log("experience story add failure:", error.response?.data || error);
    throw error;
  }
};

export const getAllExperiences = () => async (dispatch) => {
  try {
    dispatch({ type: GET_ALL_EXPERIENCES_REQUEST });

    const { data } = await axios.get(`${API_SERVER}/experiencestory/getall`);

    dispatch({
      type: GET_ALL_EXPERIENCES_SUCCESS,
      payload: data.data,
    });

    return data;
  } catch (error) {
    dispatch({
      type: GET_ADMIN_DETAILS_FAILURE,
      payload: error.response?.data?.message || error.message,
    });
    console.log(
      "experience story fetching failure:",
      error.response?.data || error,
    );
    throw error;
  }
};

export const UpdateExperiences = (formData, id) => async (dispatch) => {
  try {
    dispatch({ type: UPDATE_EXPERIENCE_STORIES_REQUEST });

    const admintoken = localStorage.get("adminToken");

    const { data } = await axios.put(
      `${API_SERVER}/experiencestory/update/${id}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${admintoken}`,
        },
      },
    );

    dispatch({
      type: UPDATE_EXPERIENCE_STORIES_SUCCESS,
      payload: data.data,
    });

    return data;
  } catch (error) {
    dispatch({
      type: UPDATE_EXPERIENCE_STORIES_FAILURE,
      payload: error.response?.data?.message || error.message,
    });
    console.log(
      "experience story update failure:",
      error.response?.data || error,
    );
    throw error;
  }
};
