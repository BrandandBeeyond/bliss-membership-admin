import { composeWithDevTools } from "@redux-devtools/extension";
import {
  applyMiddleware,
  combineReducers,
  legacy_createStore as createStore,
} from "redux";
import { persistReducer, persistStore } from "redux-persist";
import { thunk } from "redux-thunk";
import { MembershipBookingReducer } from "./reducers/MembershipBookingReducer";

const persistConfig = {
  key: "root",
  storage,
};

const rootReducer = combineReducers({});

const persistedReducer = persistReducer(persistConfig, rootReducer);

const initalState = {
  bookings: MembershipBookingReducer,
};

const middleware = [thunk];

const store = createStore(
  persistedReducer,
  initalState,
  composeWithDevTools(applyMiddleware(...middleware))
);

const persistor = persistStore(store);

export { store, persistor };
