import { Navigate, Outlet } from "react-router";
import { useSelector } from "react-redux";

const AdminBookingsRoute = () => {
  const { admin } = useSelector((state) => state.adminAuth);
  return admin?.role === "SUPER_ADMIN" || admin?.role === "ADMIN"
    ? <Outlet />
    : <Navigate to="/" replace />;
};

export default AdminBookingsRoute;
