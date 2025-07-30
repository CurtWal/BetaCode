import { Navigate } from "react-router-dom";

const PrivateRoute = ({ element, allowedRoles }) => {
  const stored = localStorage.getItem("role");
  let userRoles;

  try {
    const parsed = JSON.parse(stored);
    userRoles = Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    userRoles = stored ? [stored] : [];
  }

  const hasAccess = allowedRoles.some((role) => userRoles.includes(role));

  return hasAccess ? element : <Navigate to="/login" />;
};

export default PrivateRoute;
