import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Register from "./screens/Register";
import Login from "./screens/Login";
import Home from "./screens/Home";
import ProtectedRoute from "./ProtectedRoutes";
import AdminRoute from "./AdminRoutes";
import UserDashboard from "./screens/UserDashboard";
import AdminDashboard from "./screens/AdminDashboard";
import PortfolioPage from "./screens/PortfolioPage";
import ProfilePage from "./screens/ProfilePage";
import CompanyDetailPage from "./screens/CompanyDetailPage";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
      <Route path="/portfolio" element={<ProtectedRoute><PortfolioPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/company/:companyId" element={<ProtectedRoute><CompanyDetailPage /></ProtectedRoute>} />
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;