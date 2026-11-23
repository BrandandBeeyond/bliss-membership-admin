import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";

import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";

import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";

import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import Bookings from "./pages/bookings/Bookings";
import UserArrivals from "./pages/bookings/UserArrivals";
import MembershipClaims from "./pages/bookings/MembershipClaims";
import Updates from "./pages/updates/Updates";
import Guests from "./pages/guests/Guests";
import SignIn from "./pages/AuthPages/SignIn";
import PublicRoute from "./routes/PublicRoute";
import ProtectedRoute from "./routes/ProtectedRoute";
import SuperAdminRoute from "./routes/SuperAdminRoute";
import AdminBookingsRoute from "./routes/AdminBookingsRoute";
import Voucher from "./pages/vouchers/Voucher";
import ExperienceStories from "./pages/stories/ExperienceStories";
import Admins from "./pages/Admins/Admins";
import { ToastContainer } from "react-toastify";
// import Button from "./components/ui/button/Button";
import "react-toastify/dist/ReactToastify.css";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
         <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          draggable
          theme="dark"
        />
        <Routes>
          {/* Dashboard Layout */}

          <Route element={<PublicRoute />}>
            <Route path="/signin" element={<SignIn />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index path="/" element={<Home />} />

              <Route element={<SuperAdminRoute />}>
                <Route path="/admins" element={<Admins />} />
              </Route>

              <Route element={<AdminBookingsRoute />}>
                <Route path="/guests" element={<Guests />} />
                <Route path="/customers" element={<Navigate to="/guests" replace />} />
              </Route>

              {/* Others Page */}
              <Route path="/profile" element={<UserProfiles />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/blank" element={<Blank />} />

              {/* Forms */}
              <Route path="/form-elements" element={<FormElements />} />



              {/* Charts */}
              <Route path="/line-chart" element={<LineChart />} />
              <Route path="/bar-chart" element={<BarChart />} />

              <Route path="/membership-claimed" element={<MembershipClaims />} />
              <Route path="/bookings" element={<Bookings />} />
              <Route path="/offline-bookings" element={<Navigate to="/bookings" replace />} />
              <Route path="/user-arrivals" element={<UserArrivals />} />
              <Route path="/vouchers" element={<Voucher />} />
              <Route path="/experience-bliss-living" element={<ExperienceStories />} />
              <Route path="/updates" element={<Updates />} />
            </Route>
          </Route>

          {/* Auth Layout */}

          {/* updated routes */}

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}


