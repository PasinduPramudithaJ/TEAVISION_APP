import React, { JSX } from "react";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const isSignedIn = localStorage.getItem("isSignedIn") === "true";
  const storedUser = localStorage.getItem("user");
  const location = useLocation();

  if (!isSignedIn) {
    // Not signed in → redirect to login
    return <Navigate to="/" replace />;
  }

  // Check user data
  let user = null;
  let isAdmin = false;
  
  try {
    user = storedUser ? JSON.parse(storedUser) : null;
    // Check admin status from is_admin field or email fallback
    isAdmin = user && (user.is_admin === true || user.email === "pramudithapasindu48@gmail.com");
  } catch (e) {
    // Invalid user data, redirect to login
    localStorage.removeItem("isSignedIn");
    localStorage.removeItem("user");
    return <Navigate to="/" replace />;
  }

  if (location.pathname === "/super") {
    // Trying to access /super page - check admin status
    if (!isAdmin) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Admin auto-redirect to /super if logged in and visiting normal user pages
  if (isAdmin && location.pathname !== "/super" && location.pathname !== "/settings") {
    return <Navigate to="/super" replace />;
  }

  return children;
};

export default ProtectedRoute;
