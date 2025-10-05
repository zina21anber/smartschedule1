import React from 'react';
import ReactDOM from 'react-dom/client';
// استيراد المكونات
import Dashboard from './Dashboard.jsx';
import Login from './Login.jsx';
// استيراد التنسيقات
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

/**
 * يتحقق مما إذا كان المستخدم مسجلاً دخوله حاليًا
 * يتم اعتبار المستخدم مصادقًا إذا كان رمز التوكن (Token) وبيانات المستخدم موجودة في localStorage.
 * @returns {boolean} True إذا كان المستخدم مسجلاً دخوله.
 */
const isAuthenticated = () => {
    return localStorage.getItem('token') !== null && localStorage.getItem('user') !== null;
};

/**
 * المكون الرئيسي الذي يحدد ما يجب عرضه (لوحة التحكم أو صفحة الدخول)
 */
const AppContent = () => {
    // إذا كان المستخدم مصادقًا، نعرض لوحة التحكم.
    if (isAuthenticated()) {
        return <Dashboard />;
    }
    // وإلا، نعرض صفحة تسجيل الدخول.
    return <Login />;
};


ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <AppContent />
    </React.StrictMode>,
);
