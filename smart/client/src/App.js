// smart3/client/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ManageSchedules from './pages/ManageSchedules'; // تأكد أن الملف موجود
import 'bootstrap/dist/css/bootstrap.min.css';

// الحماية الأصلية - معلّقة مؤقتاً
// function ProtectedRoute({ children }) {
//   const token = localStorage.getItem('token');
//   return token ? children : <Navigate to="/login" replace />;
// }

// مؤقتاً: إلغاء التحقق من التوكن
function ProtectedRoute({ children }) {
  return children; // السماح بالدخول بدون تحقق
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* صفحة الداشبورد بدون تحقق مؤقتاً */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* صفحة إدارة الجداول */}
        <Route
          path="/manageSchedules"
          element={
            <ProtectedRoute>
              <ManageSchedules />
            </ProtectedRoute>
          }
        />

        {/* إعادة التوجيه للرابط الافتراضي */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
