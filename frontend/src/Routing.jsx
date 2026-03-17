import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Register from "./screens/Register";
import Login from "./screens/Login";
import Home from "./screens/Home";


const Routing = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  const handleRegistrationComplete = () => {
    // After registration, redirect to login
    window.location.href = "/login";
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={<Navigate to="/register" replace />} 
        />
        <Route 
          path="/register" 
          element={
            <Register onComplete={handleRegistrationComplete} />
          } 
        />
        <Route 
          path="/login" 
          element={
            <Login onLoginSuccess={handleLoginSuccess} />
          } 
        />
        <Route 
          path="/home" 
          element={
            isAuthenticated ? <Home /> : <Navigate to="/login" replace />
          } 
        />
      </Routes>
    </BrowserRouter>
  );
};

export default Routing;