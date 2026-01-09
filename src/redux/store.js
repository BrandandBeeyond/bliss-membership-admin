import { composeWithDevTools } from "@redux-devtools/extension";
import {
  applyMiddleware,
  combineReducers,
  legacy_createStore as createStore,
} from "redux";
import { persistReducer, persistStore } from "redux-persist";
import { thunk } from "redux-thunk";
import storage from "redux-persist/lib/storage";
import { MembershipBookingReducer } from "./reducers/MembershipBookingReducer";

const persistConfig = {
  key: "root",
  storage,
};

const rootReducer = combineReducers({
  bookings: MembershipBookingReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

const initalState = {};

const middleware = [thunk];

const store = createStore(
  persistedReducer,
  initalState,
  composeWithDevTools(applyMiddleware(...middleware))
);

const persistor = persistStore(store);

export { store, persistor };
