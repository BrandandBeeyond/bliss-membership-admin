import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router";

const SuperAdminRoute = () => {
  const { isAuthenticated, admin } = useSelector((state) => state.adminAuth);

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  if (admin?.role !== "SUPER_ADMIN") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default SuperAdminRoute;
