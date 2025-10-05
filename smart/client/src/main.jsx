import React from 'react';
import ReactDOM from 'react-dom/client';
// 1. استيراد المكون بالاسم الصحيح: Dashboard
import Dashboard from './Dashboard.jsx';

// 2. استيراد التنسيقات
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';


ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        {/* 3. عرض المكون Dashboard */}
        <Dashboard />
    </React.StrictMode>,
);