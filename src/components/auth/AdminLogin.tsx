import React from "react";
import { Navigate } from "react-router-dom";

/**
 * Legacy Admin Login Portal Redirection.
 * Orion-9 uses a Single Login architecture (/login).
 * Administrators authenticate through /login and access administrative capabilities
 * via the OS Desktop (Settings -> Administration) with step-up authentication.
 */
export const AdminLogin: React.FC = () => {
  return <Navigate to="/login" replace />;
};
