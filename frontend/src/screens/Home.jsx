import React from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#ECFDF5] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-[#A7F3D0] text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome Home!</h1>
        <p className="text-gray-600 mb-6">You have successfully logged in.</p>
        <button
          onClick={handleLogout}
          className="bg-[#10B981] hover:bg-[#059669] text-white font-medium py-2 px-6 rounded-xl transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Home;