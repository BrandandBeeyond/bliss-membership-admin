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
import { AdminAuthReducer } from "./reducers/AdminReducer";
import { VoucherReducer } from "./reducers/VoucherReducer";
import { experienceReducer } from "./reducers/CMSReducer";

const persistConfig = {
  key: "root",
  storage,
  blacklist: ["bookings"],
};

const rootReducer = combineReducers({
  bookings: MembershipBookingReducer,
  adminAuth: AdminAuthReducer,
  vouchers: VoucherReducer,
  experienceStories: experienceReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = createStore(
  persistedReducer,
  composeWithDevTools(applyMiddleware(thunk)),
);

const persistor = persistStore(store);

export { store, persistor };
