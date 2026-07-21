import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Offerings from "./pages/Offerings";
import Events from "./pages/Events";
import Updates from "./pages/Updates";
import Members from "./pages/Members";
import Settings from "./pages/Settings";
import PrayerRequests from "./pages/PrayerRequests"; // 👈 Added PrayerRequests Page

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        {/* Protected Admin Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/offerings" element={<ProtectedRoute><Offerings /></ProtectedRoute>} />
        <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
        <Route path="/updates" element={<ProtectedRoute><Updates /></ProtectedRoute>} />
        <Route path="/members" element={<ProtectedRoute><Members /></ProtectedRoute>} />
        <Route path="/prayer-requests" element={<ProtectedRoute><PrayerRequests /></ProtectedRoute>} /> {/* 👈 Added Route */}
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;