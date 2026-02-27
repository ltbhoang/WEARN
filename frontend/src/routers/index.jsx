import { Routes, Route, Navigate } from "react-router-dom";
import Home from "../pages/Home";
import Profile from "../pages/Profile";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Dashboard from "../pages/Dashboard";
import Collection from "../pages/Collection";
import CollectionDetail from "../pages/CollectionDetail";
import StreakPage from "../pages/Streak";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/collection" element={<Collection />} />
      <Route path="/collection/:id" element={<CollectionDetail />} />
      <Route path="/streak" element={<StreakPage />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
