// smart3/client/src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ManageSchedules from './pages/ManageSchedules';
// ✅ هذا هو السطر الذي يحتاج إلى التعديل ليتوافق مع مسار الملف:
import ManageStudents from './pages/ManageStudents'; 
import 'bootstrap/dist/css/bootstrap.min.css';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manageSchedules"
          element={
            <ProtectedRoute>
              <ManageSchedules />
            </ProtectedRoute>
          }
        />

        <Route
          path="/managestudents"
          element={
            <ProtectedRoute>
              <ManageStudents />
            </ProtectedRoute>
          }
        />

        {/* Default and fallback routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;