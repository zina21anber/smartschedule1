import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// استيراد المكونات
import Dashboard from './pages/Dashboard.jsx'; // لوحة تحكم اللجنة/الإدارة
// تأكد من وجود ملف StudentDashboard.jsx أو قم بإزالته إذا لم يكن موجوداً
import StudentDashboard from './pages/StudentDashboard.jsx'; // لوحة تحكم الطالب الجديدة
import Login from './pages/Login.js'; 
import Signup from './pages/Signup.js'; 
import ManageSchedules from './pages/ManageSchedules.jsx'; 
import ManageStudents from './pages/ManageStudents.jsx'; 
import AddExternalCourses from './pages/AddExternalCourses.jsx'; // ✅ استيراد المكون الجديد

// استيراد التنسيقات
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

/**
 * يتحقق مما إذا كان المستخدم مسجلاً دخوله حاليًا
 */
const isAuthenticated = () => {
    return localStorage.getItem('token') !== null && localStorage.getItem('user') !== null;
};

// --------------------------------------------------
// مكونات الحماية المخصصة
// --------------------------------------------------

// يحمي المسارات الإدارية ويحول الطالب إلى لوحة تحكمه
const PrivateRoute = ({ children }) => {
    if (!isAuthenticated()) {
        return <Navigate to="/login" />;
    }
    
    const user = JSON.parse(localStorage.getItem('user'));
    
    // توجيه الطالب إلى لوحة تحكمه الخاصة
    if (user && user.type === 'student') {
        return <Navigate to="/student-dashboard" />;
    }

    return children;
};

// يحمي مسار الطالب ويحول الإداري إلى لوحة تحكمه
const StudentRoute = ({ children }) => {
    const userString = localStorage.getItem('user');
    
    if (!isAuthenticated() || !userString) {
        return <Navigate to="/login" />;
    }
    
    const user = JSON.parse(userString);
    
    // ✅ التحقق من أن نوع المستخدم هو 'student'
    if (user.type === 'student') {
        return children;
    }
    
    // إعادة توجيه أي مستخدم إداري إلى لوحة تحكمه
    return <Navigate to="/dashboard" />;
};


ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <Router>
            <Routes>
                {/* مسارات المصادقة العامة */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} /> 

                {/* 1. مسار لوحة تحكم الطالب المحمية (يجب أن يكون المسار الأساسي /) */}
                <Route path="/" element={<StudentRoute><StudentDashboard /></StudentRoute>} />
                <Route path="/student-dashboard" element={<StudentRoute><StudentDashboard /></StudentRoute>} />

                {/* 2. مسارات الإدارة/اللجنة المحمية */}
                <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/manageschedules" element={<PrivateRoute><ManageSchedules /></PrivateRoute>} />
                <Route path="/managestudents" element={<PrivateRoute><ManageStudents /></PrivateRoute>} />
                <Route path="/addElective" element={<PrivateRoute><AddExternalCourses /></PrivateRoute>} /> {/* ✅ إضافة المسار الجديد */}


                {/* التوجيه لأي مسار غير معروف */}
                <Route 
                    path="*" 
                    element={<Navigate 
                        to={
                            isAuthenticated() 
                                ? (JSON.parse(localStorage.getItem('user')).type === 'student' 
                                    ? "/student-dashboard" 
                                    : "/dashboard") 
                                : "/login"
                        } 
                    />} 
                />
            </Routes>
        </Router>
    </React.StrictMode>,
);
