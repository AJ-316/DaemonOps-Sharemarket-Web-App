import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Register from "./screens/Register";
import Login from "./screens/Login";
import Home from "./screens/Home";
import Dashboard from "./screens/Dashboard";

const Routing = () => {
  // const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  // const handleRegistrationComplete = () => {
  //   // After registration, redirect to login
  //   window.location.href = "/login";
  // };

  // const handleLoginSuccess = () => {
  //   setIsAuthenticated(true);
  // };

  return (
    <Routes>
      {/* <Route 
          path="/" 
          element={<Navigate to="/register" replace />} 
        /> */}
      <Route
        path="/register"
        element={
          <Register />
        }
      />
      <Route
        path="/login"
        element={
          <Login />
        }
      />
      <Route
        path="/dashboard"
        element={
          <Dashboard />
        }
      />
      <Route
        path="/"
        element={
          <Home />
          // isAuthenticated ? <Home /> : <Navigate to="/login" replace />
        }
      />
    </Routes>
  );
};

export default Routing;